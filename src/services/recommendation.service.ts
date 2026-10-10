/**
 * Recommendation Service
 *
 * FILTERED mode: cascading fallback over TMDB discover. Language is sacred.
 * SMART mode: a small candidate pipeline. Source candidates from every content
 * type the user chose (equal budget, so anime is never starved) plus TMDB
 * recommendations seeded by what they actually watched or liked; drop
 * everything they have already seen; score against the taste profile and the
 * learned weights; sample from the top so picks stay fresh.
 */

import { ContentType } from '@/config/app.config';
import {
  tmdbClient,
  type TMDBDiscoverParams,
  type TMDBMovie,
  type TMDBTVShow,
} from '@/infrastructure/external/tmdb.client';
import { loggers } from '@/lib/logger';
import { seenKey } from '@/services/history.service';

const log = loggers.recommendation;

/** Movie genre ids with no TV counterpart map to the closest TV genre (null = drop). */
const MOVIE_TO_TV_GENRE: Record<string, string | null> = {
  '28': '10759', '12': '10759', '14': '10765', '878': '10765', '10752': '10768',
  '53': '9648', '27': '9648', '36': '10768', '10402': null, '10749': null, '10770': null,
};

/** Onboarding anime tags → TMDB keyword names, resolved to ids at query time. */
const ANIME_TAG_KEYWORD: Record<string, string> = {
  shonen: 'shounen', shojo: 'shoujo', seinen: 'seinen', josei: 'josei',
  isekai: 'isekai', mecha: 'mecha', 'slice-of-life': 'slice of life', sports: 'sports',
};

export type Weights = Record<string, number>;
const NEUTRAL = 50;
/** Learned weights never count for less than a quarter of neutral, so nothing is locked out for good. */
const WEIGHT_FLOOR = 0.25;
/** X diversity decay: mult = (1 - floor) * decay^k + floor; each repeat halves the boost, floor 0.25. */
const DIVERSITY_DECAY = 0.5;
const DIVERSITY_FLOOR = 0.25;
/** Hero softmax temperature over min-max normalized scores (top = 1, 20th = 0). */
const SOFTMAX_T = 0.3;
const EPS = 1e-6;
/** Usable survivors per seed, in TMDB order, so one dense seed can't flood the pool. */
const SEED_BUDGET = 8;
/** Wall-clock budget per source (one discover type incl. retries, or one seed). */
const SOURCE_BUDGET_MS = 3000;
/** Unseen candidates a discover source needs before it stops digging. */
const THIN = 5;
const PAGE_SIZE = 20;
/** Deeper pages tried before relaxing genres when the first page is mostly seen. */
const DEEP_PAGES = [4, 5, 6];
/** TMDB-side floor, low so new and small-language titles reach the projected-vote check. */
const DISCOVER_VOTE_GTE = 15;
/** Projected votes required; also the strength of the rating prior. */
const VOTE_FLOOR = 50;
const PRIOR_RATING = 6.5;
// X popular_posts age normalization: v·(1−e^{−λW}) / (1−e^{−λ·age}) projects a young title's
// votes to a full window. Votes accrue with a ~180-day half-life over a 2-year window.
const VOTE_LAMBDA = Math.LN2 / 180;
const VOTE_WINDOW_DAYS = 730;
/** Caps the projection at ~8.6x so a week-old title with a handful of votes does not pass. */
const VOTE_MIN_AGE_DAYS = 30;
const DAY_MS = 86_400_000;

export interface Seed {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  strength?: 'LIKED' | 'WATCHED' | 'PLAYED';
  at?: Date;
}

export interface Candidate {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  rating: number;
  voteCount: number;
  genreIds: number[];
  originalLanguage: string;
  popularity: number;
  /** Primary seed; equals seeds[0]. */
  seed?: Seed;
  /** Every seed that surfaced this candidate, primary first. */
  seeds?: Seed[];
}

export interface Pick extends Candidate {
  strategyName: string;
  strategyGenres: string[];
  strategyLanguages: string[];
}

interface RecommendationRequest {
  contentType: ContentType;
  genres: string[];
  languages: string[];
  minRating?: number;
  blacklist?: Set<string>;
  genreWeights?: Weights;
}

