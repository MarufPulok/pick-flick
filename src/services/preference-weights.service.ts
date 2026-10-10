/**
 * Preference Weights Service
 * Manages learning from user feedback (likes/dislikes) to improve recommendations
 */

import { PreferenceWeightsModel } from '@/infrastructure/db/models';
import { tmdbClient } from '@/infrastructure/external/tmdb.client';
import { logger } from '@/lib/logger';

export type LearnAction = 'LIKED' | 'WATCHED' | 'DISLIKED' | 'BLACKLISTED' | 'SKIPPED';

/** Points per signal. Playing something is almost as strong as a like. */
const DELTA: Record<LearnAction, number> = {
  LIKED: 5,
  WATCHED: 4,
  DISLIKED: -3,
  BLACKLISTED: -5,
  SKIPPED: -1,
};
const MIN_WEIGHT = 0;      // Minimum weight value
const MAX_WEIGHT = 100;    // Maximum weight value
const DEFAULT_WEIGHT = 50; // Starting weight for new items

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
    
    if (!weights) {
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
    return Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, currentWeight + delta));
  }

  /**
   * Learn from a play on any screen (pick, search, trending, continue watching).
   * The player only knows the TMDB id, so genres and language come from details.
   */
  static async learnFromPlay(userId: string, tmdbId: number, contentType: string): Promise<void> {
    const details =
      contentType === 'MOVIE' ? await tmdbClient.getMovieDetails(tmdbId) : await tmdbClient.getTVDetails(tmdbId);
    await this.updateWeights({
      userId,
      action: 'WATCHED',
      genreIds: details.genres.map((g) => g.id),
      contentType,
      language: details.original_language,
    });
  }

  /**
   * Get current preference weights for a user
   */
  static async getWeights(userId: string) {
    const weights = await PreferenceWeightsModel.findOne({ userId }).lean();
    
    if (!weights) {
      return null;
    }

    // lean() hands Map fields back as plain objects; hydrated docs give real Maps.
    const toObject = (m: unknown): Record<string, number> =>
      m instanceof Map ? Object.fromEntries(m) : ((m as Record<string, number> | undefined) ?? {});

    return {
      genreWeights: toObject(weights.genreWeights),
      contentTypeWeights: toObject(weights.contentTypeWeights),
      languageWeights: toObject(weights.languageWeights),
      totalLikes: weights.totalLikes || 0,
      totalDislikes: weights.totalDislikes || 0,
    };
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
