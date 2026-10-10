/**
 * Preference Weights Service
 * Manages learning from user feedback (likes/dislikes) to improve recommendations
 */

import {
  ImpressionModel,
  PreferenceWeightsModel,
  RecommendationHistoryModel,
  ViewingProgressModel,
} from '@/infrastructure/db/models';
import { tmdbClient } from '@/infrastructure/external/tmdb.client';
import { TTLCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { seenKey } from '@/services/history.service';
import { Types } from 'mongoose';

export type LearnAction = 'LIKED' | 'WATCHED' | 'PLAYED' | 'DISLIKED' | 'BLACKLISTED' | 'SKIPPED';

/** Points per signal. X: explicit negatives dwarf passive ones; passive signals stay small. */
const DELTA: Record<LearnAction, number> = {
  LIKED: 5,
  WATCHED: 4,       // marked seen, or a qualified play (10 min / 20% of runtime)
  PLAYED: 1,        // first open of a title only (X video_open 0.07 vs like 0.5)
  DISLIKED: -3,
  BLACKLISTED: -8,  // "never again"
  SKIPPED: -1,      // "not tonight"
};
const MIN_WEIGHT = 0;      // Minimum weight value
const MAX_WEIGHT = 100;    // Maximum weight value
const DEFAULT_WEIGHT = 50; // Starting weight for new items

const DAY_MS = 24 * 60 * 60 * 1000;
/** Weights drift back to 50 lazily (X SimClusters fav graph: 100-day half-life). */
const HALF_LIFE_DAYS = 100;

/** Impression-based hit rates (see blend()). */
const RATE_WINDOW_DAYS = 120;      // matches the impressions TTL
const FEED_IMPRESSION_WEIGHT = 0.25; // a rail card is a glance; the hero is a real offer
const PRIOR_IMPRESSIONS = 10;      // Beta prior strength at the user's global rate (X author_cold_start)
const MIN_IMPRESSIONS = 5;         // below this a key keeps its additive weight
const BLEND_EVIDENCE = 20;         // alpha = imps / (imps + 20)
const MAX_ALPHA = 0.5;             // rates re-rank; they never fully overwrite explicit taste
const RATES_TTL_MS = 5 * 60 * 1000;

type Tally = Map<string, { imps: number; hits: number }>;
interface Rates {
  global: number;
  genre: Tally;
  language: Tally;
  contentType: Tally;
}

// ponytail: module-local cache, not in /api/cache-stats; move into lib/cache.ts if it needs watching.
const ratesCache = new TTLCache<Rates | null>({ name: 'impression-rates', maxSize: 1000 });

const decayFactor = (from: Date | string | undefined, now: number) =>
  from ? 0.5 ** (Math.max(0, now - new Date(from).getTime()) / DAY_MS / HALF_LIFE_DAYS) : 1;
const decayed = (w: number, f: number) => DEFAULT_WEIGHT + (w - DEFAULT_WEIGHT) * f;
const clamp = (w: number) => Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, w));

/**
 * Pull additive weights toward the empirical hit rate where there is evidence.
 * Rate is the Beta posterior mean with the user's global rate as prior; written
 * as pseudo-counts so it stays valid when feed weighting pushes rates above 1.
 */
function blend(additive: Record<string, number>, tally: Tally | undefined, global: number) {
  if (!tally) return additive;
  const out = { ...additive };
  for (const [key, { imps, hits }] of tally) {
    if (imps < MIN_IMPRESSIONS) continue;
    const rate = (hits + global * PRIOR_IMPRESSIONS) / (imps + PRIOR_IMPRESSIONS);
    const empirical = clamp((DEFAULT_WEIGHT * rate) / global);
    const alpha = Math.min(MAX_ALPHA, imps / (imps + BLEND_EVIDENCE));
    out[key] = (1 - alpha) * (additive[key] ?? DEFAULT_WEIGHT) + alpha * empirical;
  }
  return out;
}

interface UpdateWeightsParams {
  userId: string;
  action: LearnAction;
  genreIds: number[];
  contentType: string;
  language: string;
}