interface SmartRequest {
  contentTypes: ContentType[];
  genres: string[];
  languages: string[];
  minRating?: number;
  excluded?: Set<string>;
  weights?: { genres?: Weights; contentTypes?: Weights; languages?: Weights };
  seeds?: Seed[];
  /** Content types of recent hero picks, newest first (up to 5); they get a diversity penalty. */
  recentTypes?: string[];
  /** Primary genres of recent hero picks, newest first (up to 10). */
  recentGenres?: string[];
  /** Explicit mood genres: replace profile genres and skip seeds. */
  moodGenres?: string[];
  /** Explicit mood languages (a "Korean night" chip): replace profile languages. */
  moodLanguages?: string[];
}

interface QueryStrategy {
  name: string;
  genres: string[];
  languages: string[];
  minRating: number;
  sortBy?: string;
  voteCountGte?: number;
  keywords?: string;
  tryMultiplePages?: boolean;
}

function toTvGenres(genres: string[]): string[] {
  return [...new Set(genres.map((g) => (g in MOVIE_TO_TV_GENRE ? MOVIE_TO_TV_GENRE[g] : g)))].filter(
    (g): g is string => !!g
  );
}

/** Numeric genres usable for this content type (TV genre space for series/anime). */
function genresFor(contentType: ContentType, genres: string[]): string[] {
  const numeric = genres.filter((g) => !isNaN(Number(g)));
  if (contentType === 'MOVIE') return numeric;
  return toTvGenres(numeric).filter((g) => contentType !== 'ANIME' || g !== '16');
}

/** Weighted sample of k distinct genres. Weight 50 is neutral, 100 double, floored at 12.5 (WEIGHT_FLOOR). */
function pickGenres(genres: string[], k: number, weights: Weights = {}): string[] {
  const pool = genres.map((g) => ({ g, w: Math.max(12.5, weights[g] ?? NEUTRAL) }));
  const out: string[] = [];
  while (pool.length && out.length < k) {
    let r = Math.random() * pool.reduce((s, p) => s + p.w, 0);
    const i = pool.findIndex((p) => (r -= p.w) < 0);
    out.push(pool.splice(i === -1 ? pool.length - 1 : i, 1)[0].g);
  }
  return out;
}

interface Scored {
  c: Candidate;
  score: number;
  matched: string[];
}

/** Learned weight as a multiplier: 50 → 1, 100 → 2, floored at 0.25 so it never zeroes out a type, genre or language. */
function neutral(map: Weights | undefined, key: string): number {
  return Math.max(WEIGHT_FLOOR, (map?.[key] ?? NEUTRAL) / NEUTRAL);
}

function diversityMult(k: number): number {
  return (1 - DIVERSITY_FLOOR) * DIVERSITY_DECAY ** k + DIVERSITY_FLOOR;
}

function countOf(xs: string[], x: string | undefined): number {
  return x === undefined ? 0 : xs.filter((y) => y === x).length;
}

function primaryGenre(c: Candidate): string | undefined {
  return c.genreIds.length > 0 ? String(c.genreIds[0]) : undefined;
}

/** Age-normalized vote count. Missing/invalid dates and titles past the window count plain votes. */
function projectedVotes(c: Candidate): number {
  const released = Date.parse(c.releaseDate);
  if (!Number.isFinite(released)) return c.voteCount;
  const age = Math.min(VOTE_WINDOW_DAYS, Math.max(VOTE_MIN_AGE_DAYS, (Date.now() - released) / DAY_MS));
  return (c.voteCount * (1 - Math.exp(-VOTE_LAMBDA * VOTE_WINDOW_DAYS))) / (1 - Math.exp(-VOTE_LAMBDA * age));
}

/** Resolve to `fallback()` if `work` has not settled within `ms`. */
function withBudget<T>(work: Promise<T>, ms: number, fallback: () => T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback()), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

function toPick({ c, matched }: Scored): Pick {
  return {
    ...c,
    strategyName: c.seed ? 'Because you watched' : matched.length >= 2 ? 'All genres' : matched.length === 1 ? 'Single genre' : 'No genres',
    strategyGenres: matched,
    strategyLanguages: [c.originalLanguage],
  };
}

