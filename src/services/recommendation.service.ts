/**
 * Recommendation Service
 * Core logic for generating content recommendations
 */

import { ContentType } from '@/config/app.config';
import { tmdbClient, type TMDBDiscoverParams } from '@/infrastructure/external/tmdb.client';
import { TMDBQueryBuilderService } from './tmdb-query-builder.service';

interface RecommendationRequest {
  contentType: ContentType;
  genres: string[];
  languages: string[];
  minRating?: number;
}

export class RecommendationService {
  /**
   * Generate a single recommendation based on filters
   */
  static async generateRecommendation(request: RecommendationRequest) {
    const { contentType, genres, languages, minRating = 0 } = request;

    // Build query params
    const queryParams: TMDBDiscoverParams = {
      sort_by: 'popularity.desc',
      page: Math.floor(Math.random() * 5) + 1, // Random page 1-5
    };

    // Add genres (pick 1-2 random to avoid over-filtering)
    if (genres.length > 0) {
      const numericGenres = genres.filter((g) => !isNaN(Number(g)));
      if (numericGenres.length > 0) {
        // Pick 1-2 random genres to avoid making query too restrictive
        const selectedCount = Math.min(numericGenres.length, Math.random() > 0.5 ? 2 : 1);
        const shuffled = numericGenres.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, selectedCount);
        queryParams.with_genres = selected.join(',');
      }
    }

    // Add language
    if (languages.length > 0) {
      queryParams.with_original_language = languages[0];
    }

    // Add minimum rating
    if (minRating > 0) {
      queryParams['vote_average.gte'] = minRating;
    }

    console.log('TMDB Query - Content Type:', contentType);
    console.log('TMDB Query - Params:', JSON.stringify(queryParams, null, 2));

    // Query TMDB using appropriate method
    const response = contentType === 'SERIES' || contentType === 'ANIME'
      ? await tmdbClient.discoverTV(queryParams)
      : await tmdbClient.discoverMovies(queryParams);

    console.log('TMDB Response - Total results:', response.total_results);
    console.log('TMDB Response - Results count:', response.results?.length || 0);

    if (!response.results || response.results.length === 0) {
      return null;
    }

    // Get random item from results
    const results = response.results;
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
  }

  /**
   * Generate recommendation using user's taste profile
   */
  static async generateSmartRecommendation(profile: {
    contentTypes: ContentType[];
    genres: string[];
    languages: string[];
  }) {
    // Pick random content type from user's preferences
    const randomContentType =
      profile.contentTypes[Math.floor(Math.random() * profile.contentTypes.length)];

    return this.generateRecommendation({
      contentType: randomContentType,
      genres: profile.genres,
      languages: profile.languages,
      minRating: 6, // Default minimum for smart mode
    });
  }
}