export class PreferenceWeightsService {
  /**
   * Update preference weights based on user action
   * LIKED: Increase genre/language/contentType weights
   * DISLIKED: Decrease genre/language/contentType weights
   */
  static async updateWeights(params: UpdateWeightsParams): Promise<void> {
    const { userId, action, genreIds, contentType, language } = params;
    const delta = DELTA[action];

    // Find or create weights document for user
    let weights = await PreferenceWeightsModel.findOne({ userId });
    const now = Date.now();

    if (weights) {
      // Decay what's stored up to now before adding, so a new signal lands on today's value.
      const f = decayFactor(weights.decayedAt ?? weights.updatedAt, now);
      for (const m of [weights.genreWeights, weights.contentTypeWeights, weights.languageWeights] as Map<string, number>[]) {
        for (const [k, w] of m) m.set(k, decayed(w, f));
      }
    } else {
      weights = new PreferenceWeightsModel({
        userId,
        genreWeights: new Map(),
        contentTypeWeights: new Map([
          ['MOVIE', DEFAULT_WEIGHT],
          ['SERIES', DEFAULT_WEIGHT],
          ['ANIME', DEFAULT_WEIGHT],
        ]),
        languageWeights: new Map(),
        totalLikes: 0,
        totalDislikes: 0,
      });
    }
    weights.decayedAt = new Date(now);

    // Update genre weights
    for (const genreId of genreIds) {
      const genreKey = String(genreId);
      const currentWeight = weights.genreWeights.get(genreKey) ?? DEFAULT_WEIGHT;
      const newWeight = this.calculateNewWeight(currentWeight, delta);
      weights.genreWeights.set(genreKey, newWeight);
    }

    // Update content type weight
    if (contentType) {
      const currentTypeWeight = weights.contentTypeWeights.get(contentType) ?? DEFAULT_WEIGHT;
      const newTypeWeight = this.calculateNewWeight(currentTypeWeight, delta);
      weights.contentTypeWeights.set(contentType, newTypeWeight);
    }

    // Update language weight
    if (language) {
      const currentLangWeight = weights.languageWeights.get(language) ?? DEFAULT_WEIGHT;
      const newLangWeight = this.calculateNewWeight(currentLangWeight, delta);
      weights.languageWeights.set(language, newLangWeight);
    }

    // Update totals
    if (action === 'LIKED') weights.totalLikes = (weights.totalLikes || 0) + 1;
    if (action === 'DISLIKED' || action === 'BLACKLISTED') weights.totalDislikes = (weights.totalDislikes || 0) + 1;

    await weights.save();
    
    logger.debug(`Updated weights for user ${userId}: ${action} on ${contentType} with genres [${genreIds.join(', ')}]`);
  }

  /**
   * Calculate new weight after adjustment
   * Clamps result between MIN_WEIGHT and MAX_WEIGHT
   */
  private static calculateNewWeight(currentWeight: number, delta: number): number {
    return clamp(currentWeight + delta);
  }

  /**
   * Learn from a play on any screen (pick, search, trending, continue watching):
   * PLAYED on first open, WATCHED once the play qualifies.
   * The player only knows the TMDB id, so genres and language come from details.
   */
  static async learnFromPlay(userId: string, tmdbId: number, contentType: string, action: 'PLAYED' | 'WATCHED') {
    const details =
      contentType === 'MOVIE' ? await tmdbClient.getMovieDetails(tmdbId) : await tmdbClient.getTVDetails(tmdbId);
    await this.updateWeights({
      userId,
      action,
      genreIds: details.genres.map((g) => g.id),
      contentType,
      language: details.original_language,
    });
    return details;
  }

  /**
   * Current preference weights: additive signals decayed to now, then blended
   * with impression hit rates. `empirical: false` skips the blend (mood chips
   * want "you said so N times", not exposure-adjusted rates).
   */
  static async getWeights(userId: string, opts: { empirical?: boolean } = {}) {
    const [weights, rates] = await Promise.all([
      PreferenceWeightsModel.findOne({ userId }).lean(),
      opts.empirical === false ? null : this.getRates(userId),
    ]);

    if (!weights) {
      return null;
    }

    const f = decayFactor(weights.decayedAt ?? weights.updatedAt, Date.now());
    // lean() hands Map fields back as plain objects; hydrated docs give real Maps.
    const toObject = (m: unknown): Record<string, number> =>
      Object.fromEntries(
        Object.entries(
          m instanceof Map ? Object.fromEntries(m) : ((m as Record<string, number> | undefined) ?? {})
        ).map(([k, w]) => [k, decayed(w as number, f)])
      );

    return {
      genreWeights: blend(toObject(weights.genreWeights), rates?.genre, rates?.global ?? 1),
      contentTypeWeights: blend(toObject(weights.contentTypeWeights), rates?.contentType, rates?.global ?? 1),
      languageWeights: blend(toObject(weights.languageWeights), rates?.language, rates?.global ?? 1),
      totalLikes: weights.totalLikes || 0,
      totalDislikes: weights.totalDislikes || 0,
    };
  }