function isAnime(item: TMDBTVShow): boolean {
  return item.original_language === 'ja' && item.genre_ids.includes(16);
}

function toCandidate(item: TMDBMovie | TMDBTVShow, contentType: ContentType, seed?: Seed): Candidate {
  return {
    tmdbId: item.id,
    contentType,
    title: 'title' in item ? item.title : item.name,
    overview: item.overview,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    releaseDate: 'release_date' in item ? item.release_date : item.first_air_date,
    rating: item.vote_average,
    voteCount: item.vote_count,
    genreIds: item.genre_ids,
    originalLanguage: item.original_language,
    popularity: item.popularity,
    seed,
  };
}

export class RecommendationService {
  // ===========================================================================
  // FILTERED mode: cascading fallback
  // ===========================================================================

  /**
   * Generate a single recommendation based on filters with cascading fallback
   * Language is ALWAYS preserved (sacred)
   */
  static async generateRecommendation(request: RecommendationRequest): Promise<Pick | null> {
    const { contentType, genres, languages, minRating = 0, blacklist, genreWeights } = request;

    // Ensure we have at least one language (fallback to 'en' if empty)
    const sacredLanguages = languages.length > 0 ? languages : ['en'];

    const strategies = this.buildStrategies(genresFor(contentType, genres), sacredLanguages, minRating);

    // Anime tags (shōnen, isekai, …) are TMDB keywords, not genres.
    const keyword = contentType === 'ANIME' ? await this.animeKeyword(genres) : null;
    if (keyword) {
      strategies.unshift({
        name: 'Anime tag',
        genres: [],
        languages: sacredLanguages,
        minRating,
        keywords: String(keyword),
        tryMultiplePages: true,
      });
    }

    for (const strategy of strategies) {
      const result = await this.tryGenerateWithStrategy(contentType, strategy, blacklist, genreWeights);
      if (result) {
        log.debug(`Success with strategy: ${strategy.name}`);
        return {
          ...result,
          strategyName: strategy.name,
          strategyGenres: strategy.genres,
          strategyLanguages: strategy.languages,
        };
      }
    }

    return null;
  }

