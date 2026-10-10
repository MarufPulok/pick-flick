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

export interface Seed {
  tmdbId: number;
  contentType: ContentType;
  title: string;
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
  seed?: Seed;
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
  /** Content types of the last few picks; they get a diversity penalty. */
  recentTypes?: string[];
  /** Explicit mood genres: replace profile genres and skip seeds. */
  moodGenres?: string[];
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

/** Weighted sample of k distinct genres. Weight 50 is neutral, 100 double, 0 almost never. */
function pickGenres(genres: string[], k: number, weights: Weights = {}): string[] {
  const pool = genres.map((g) => ({ g, w: Math.max(1, weights[g] ?? NEUTRAL) }));
  const out: string[] = [];
  while (pool.length && out.length < k) {
    let r = Math.random() * pool.reduce((s, p) => s + p.w, 0);
    const i = pool.findIndex((p) => (r -= p.w) < 0);
    out.push(pool.splice(i === -1 ? pool.length - 1 : i, 1)[0].g);
  }
  return out;
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
    const minRating = request.minRating ?? 6;
    const languages = request.languages.length > 0 ? [...new Set(request.languages)] : ['en'];
    const mood = request.moodGenres?.length ? request.moodGenres : null;
    const genres = mood ?? request.genres;
    const weights = request.weights ?? {};
    const types = request.contentTypes;

    // 1. Source: one discover query per content type (equal budget) + seeds.
    const seeds = mood ? [] : (request.seeds ?? []).slice(0, 3);
    const pool = (
      await Promise.all([
        ...types.map((t) => this.discoverCandidates(t, genres, languages, minRating, weights.genres)),
        ...seeds.map((s) => this.seedCandidates(s)),
      ])
    ).flat();

    // 2. Filter: already seen, wrong type, quality floor, language.
    // Seed-sourced candidates may be in any language: the seed proves the user
    // watches it.
    const seen = new Set<string>();
    const allowedLang = new Set(languages);
    const candidates = pool.filter((c) => {
      const key = seenKey(c.tmdbId, c.contentType);
      if (seen.has(key) || request.excluded?.has(key)) return false;
      seen.add(key);
      if (!types.includes(c.contentType)) return false;
      if (c.voteCount < 50 || c.rating < minRating - 0.5) return false;
      return c.contentType === 'ANIME' || !!c.seed || allowedLang.has(c.originalLanguage);
    });

    if (candidates.length === 0) {
      log.debug('Smart pipeline produced no candidates', { types, genres, languages });
      return null;
    }

    // 3. Pick the content type first so every type the user chose gets an
    // equal share of nights, bent only by learning and a diversity penalty.
    // Scoring across types would let TV's higher TMDB ratings bury movies.
    const n = (map: Weights | undefined, k: string) => (map?.[k] ?? NEUTRAL) / NEUTRAL; // 1 = neutral
    const recent = (request.recentTypes ?? []).slice(0, 2);
    const typePool = types.filter((t) => candidates.some((c) => c.contentType === t));
    const typeWeights = typePool.map((t) => n(weights.contentTypes, t) * (recent.includes(t) ? 0.6 : 1));
    let rt = Math.random() * typeWeights.reduce((a, b) => a + b, 0);
    const type = typePool.find((_, i) => (rt -= typeWeights[i]) < 0) ?? typePool[0];
    const ofType = candidates.filter((c) => c.contentType === type);

    // Seed recommendations are dense and well-rated, so left in one pool they
    // would win every time. Seeds get 40% of nights, and only when the seed
    // pool is wide enough that it will not repeat the same title.
    const seeded = ofType.filter((c) => c.seed);
    const discovered = ofType.filter((c) => !c.seed);
    const useSeeds = seeded.length >= 5 && (discovered.length === 0 || Math.random() < 0.4);
    const pool2 = useSeeds ? seeded : discovered.length > 0 ? discovered : seeded;

    // 4. Score within the type.
    const numeric = genres.filter((g) => !isNaN(Number(g)));
    const liked = new Set([...numeric, ...toTvGenres(numeric)]);
    const scored = pool2.map((c) => {
      const ids = c.genreIds.map(String);
      const genreScore =
        ids.reduce((s, g) => s + (liked.has(g) ? 1 : 0) + (n(weights.genres, g) - 1), 0) /
        Math.max(1, Math.min(3, ids.length));
      const langScore = n(weights.languages, c.originalLanguage);
      const ratingScore = (c.rating - 6) / 2;
      const score = genreScore * (mood ? 2 : 1) + langScore * 0.4 + ratingScore * 0.6;
      return { c, score, matched: ids.filter((g) => liked.has(g)) };
    });

    // 5. Sample from the top with a softmax so the same pick does not repeat.
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 20);
    const temperature = 1;
    const max = top[0].score;
    const probs = top.map((s) => Math.exp((s.score - max) / temperature));
    let r = Math.random() * probs.reduce((a, b) => a + b, 0);
    const chosen = top.find((_, i) => (r -= probs[i]) < 0) ?? top[0];

    log.debug('Smart pick', { candidates: candidates.length, type, pool: useSeeds ? 'seeds' : 'discover', score: chosen.score });

    const { c, matched } = chosen;
    return {
      ...c,
      strategyName: c.seed ? 'Because you watched' : matched.length >= 2 ? 'All genres' : matched.length === 1 ? 'Single genre' : 'No genres',
      strategyGenres: matched,
      strategyLanguages: [c.originalLanguage],
    };
  }

  /** One popularity-sorted discover page for a content type. Relaxes to no genres when thin. */
  private static async discoverCandidates(
    contentType: ContentType,
    genres: string[],
    languages: string[],
    minRating: number,
    genreWeights?: Weights
  ): Promise<Candidate[]> {
    const usable = genresFor(contentType, genres);
    const picked = pickGenres(usable, usable.length >= 2 && Math.random() > 0.5 ? 2 : 1, genreWeights);
    const base: TMDBDiscoverParams = {
      sort_by: 'popularity.desc',
      page: 1 + Math.floor(Math.random() * 3),
      'vote_average.gte': Math.max(0, minRating - 0.5),
      'vote_count.gte': 50,
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

    const fetch = async (p: TMDBDiscoverParams): Promise<Candidate[]> => {
      try {
        if (contentType === 'MOVIE') {
          return (await tmdbClient.discoverMovies(p)).results.map((m) => toCandidate(m, 'MOVIE'));
        }
        return (await tmdbClient.discoverTV(p)).results.map((s) =>
          toCandidate(s, contentType === 'ANIME' || isAnime(s) ? 'ANIME' : 'SERIES')
        );
      } catch (error) {
        console.error('[Recommendation] discover failed', error);
        return [];
      }
    };

    const results = await fetch(params);
    if (results.length >= 5) return results;
    const relaxed: TMDBDiscoverParams = { ...base, with_original_language: params.with_original_language };
    if (contentType === 'ANIME') relaxed.with_genres = '16';
    return [...results, ...(await fetch(relaxed))];
  }

  /** TMDB "recommendations" for something the user watched: collaborative filtering for free. */
  private static async seedCandidates(seed: Seed): Promise<Candidate[]> {
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
  }
}
