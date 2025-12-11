/**
 * Recommendation Service
 * Core logic for generating content recommendations with cascading fallback
 * Language preference is ALWAYS preserved (sacred)
 */

import { ContentType } from '@/config/app.config';
import {
  tmdbClient,
  type TMDBDiscoverParams,
} from '@/infrastructure/external/tmdb.client';
import { loggers } from '@/lib/logger';

const log = loggers.recommendation;

interface RecommendationRequest {
  contentType: ContentType;
  genres: string[];
  languages: string[];
  minRating?: number;
  blacklist?: Set<string>;
}

interface QueryStrategy {
  name: string;
  genres: string[];
  languages: string[];
  minRating: number;
  sortBy?: string;
  voteCountGte?: number;
  tryMultiplePages?: boolean;
}

export class RecommendationService {
  /**
   * Generate a single recommendation based on filters with cascading fallback
   * Language is ALWAYS preserved (sacred)
   */
  static async generateRecommendation(request: RecommendationRequest) {
    const { contentType, genres, languages, minRating = 0, blacklist } = request;

    // Ensure we have at least one language (fallback to 'en' if empty)
    const sacredLanguages = languages.length > 0 ? languages : ['en'];

    // Build strategy list - language is ALWAYS included
    const strategies = this.buildStrategies(genres, sacredLanguages, minRating);

    // Try each strategy in order
    for (const strategy of strategies) {
      
      const result = await this.tryGenerateWithStrategy(
        contentType,
        strategy,
        blacklist
      );
      
      if (result) {
        log.debug(`Success with strategy: ${strategy.name}`);
        // Include strategy info for "Why This Pick?" explanation
        return {
          ...result,
          strategyName: strategy.name,
          strategyGenres: strategy.genres,
          strategyLanguages: strategy.languages,
        };
      }
    }

    // No fallback to other content types - let the caller (generateSmartRecommendation) 
    // handle content type iteration based on user's actual preferences
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
    if (numericGenres.length > 0) {
      // Try each genre individually
      for (const genre of numericGenres) {
        strategies.push({
          name: `Single genre: ${genre}`,
          genres: [genre],
          languages,
          minRating,
          tryMultiplePages: true,
        });
      }
    }

    // Strategy 6: Single genre with lower rating
    if (numericGenres.length > 0 && minRating > 5) {
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
    blacklist?: Set<string>
  ) {
    const { genres, languages, minRating, sortBy, voteCountGte, tryMultiplePages } = strategy;

    // Determine how many pages to try
    const pagesToTry = tryMultiplePages ? [1, 2, 3, 4, 5] : [Math.floor(Math.random() * 5) + 1];

    for (const page of pagesToTry) {
      const queryParams = this.buildQueryParams(
        contentType,
        genres,
        languages,
        minRating,
        sortBy,
        voteCountGte,
        page
      );

      log.debug('TMDB Query', { page, params: queryParams });

      try {
        const response =
          contentType === 'SERIES' || contentType === 'ANIME'
            ? await tmdbClient.discoverTV(queryParams)
            : await tmdbClient.discoverMovies(queryParams);

        log.debug('TMDB Response', { page, total: response.total_results, results: response.results?.length || 0 });

        if (!response.results || response.results.length === 0) {
          continue; // Try next page
        }

        // Filter out blacklisted items
        const results =
          blacklist && blacklist.size > 0
            ? response.results.filter((item) => {
                const key = `${item.id}:${contentType}`;
                return !blacklist.has(key);
              })
            : response.results;

        if (results.length === 0) {
          log.debug(`All results on page ${page} were blacklisted`);
          continue; // Try next page
        }

        // Get random item from results
        const randomIndex = Math.floor(Math.random() * Math.min(results.length, 20));
        const item = results[randomIndex];

        // Map to our format
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
        };
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
    genres: string[],
    languages: string[],
    minRating: number,
    sortBy?: string,
    voteCountGte?: number,
    page: number = 1
  ): TMDBDiscoverParams {
    const queryParams: TMDBDiscoverParams = {
      sort_by: sortBy || 'popularity.desc',
      page,
    };

    // Special handling for ANIME - must have Japanese language and Animation genre
    if (contentType === 'ANIME') {
      queryParams.with_original_language = 'ja';
      queryParams.with_genres = '16'; // Animation genre ID

      // Combine with provided genres if available
      if (genres.length > 0) {
        const numericGenres = genres.filter((g) => !isNaN(Number(g)) && g !== '16');
        if (numericGenres.length > 0) {
          const selectedCount = Math.min(numericGenres.length, Math.random() > 0.5 ? 2 : 1);
          const shuffled = numericGenres.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, selectedCount);
          queryParams.with_genres = `16,${selected.join(',')}`;
        }
      }
    } else {
      // For non-anime content types
      // Add genres (pick 1-2 random to avoid over-filtering)
      if (genres.length > 0) {
        const numericGenres = genres.filter((g) => !isNaN(Number(g)));
        if (numericGenres.length > 0) {
          const selectedCount = Math.min(numericGenres.length, Math.random() > 0.5 ? 2 : 1);
          const shuffled = numericGenres.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, selectedCount);
          queryParams.with_genres = selected.join(',');
        }
      }

      // ALWAYS add language (sacred)
      if (languages.length > 0) {
        queryParams.with_original_language = languages[0];
      }
    }

    // Add minimum rating
    if (minRating > 0) {
      queryParams['vote_average.gte'] = minRating;
    }

    // Add vote count threshold (if specified, otherwise use TMDB client default)
    if (voteCountGte !== undefined) {
      queryParams['vote_count.gte'] = voteCountGte;
    }

    return queryParams;
  }

  /**
   * Generate recommendation using user's taste profile
   * Tries content types in the order provided (priority-based from diversity tracking)
   * NOTE: Content types come pre-ordered based on recent history for diversity
   */
  static async generateSmartRecommendation(profile: {
    contentTypes: ContentType[];
    genres: string[];
    languages: string[];
    minRating?: number;
    blacklist?: Set<string>;
  }) {
    // DON'T shuffle - content types are already prioritized by diversity tracking
    // Types not recently recommended come first
    const orderedTypes = profile.contentTypes;

    // Try each content type until one succeeds
    for (const contentType of orderedTypes) {
      const result = await this.generateRecommendation({
        contentType,
        genres: profile.genres,
        languages: profile.languages,
        minRating: profile.minRating || 6,
        blacklist: profile.blacklist,
      });
      
      if (result) {
        return result;
      }
    }

    // All content types failed
    return null;
  }
}