  /**
   * Build ordered list of query strategies
   * Language is ALWAYS preserved in every strategy
   */
  private static buildStrategies(
    genres: string[],
    languages: string[],
    minRating: number
  ): QueryStrategy[] {
    const numericGenres = genres.filter((g) => !isNaN(Number(g)));
    const strategies: QueryStrategy[] = [];

    // Strategy 1: All filters (most specific) - try multiple pages
    if (numericGenres.length > 0) {
      strategies.push({
        name: 'All filters (multiple pages)',
        genres: numericGenres,
        languages,
        minRating,
        tryMultiplePages: true,
      });
    }

    // Strategy 2: All genres, language, but lower rating (step down by 0.5)
    if (numericGenres.length > 0 && minRating > 5.5) {
      strategies.push({
        name: 'All genres, lower rating (-0.5)',
        genres: numericGenres,
        languages,
        minRating: Math.max(5.5, minRating - 0.5),
        tryMultiplePages: true,
      });
    }

    // Strategy 3: Try 2 random genres (if user has 3+)
    if (numericGenres.length >= 3) {
      const shuffled = [...numericGenres].sort(() => Math.random() - 0.5);
      strategies.push({
        name: '2 random genres',
        genres: shuffled.slice(0, 2),
        languages,
        minRating,
        tryMultiplePages: true,
      });
    }

    // Strategy 4: Try 2 random genres with lower rating
    if (numericGenres.length >= 3 && minRating > 5) {
      const shuffled = [...numericGenres].sort(() => Math.random() - 0.5);
      strategies.push({
        name: '2 random genres, lower rating',
        genres: shuffled.slice(0, 2),
        languages,
        minRating: Math.max(5.0, minRating - 1),
        tryMultiplePages: true,
      });
    }

    // Strategy 5: Single random genre (try each one)
    for (const genre of numericGenres) {
      strategies.push({
        name: `Single genre: ${genre}`,
        genres: [genre],
        languages,
        minRating,
        tryMultiplePages: true,
      });
    }

    // Strategy 6: Single genre with lower rating
    if (minRating > 5) {
      for (const genre of numericGenres) {
        strategies.push({
          name: `Single genre ${genre}, lower rating`,
          genres: [genre],
          languages,
          minRating: Math.max(5.0, minRating - 1),
          tryMultiplePages: true,
        });
      }
    }

    // Strategy 7: No genres, but keep language and rating
    if (minRating > 0) {
      strategies.push({
        name: 'No genres, keep language and rating',
        genres: [],
        languages,
        minRating,
        tryMultiplePages: true,
      });
    }

    // Strategy 8: No genres, language, lower rating
    if (minRating > 5) {
      strategies.push({
        name: 'No genres, language, lower rating',
        genres: [],
        languages,
        minRating: Math.max(5.0, minRating - 1),
        tryMultiplePages: true,
      });
    }

    // Strategy 9: No genres, language, minimal rating (5.0)
    strategies.push({
      name: 'No genres, language, rating 5.0',
      genres: [],
      languages,
      minRating: 5.0,
      tryMultiplePages: true,
    });

    // Strategy 10: No genres, language, no rating filter
    strategies.push({
      name: 'No genres, language only',
      genres: [],
      languages,
      minRating: 0,
      tryMultiplePages: true,
    });

    // Strategy 11: Try different sorting methods (if we have genres)
    if (numericGenres.length > 0) {
      strategies.push({
        name: 'All genres, vote_average sort',
        genres: numericGenres,
        languages,
        minRating: Math.max(5.0, minRating - 1),
        sortBy: 'vote_average.desc',
        voteCountGte: 100,
        tryMultiplePages: true,
      });
    }

    // Strategy 12: Try with lower vote count requirement
    if (numericGenres.length > 0) {
      strategies.push({
        name: 'All genres, lower vote count threshold',
        genres: numericGenres,
        languages,
        minRating: Math.max(5.0, minRating - 1),
        voteCountGte: 50, // Lower than default 100
        tryMultiplePages: true,
      });
    }

    // Strategy 13: Try alternative language from user's list (if multiple)
    if (languages.length > 1) {
      for (let i = 1; i < languages.length; i++) {
        strategies.push({
          name: `Alternative language: ${languages[i]}`,
          genres: numericGenres,
          languages: [languages[i]],
          minRating: Math.max(5.0, minRating - 1),
          tryMultiplePages: true,
        });
      }
    }

    return strategies;
  }

  /**
   * Try to generate recommendation with a specific strategy
   */
  private static async tryGenerateWithStrategy(
    contentType: ContentType,
    strategy: QueryStrategy,
    blacklist?: Set<string>,
    genreWeights?: Weights
  ): Promise<Candidate | null> {
    const pagesToTry = strategy.tryMultiplePages ? [1, 2, 3, 4, 5] : [Math.floor(Math.random() * 5) + 1];

    for (const page of pagesToTry) {
      const queryParams = this.buildQueryParams(contentType, strategy, page, genreWeights);

      log.debug('TMDB Query', { page, params: queryParams });

      try {
        const response =
          contentType === 'SERIES' || contentType === 'ANIME'
            ? await tmdbClient.discoverTV(queryParams)
            : await tmdbClient.discoverMovies(queryParams);

        const results = (response.results ?? []).filter(
          (item) => !blacklist?.has(seenKey(item.id, contentType))
        );

        if (results.length === 0) continue; // Try next page

        const item = results[Math.floor(Math.random() * Math.min(results.length, 20))];
        return toCandidate(item, contentType);
      } catch (error) {
        console.error(`Error querying TMDB (Page ${page}):`, error);
        continue; // Try next page
      }
    }

    return null; // All pages failed
  }

