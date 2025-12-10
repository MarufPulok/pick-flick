/**
 * TMDB Query Builder Service
 * Builds query parameters for TMDB Discovery API
 */

import { ContentType } from '@/config/app.config';

interface TMDBQueryParams {
  with_genres?: string;
  with_original_language?: string;
  'vote_average.gte'?: number;
  sort_by?: string;
  page?: number;
}

export class TMDBQueryBuilderService {
  /**
   * Build query params for movie/series discovery
   */
  static buildDiscoveryQuery(
    contentType: ContentType,
    genres: string[],
    languages: string[],
    minRating: number = 0
  ): TMDBQueryParams {
    const params: TMDBQueryParams = {
      sort_by: 'popularity.desc',
      page: Math.floor(Math.random() * 5) + 1, // Random page 1-5 for variety
    };

    // Add genres (comma-separated IDs)
    if (genres.length > 0) {
      // Filter numeric genre IDs (movies/series), exclude anime genres
      const numericGenres = genres.filter((g) => !isNaN(Number(g)));
      if (numericGenres.length > 0) {
        params.with_genres = numericGenres.join(',');
      }
    }

    // Add language
    if (languages.length > 0) {
      // Use first language as primary
      params.with_original_language = languages[0];
    }

    // Add minimum rating
    if (minRating > 0) {
      params['vote_average.gte'] = minRating;
    }

    return params;
  }

  /**
   * Determine if content should be treated as anime
   */
  static isAnimeContent(contentType: ContentType, languages: string[]): boolean {
    return contentType === 'ANIME' || languages.includes('ja');
  }
}