  /**
   * Per-key impressions and hits over the last RATE_WINDOW_DAYS. A hit is a shown
   * title the user liked, marked watched, or played past the qualified bar.
   * Null when there is nothing to compare against (no hits) or on error.
   */
  private static async getRates(userId: string): Promise<Rates | null> {
    const cached = ratesCache.get(userId);
    if (cached !== undefined) return cached;

    let rates: Rates | null = null;
    try {
      const since = new Date(Date.now() - RATE_WINDOW_DAYS * DAY_MS);
      const [shown, positive, played] = await Promise.all([
        ImpressionModel.aggregate<{
          _id: { tmdbId: number };
          w: number;
          contentType: string;
          genreIds: string[];
          lang?: string;
        }>([
          { $match: { userId: new Types.ObjectId(userId), createdAt: { $gte: since } } },
          {
            $group: {
              _id: { tmdbId: '$tmdbId', tv: { $ne: ['$contentType', 'MOVIE'] } },
              w: { $sum: { $cond: [{ $eq: ['$surface', 'hero'] }, 1, FEED_IMPRESSION_WEIGHT] } },
              contentType: { $first: '$contentType' },
              genreIds: { $first: '$genreIds' },
              lang: { $first: '$originalLanguage' },
            },
          },
        ]),
        RecommendationHistoryModel.find({ userId, action: { $in: ['LIKED', 'WATCHED'] }, updatedAt: { $gte: since } })
          .select('tmdbId contentType')
          .lean(),
        ViewingProgressModel.find({ userId, learned: true, updatedAt: { $gte: since } })
          .select('tmdbId contentType')
          .lean(),
      ]);

      const hitKeys = new Set(
        [...positive, ...played].map((h) => seenKey(h.tmdbId as number, h.contentType as string))
      );
      const tally = { genre: new Map(), language: new Map(), contentType: new Map() } as Omit<Rates, 'global'>;
      let imps = 0;
      let hits = 0;
      for (const t of shown) {
        const hit = hitKeys.has(seenKey(t._id.tmdbId, t.contentType)) ? 1 : 0;
        imps += t.w;
        hits += hit;
        const add = (m: Tally, k: string | undefined) => {
          if (!k) return;
          const c = m.get(k) ?? { imps: 0, hits: 0 };
          c.imps += t.w;
          c.hits += hit;
          m.set(k, c);
        };
        for (const g of t.genreIds ?? []) add(tally.genre, g);
        add(tally.language, t.lang);
        add(tally.contentType, t.contentType);
      }
      if (hits > 0) rates = { global: hits / imps, ...tally };
    } catch (err) {
      logger.error('Failed to compute impression rates:', err);
    }

    ratesCache.set(userId, rates, RATES_TTL_MS);
    return rates;
  }

  /**
   * Get top weighted genres for a user (for prioritizing in recommendations)
   * Returns genre IDs sorted by weight (highest first)
   */
  static async getTopGenres(userId: string, limit: number = 5): Promise<string[]> {
    const weights = await this.getWeights(userId);
    
    if (!weights || Object.keys(weights.genreWeights).length === 0) {
      return [];
    }

    const entries = Object.entries(weights.genreWeights);
    entries.sort((a, b) => (b[1] as number) - (a[1] as number));
    
    return entries.slice(0, limit).map(([genreId]) => genreId);
  }

  /**
   * Get preferred content type ordering based on weights
   */
  static async getContentTypeOrder(userId: string): Promise<string[]> {
    const weights = await this.getWeights(userId);
    
    if (!weights || Object.keys(weights.contentTypeWeights).length === 0) {
      return ['MOVIE', 'SERIES', 'ANIME'];
    }

    const entries = Object.entries(weights.contentTypeWeights);
    entries.sort((a, b) => (b[1] as number) - (a[1] as number));
    
    return entries.map(([type]) => type);
  }

  /**
   * Reset weights for a user (useful for testing or user preference reset)
   */
  static async resetWeights(userId: string): Promise<void> {
    await PreferenceWeightsModel.findOneAndUpdate(
      { userId },
      {
        genreWeights: new Map(),
        contentTypeWeights: new Map([
          ['MOVIE', DEFAULT_WEIGHT],
          ['SERIES', DEFAULT_WEIGHT],
          ['ANIME', DEFAULT_WEIGHT],
        ]),
        languageWeights: new Map(),
        totalLikes: 0,
        totalDislikes: 0,
      },
      { upsert: true }
    );
  }
}