  /**
   * Build TMDB query parameters
   */
  private static buildQueryParams(
    contentType: ContentType,
    strategy: QueryStrategy,
    page: number,
    genreWeights?: Weights
  ): TMDBDiscoverParams {
    const { genres, languages, minRating, sortBy, voteCountGte, keywords } = strategy;
    const queryParams: TMDBDiscoverParams = {
      sort_by: sortBy || 'popularity.desc',
      page,
    };

    // Pick 1-2 genres (weighted by what the user has liked) to avoid over-filtering
    const numericGenres = genres.filter((g) => !isNaN(Number(g)) && g !== '16');
    const selected = pickGenres(numericGenres, Math.random() > 0.5 ? 2 : 1, genreWeights);

    if (contentType === 'ANIME') {
      // ANIME must be Japanese animation regardless of the user's languages
      queryParams.with_original_language = 'ja';
      queryParams.with_genres = ['16', ...selected].join(',');
    } else {
      if (selected.length > 0) queryParams.with_genres = selected.join(',');
      // ALWAYS add language (sacred)
      if (languages.length > 0) queryParams.with_original_language = languages[0];
    }

    if (keywords) queryParams.with_keywords = keywords;
    if (minRating > 0) queryParams['vote_average.gte'] = minRating;
    if (voteCountGte !== undefined) queryParams['vote_count.gte'] = voteCountGte;

    return queryParams;
  }

  /** Resolve one random anime tag from the user's genres to a TMDB keyword id. */
  private static async animeKeyword(genres: string[]): Promise<number | null> {
    const tags = genres.filter((g) => g in ANIME_TAG_KEYWORD);
    if (tags.length === 0) return null;
    return tmdbClient.getKeywordId(ANIME_TAG_KEYWORD[tags[Math.floor(Math.random() * tags.length)]]);
  }

  // ===========================================================================
  // SMART mode: source → filter → score → sample
  // ===========================================================================

  static async generateSmartRecommendation(request: SmartRequest): Promise<Pick | null> {
    const { scored, types, mood } = await this.rankCandidates(request);
    if (scored.length === 0) return null;

    // 3. Pick the content type first so every type the user chose gets an
    // equal share of nights, bent only by learning and a diversity penalty.
    // Scoring across types would let TV's higher TMDB ratings bury movies.
    const weights = request.weights ?? {};
    const recentTypes = (request.recentTypes ?? []).slice(0, 5);
    const typePool = types.filter((t) => scored.some((s) => s.c.contentType === t));
    const typeMults = typePool.map((t) => diversityMult(countOf(recentTypes, t)));
    const typeWeights = typePool.map((t, i) => neutral(weights.contentTypes, t) * typeMults[i]);
    let rt = Math.random() * typeWeights.reduce((a, b) => a + b, 0);
    const typeIdx = Math.max(0, typePool.findIndex((_, i) => (rt -= typeWeights[i]) < 0));
    const type = typePool[typeIdx];
    const ofType = scored.filter((s) => s.c.contentType === type);

    // Seed recommendations are dense and well-rated, so left in one pool they
    // would win every time. Seeds get 40% of nights, and only when the seed
    // pool is wide enough that it will not repeat the same title.
    const seeded = ofType.filter((s) => s.c.seed);
    const discovered = ofType.filter((s) => !s.c.seed);
    const useSeeds = seeded.length >= 5 && (discovered.length === 0 || Math.random() < 0.4);
    const pool = useSeeds ? seeded : discovered.length > 0 ? discovered : seeded;

    // 4. Softmax over the top 20, scores min-max normalized so the spread (and
    // so the randomness) does not drift with weights or the mood ×2. Genre
    // diversity multiplies probabilities, not scores, since scores can be negative.
    const top = pool.slice(0, 20);
    const hi = top[0].score;
    const range = hi - top[top.length - 1].score + EPS;
    const recentGenres = (request.recentGenres ?? []).slice(0, 10);
    const genreMults = top.map((s) => diversityMult(countOf(recentGenres, primaryGenre(s.c))));
    const probs = top.map((s, i) => Math.exp((s.score - hi) / range / SOFTMAX_T) * genreMults[i]);
    let r = Math.random() * probs.reduce((a, b) => a + b, 0);
    const idx = Math.max(0, top.findIndex((_, i) => (r -= probs[i]) < 0));
    const chosen = top[idx];

    log.debug('Smart pick', { candidates: scored.length, type, pool: useSeeds ? 'seeds' : 'discover', score: chosen.score, mood: !!mood });
    log.debug('Smart pick multipliers', {
      type,
      typeWeight: neutral(weights.contentTypes, type),
      typeMult: typeMults[typeIdx],
      genre: primaryGenre(chosen.c),
      genreMult: genreMults[idx],
      normScore: 1 + (chosen.score - hi) / range,
      prob: probs[idx] / probs.reduce((a, b) => a + b, 0),
    });
    return toPick(chosen);
  }

