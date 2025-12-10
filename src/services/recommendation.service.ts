/**
 * Recommendation Service
 * Core logic for generating content recommendations with cascading fallback
 */

import { ContentType } from "@/config/app.config";
import {
    tmdbClient,
    type TMDBDiscoverParams,
} from "@/infrastructure/external/tmdb.client";

interface RecommendationRequest {
  contentType: ContentType;
  genres: string[];
  languages: string[];
  minRating?: number;
}

export class RecommendationService {
  /**
   * Generate a single recommendation based on filters with cascading fallback
   */
  static async generateRecommendation(request: RecommendationRequest) {
    const { contentType, genres, languages, minRating = 0 } = request;

    // Strategy 1: Try with all filters (most specific)
    let result = await this.tryGenerateWithFilters(contentType, genres, languages, minRating);
    if (result) return result;

    // Strategy 2: Try with fewer genres (reduce to 1 random genre)
    if (genres.length > 1) {
      const numericGenres = genres.filter((g) => !isNaN(Number(g)));
      if (numericGenres.length > 1) {
        const singleGenre = [numericGenres[Math.floor(Math.random() * numericGenres.length)]];
        result = await this.tryGenerateWithFilters(contentType, singleGenre, languages, minRating);
        if (result) return result;
      }
    }

    // Strategy 3: Try without language filter
    if (languages.length > 0) {
      result = await this.tryGenerateWithFilters(contentType, genres, [], minRating);
      if (result) return result;
    }

    // Strategy 4: Try with lower rating threshold (reduce by 1, minimum 5.0)
    if (minRating > 5) {
      const lowerRating = Math.max(5.0, minRating - 1);
      result = await this.tryGenerateWithFilters(contentType, genres, languages, lowerRating);
      if (result) return result;
    }

    // Strategy 5: Try with single genre + no language + lower rating
    if (genres.length > 0) {
      const numericGenres = genres.filter((g) => !isNaN(Number(g)));
      if (numericGenres.length > 0) {
        const singleGenre = [numericGenres[Math.floor(Math.random() * numericGenres.length)]];
        const relaxedRating = Math.max(5.0, (minRating || 0) - 1);
        result = await this.tryGenerateWithFilters(contentType, singleGenre, [], relaxedRating);
        if (result) return result;
      }
    }

    // Strategy 6: Try with just content type and minimal rating (5.0)
    result = await this.tryGenerateWithFilters(contentType, [], [], 5.0);
    if (result) return result;

    // Strategy 7: Last resort - just popular content of the requested type (no filters)
    result = await this.tryGenerateWithFilters(contentType, [], [], 0);
    if (result) return result;

    // If still no results, return null
    // This should be extremely rare as Strategy 7 queries just by content type with no filters
    return null;
  }

  /**
   * Try to generate recommendation with specific filters
   * Returns null if no results found
   */
  private static async tryGenerateWithFilters(
    contentType: ContentType,
    genres: string[],
    languages: string[],
    minRating: number
  ) {
    // Build query params
    const queryParams: TMDBDiscoverParams = {
      sort_by: "popularity.desc",
      page: Math.floor(Math.random() * 5) + 1, // Random page 1-5
    };

    // Special handling for ANIME - must have Japanese language and Animation genre
    if (contentType === 'ANIME') {
      queryParams.with_original_language = 'ja';
      queryParams.with_genres = '16'; // Animation genre ID
      
      // For anime, ignore the provided language filter (always Japanese)
      // But still use provided genres if available (combine with animation)
      if (genres.length > 0) {
        const numericGenres = genres.filter((g) => !isNaN(Number(g)));
        if (numericGenres.length > 0) {
          const selectedCount = Math.min(
            numericGenres.length,
            Math.random() > 0.5 ? 2 : 1
          );
          const shuffled = numericGenres.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, selectedCount);
          // Combine with animation genre ID
          queryParams.with_genres = `16,${selected.join(",")}`;
        }
      }
    } else {
      // For non-anime content types
      // Add genres (pick 1-2 random to avoid over-filtering)
      if (genres.length > 0) {
        const numericGenres = genres.filter((g) => !isNaN(Number(g)));
        if (numericGenres.length > 0) {
          const selectedCount = Math.min(
            numericGenres.length,
            Math.random() > 0.5 ? 2 : 1
          );
          const shuffled = numericGenres.sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, selectedCount);
          queryParams.with_genres = selected.join(",");
        }
      }

      // Add language
      if (languages.length > 0) {
        queryParams.with_original_language = languages[0];
      }
    }

    // Add minimum rating
    if (minRating > 0) {
      queryParams["vote_average.gte"] = minRating;
    }

    console.log("TMDB Query - Content Type:", contentType);
    console.log("TMDB Query - Params:", JSON.stringify(queryParams, null, 2));

    try {
      // Query TMDB using appropriate method
      const response =
        contentType === "SERIES" || contentType === "ANIME"
          ? await tmdbClient.discoverTV(queryParams)
          : await tmdbClient.discoverMovies(queryParams);

      console.log("TMDB Response - Total results:", response.total_results);
      console.log(
        "TMDB Response - Results count:",
        response.results?.length || 0
      );

      if (!response.results || response.results.length === 0) {
        return null;
      }

      // Get random item from results
      const results = response.results;
      const randomIndex = Math.floor(
        Math.random() * Math.min(results.length, 20)
      );
      const item = results[randomIndex];

      // Map to our format
      return {
        tmdbId: item.id,
        contentType,
        title: "title" in item ? item.title : item.name,
        overview: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        releaseDate:
          "release_date" in item ? item.release_date : item.first_air_date,
        rating: item.vote_average,
        voteCount: item.vote_count,
        genreIds: item.genre_ids,
        originalLanguage: item.original_language,
      };
    } catch (error) {
      console.error("Error querying TMDB:", error);
      return null;
    }
  }

  /**
   * Generate recommendation using user's taste profile
   */
  static async generateSmartRecommendation(profile: {
    contentTypes: ContentType[];
    genres: string[];
    languages: string[];
    minRating?: number;
  }) {
    // Pick random content type from user's preferences
    const randomContentType =
      profile.contentTypes[
        Math.floor(Math.random() * profile.contentTypes.length)
      ];

    return this.generateRecommendation({
      contentType: randomContentType,
      genres: profile.genres,
      languages: profile.languages,
      minRating: profile.minRating || 6, // Use user preference or default to 6
    });
  }
}
