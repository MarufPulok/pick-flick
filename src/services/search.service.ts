/**
 * Search Service
 * Provides unified search across movies, TV shows, and people
 * Ranks and transforms results for frontend consumption
 */

import { ContentType } from '@/dtos/common.dto';
import {
    tmdbClient,
    TMDBMultiSearchResult,
} from '@/infrastructure/external/tmdb.client';

/**
 * Search result item
 */
export interface SearchResultItem {
  tmdbId: number;
  title: string;
  type: 'movie' | 'tv' | 'person';
  contentType: ContentType | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  releaseDate: string | null;
  overview: string | null;
  genreIds: number[];
  popularity: number;
  // Person-specific
  profileUrl?: string | null;
  knownFor?: string[];
}

/**
 * Search response
 */
export interface SearchResponse {
  results: SearchResultItem[];
  query: string;
  page: number;
  totalPages: number;
  totalResults: number;
}

interface SearchOptions {
  page?: number;
  filterTypes?: ('movie' | 'tv' | 'person')[];
  minRating?: number;
}

/**
 * Search Service
 */
export class SearchService {
  /**
   * Search across all content types
   */
  static async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const { page = 1, filterTypes, minRating = 0 } = options;

    if (!query || query.trim().length === 0) {
      return {
        results: [],
        query: '',
        page: 1,
        totalPages: 0,
        totalResults: 0,
      };
    }

    try {
      const response = await tmdbClient.searchMulti(query.trim(), page);
      
      // Transform and filter results
      let results = response.results
        .filter(item => {
          // Filter by type if specified
          if (filterTypes && !filterTypes.includes(item.media_type)) {
            return false;
          }
          // Filter by rating for movies/TV
          if (item.media_type !== 'person' && (item.vote_average ?? 0) < minRating) {
            return false;
          }
          return true;
        })
        .map(item => this.transformResult(item))
        .filter((item): item is SearchResultItem => item !== null);

      // Sort by relevance score (popularity + rating)
      results = results.sort((a, b) => {
        const scoreA = a.popularity + (a.rating * 10);
        const scoreB = b.popularity + (b.rating * 10);
        return scoreB - scoreA;
      });

      return {
        results,
        query: query.trim(),
        page: response.page,
        totalPages: response.total_pages,
        totalResults: response.total_results,
      };
    } catch (error) {
      console.error('[SearchService] Search failed:', error);
      return {
        results: [],
        query,
        page: 1,
        totalPages: 0,
        totalResults: 0,
      };
    }
  }

  /**
   * Transform TMDB multi-search result to our format
   */
  private static transformResult(item: TMDBMultiSearchResult): SearchResultItem | null {
    if (item.media_type === 'movie') {
      return {
        tmdbId: item.id,
        title: item.title || item.original_title || 'Unknown',
        type: 'movie',
        contentType: 'MOVIE',
        posterUrl: tmdbClient.getPosterUrl(item.poster_path ?? null, 'MEDIUM'),
        backdropUrl: tmdbClient.getBackdropUrl(item.backdrop_path ?? null, 'MEDIUM'),
        rating: item.vote_average ?? 0,
        releaseDate: item.release_date ?? null,
        overview: item.overview ?? null,
        genreIds: item.genre_ids ?? [],
        popularity: item.popularity ?? 0,
      };
    }

    if (item.media_type === 'tv') {
      // Check if it's anime (Japanese animation)
      const isAnime = item.original_language === 'ja' && 
                      (item.genre_ids?.includes(16) ?? false);
      
      return {
        tmdbId: item.id,
        title: item.name || item.original_name || 'Unknown',
        type: 'tv',
        contentType: isAnime ? 'ANIME' : 'SERIES',
        posterUrl: tmdbClient.getPosterUrl(item.poster_path ?? null, 'MEDIUM'),
        backdropUrl: tmdbClient.getBackdropUrl(item.backdrop_path ?? null, 'MEDIUM'),
        rating: item.vote_average ?? 0,
        releaseDate: item.first_air_date ?? null,
        overview: item.overview ?? null,
        genreIds: item.genre_ids ?? [],
        popularity: item.popularity ?? 0,
      };
    }

    if (item.media_type === 'person') {
      const knownFor = item.known_for?.map(k => k.title || k.name || '').filter(Boolean) ?? [];
      
      return {
        tmdbId: item.id,
        title: item.name || 'Unknown',
        type: 'person',
        contentType: null,
        posterUrl: null,
        backdropUrl: null,
        rating: 0,
        releaseDate: null,
        overview: item.known_for_department ?? null,
        genreIds: [],
        popularity: item.popularity ?? 0,
        profileUrl: item.profile_path 
          ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
          : null,
        knownFor,
      };
    }

    return null;
  }

  /**
   * Get search suggestions (first 5 results)
   */
  static async getSuggestions(query: string): Promise<SearchResultItem[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const response = await this.search(query, {
      page: 1,
      filterTypes: ['movie', 'tv'], // Only movies and TV for suggestions
    });

    return response.results.slice(0, 5);
  }
}