  /**
   * A ranked rail for the dashboard: the best of every content type, interleaved
   * so movies, series and anime share the row, seeds capped at ~40%.
   */
  static async generateSmartFeed(request: SmartRequest, limit = 12): Promise<Pick[]> {
    const { scored, types } = await this.rankCandidates(request);
    const seedOf = (s: Scored) => (s.c.seed ? seenKey(s.c.seed.tmdbId, s.c.seed.contentType) : undefined);
    const lanes = types
      .map((t) => {
        const ofType = scored.filter((s) => s.c.contentType === t);
        if (ofType.length === 0) return [];
        const hi = ofType[0].score;
        const range = hi - ofType[ofType.length - 1].score + EPS;
        const seeded = ofType.filter((s) => s.c.seed);
        const discovered = ofType.filter((s) => !s.c.seed);
        const lane: Scored[] = [];
        const perSeed = new Map<string, number>();
        // Greedy: normalized score × count decay over lane items already sharing
        // its primary genre or seed, so one genre or one seed can't fill the lane.
        const value = (s: Scored) => {
          const g = primaryGenre(s.c);
          const seed = seedOf(s);
          const k = lane.filter((p) => (g !== undefined && primaryGenre(p.c) === g) || (seed !== undefined && seedOf(p) === seed)).length;
          return (1 + (s.score - hi) / range) * diversityMult(k);
        };
        while (lane.length < limit && (seeded.length || discovered.length)) {
          const wantSeed = seeded.length > 0 && (discovered.length === 0 || lane.filter((s) => s.c.seed).length + 1 <= 0.4 * (lane.length + 1));
          const from = wantSeed ? seeded : discovered;
          // Round-robin by seed: only seeds with the fewest picks in this lane are eligible.
          const fewest = wantSeed ? Math.min(...seeded.map((s) => perSeed.get(seedOf(s)!) ?? 0)) : 0;
          const eligible = wantSeed ? seeded.filter((s) => (perSeed.get(seedOf(s)!) ?? 0) === fewest) : discovered;
          const best = eligible.reduce((a, b) => (value(b) > value(a) ? b : a));
          from.splice(from.indexOf(best), 1);
          lane.push(best);
          if (wantSeed) perSeed.set(seedOf(best)!, fewest + 1);
        }
        return lane;
      })
      .filter((lane) => lane.length > 0);

    const out: Pick[] = [];
    for (let i = 0; out.length < limit && lanes.some((l) => l[i]); i++) {
      for (const lane of lanes) if (lane[i] && out.length < limit) out.push(toPick(lane[i]));
    }
    return out;
  }

  /** Steps 1–2 of the pipeline plus scoring: everything the hero and the feed share. */
  private static async rankCandidates(request: SmartRequest) {
    const minRating = request.minRating ?? 6;
    const langSource = request.moodLanguages?.length ? request.moodLanguages : request.languages;
    const languages = langSource.length > 0 ? [...new Set(langSource)] : ['en'];
    const mood = request.moodGenres?.length ? request.moodGenres : null;
    const genres = mood ?? request.genres;
    const weights = request.weights ?? {};
    const types = request.contentTypes;

    // 2. Filter (also used by discover to judge thinness): already seen, wrong
    // type, quality floor, language. Seed-sourced candidates may be in any
    // language: the seed proves the user watches it.
    const allowedLang = new Set(languages);
    const keep = (c: Candidate) =>
      !request.excluded?.has(seenKey(c.tmdbId, c.contentType)) &&
      types.includes(c.contentType) &&
      c.rating >= minRating - 0.5 &&
      projectedVotes(c) >= VOTE_FLOOR &&
      (c.contentType === 'ANIME' || !!c.seed || allowedLang.has(c.originalLanguage));

    // 1. Source: one discover query per content type (equal budget) + every seed.
    // Any mood chip (genre or language) skips seeds: seed candidates bypass the
    // language filter, so "Korean night" would otherwise serve English seed recs.
    const seeds = mood || request.moodLanguages?.length ? [] : request.seeds ?? [];
    const pool = (
      await Promise.all([
        ...types.map((t) => this.discoverCandidates(t, genres, languages, minRating, keep, weights.genres)),
        ...seeds.map((s) => this.seedCandidates(s)),
      ])
    ).flat();

    // Dedup by seenKey, merging sources: a candidate keeps every seed that
    // surfaced it (any seed makes it seeded). No multi-seed score boost.
    const byKey = new Map<string, Candidate>();
    const perSeed = new Map<string, number>();
    for (const c of pool) {
      if (!keep(c)) continue;
      if (c.seed) {
        const sk = seenKey(c.seed.tmdbId, c.seed.contentType);
        const n = perSeed.get(sk) ?? 0;
        if (n >= SEED_BUDGET) continue;
        perSeed.set(sk, n + 1);
      }
      const key = seenKey(c.tmdbId, c.contentType);
      const prev = byKey.get(key);
      if (!prev) byKey.set(key, c.seed ? { ...c, seeds: [c.seed] } : c);
      else if (c.seed && !prev.seeds?.some((s) => s.tmdbId === c.seed!.tmdbId && s.contentType === c.seed!.contentType)) {
        prev.seeds = [...(prev.seeds ?? []), c.seed];
        prev.seed = prev.seeds[0];
      }
    }
    const candidates = [...byKey.values()];

    // Score within type: profile genre match + learned genre weights, language weight, rating.
    // Rating is shrunk toward 6.5 by vote count so a 9.0 on 20 votes doesn't outrank a 7.8 on 5k.
    const numeric = genres.filter((g) => !isNaN(Number(g)));
    const liked = new Set([...numeric, ...toTvGenres(numeric)]);
    const scored: Scored[] = candidates
      .map((c) => {
        const ids = c.genreIds.map(String);
        const genreScore =
          ids.reduce((s, g) => s + (liked.has(g) ? 1 : 0) + (neutral(weights.genres, g) - 1), 0) /
          Math.max(1, Math.min(3, ids.length));
        const langScore = neutral(weights.languages, c.originalLanguage);
        const rating = (c.voteCount * c.rating + VOTE_FLOOR * PRIOR_RATING) / (c.voteCount + VOTE_FLOOR);
        const ratingScore = (rating - 6) / 2;
        const score = genreScore * (mood ? 2 : 1) + langScore * 0.4 + ratingScore * 0.6;
        return { c, score, matched: ids.filter((g) => liked.has(g)) };
      })
      .sort((a, b) => b.score - a.score);

    const perType = Object.fromEntries(
      types.map((t) => {
        const ofType = scored.filter((s) => s.c.contentType === t);
        return [t, { total: ofType.length, seeded: ofType.filter((s) => s.c.seed).length }];
      })
    );
    log.debug('Smart candidates per type', { perType, raw: pool.length, seeds: seeds.length });
    if (scored.length === 0) log.debug('Smart pipeline produced no candidates', { types, genres, languages });
    return { scored, types, mood };
  }

  /**
   * Popularity-sorted discover for a content type. When fewer than THIN results
   * survive `keep` (exclusions, vote floor), digs deeper pages, then drops
   * genres, then tries other profile languages, all inside SOURCE_BUDGET_MS.
   */
  private static async discoverCandidates(
    contentType: ContentType,
    genres: string[],
    languages: string[],
    minRating: number,
    keep: (c: Candidate) => boolean,
    genreWeights?: Weights
  ): Promise<Candidate[]> {
    const deadline = Date.now() + SOURCE_BUDGET_MS;
    const results: Candidate[] = [];
    const enough = () => new Set(results.filter(keep).map((c) => seenKey(c.tmdbId, c.contentType))).size >= THIN;

    const fetch = async (p: TMDBDiscoverParams): Promise<Candidate[] | null> => {
      if (Date.now() >= deadline) return null;
      try {
        const got =
          contentType === 'MOVIE'
            ? (await tmdbClient.discoverMovies(p)).results.map((m) => toCandidate(m, 'MOVIE'))
            : (await tmdbClient.discoverTV(p)).results.map((s) =>
                toCandidate(s, contentType === 'ANIME' || isAnime(s) ? 'ANIME' : 'SERIES')
              );
        results.push(...got);
        return got;
      } catch (error) {
        console.error('[Recommendation] discover failed', error);
        return [];
      }
    };

    const run = async (): Promise<Candidate[]> => {
      const usable = genresFor(contentType, genres);
      const picked = pickGenres(usable, usable.length >= 2 && Math.random() > 0.5 ? 2 : 1, genreWeights);
      const base: TMDBDiscoverParams = {
        sort_by: 'popularity.desc',
        page: 1 + Math.floor(Math.random() * 3),
        'vote_average.gte': Math.max(0, minRating - 0.5),
        'vote_count.gte': DISCOVER_VOTE_GTE,
      };

      const params: TMDBDiscoverParams = { ...base };
      if (contentType === 'ANIME') {
        params.with_original_language = 'ja';
        params.with_genres = '16';
        const keyword = Math.random() > 0.5 ? await this.animeKeyword(genres) : null;
        if (keyword) params.with_keywords = String(keyword);
        else if (picked[0]) params.with_genres = `16,${picked[0]}`;
      } else {
        // Rotate through the user's languages so every preference gets a turn.
        params.with_original_language = languages[Math.floor(Math.random() * languages.length)];
        if (picked.length) params.with_genres = picked.join('|');
      }

      // A type that sources nothing drops out of tonight's lottery, which quietly
      // hands its share to the types that never run dry (ANIME is always ja+16).
      // Some languages have no TV at the vote floor at all (ta/te/ml = 0), so when
      // a roll comes back thin, retry the same query in another profile language,
      // English first. ANIME is fixed to ja and gets one pass.
      const first = params.with_original_language!;
      const retries = contentType === 'ANIME' ? [] : languages.filter((l) => l !== first).sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : 0)).slice(0, 2);
      for (const lang of [first, ...retries]) {
        // Japanese TV is ~95% anime and that lane belongs to ANIME; keep SERIES live-action.
        const p: TMDBDiscoverParams = { ...params, with_original_language: lang };
        if (contentType === 'SERIES' && lang === 'ja') p.without_genres = '16';
        let got = await fetch(p);
        if (enough()) break;
        // Mostly-seen first page: go deeper on the same query before relaxing it.
        // A short page means there is nothing deeper.
        for (const page of DEEP_PAGES) {
          if (!got || got.length < PAGE_SIZE) break;
          got = await fetch({ ...p, page });
          if (enough()) return results;
        }
        const relaxed: TMDBDiscoverParams = { ...base, with_original_language: lang };
        if (p.without_genres) relaxed.without_genres = p.without_genres;
        if (contentType === 'ANIME') relaxed.with_genres = '16';
        await fetch(relaxed);
        if (enough() || Date.now() >= deadline) break;
      }
      return results;
    };

    // The client timeout is 10s per call; never let one slow type stall the pick.
    return withBudget(run(), SOURCE_BUDGET_MS, () => [...results]);
  }

  /** TMDB "recommendations" for something the user watched: collaborative filtering for free. */
  private static async seedCandidates(seed: Seed): Promise<Candidate[]> {
    const work = (async () => {
      try {
        if (seed.contentType === 'MOVIE') {
          const r = await tmdbClient.getMovieRecommendations(seed.tmdbId);
          return r.results.map((m) => toCandidate(m, 'MOVIE', seed));
        }
        const r = await tmdbClient.getTVRecommendations(seed.tmdbId);
        return r.results.map((s) => toCandidate(s, isAnime(s) ? 'ANIME' : 'SERIES', seed));
      } catch (error) {
        console.error('[Recommendation] seed recommendations failed', seed, error);
        return [];
      }
    })();
    return withBudget(work, SOURCE_BUDGET_MS, () => []);
  }
}
