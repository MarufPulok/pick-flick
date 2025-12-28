/**
 * Trending Content Service
 * Provides trending movies and TV shows with regional support
 */

import { ContentType } from '@/dtos/common.dto';
import {
    tmdbClient,
    TMDBMovie,
    TMDBTVShow,
    TrendingTimeWindow,
} from '@/infrastructure/external/tmdb.client';

export interface TrendingContentItem {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  releaseDate: string;
  overview: string | null;
  contentType: ContentType;
  genreIds: number[];
  popularity: number;
  mediaType?: 'movie' | 'tv'; // For mixed results
}

interface GetTrendingOptions {
  limit?: number;
  timeWindow?: TrendingTimeWindow;
}

/**
 * Trending Content Service
 */
export class TrendingService {
  /**
   * Get trending movies
   */
  static async getTrendingMovies(
    options: GetTrendingOptions = {}
  ): Promise<TrendingContentItem[]> {
    const { limit = 10, timeWindow = 'day' } = options;

    try {
      const response = await tmdbClient.getTrendingMovies(timeWindow);
      
      return response.results.slice(0, limit).map((movie) => 
        this.transformMovie(movie)
      );
    } catch (error) {
      console.error('[TrendingService] Error fetching trending movies:', error);
      return [];
    }
  }

  /**
   * Get trending TV shows
   */
  static async getTrendingTV(
    options: GetTrendingOptions = {}
  ): Promise<TrendingContentItem[]> {
    const { limit = 10, timeWindow = 'day' } = options;

    try {
      const response = await tmdbClient.getTrendingTV(timeWindow);
      
      return response.results.slice(0, limit).map((show) => 
        this.transformTVShow(show)
      );
    } catch (error) {
      console.error('[TrendingService] Error fetching trending TV:', error);
      return [];
    }
  }

  /**
   * Get trending all (mixed movies and TV)
   */
  static async getTrendingAll(
    options: GetTrendingOptions = {}
  ): Promise<TrendingContentItem[]> {
    const { limit = 20, timeWindow = 'day' } = options;

    try {
      const response = await tmdbClient.getTrendingAll(timeWindow);
      
      return response.results.slice(0, limit).map((item) => {
        // Mixed response - need to check media_type
        const mediaType = (item as TMDBMovie & { media_type?: string }).media_type;
        
        if (mediaType === 'movie' || 'title' in item) {
          return this.transformMovie(item as TMDBMovie);
        } else {
          return this.transformTVShow(item as TMDBTVShow);
        }
      });
    } catch (error) {
      console.error('[TrendingService] Error fetching trending all:', error);
      return [];
    }
  }

  /**
   * Get trending by content type
   */
  static async getTrendingByType(
    contentType: ContentType | 'ALL',
    options: GetTrendingOptions = {}
  ): Promise<TrendingContentItem[]> {
    switch (contentType) {
      case 'MOVIE':
        return this.getTrendingMovies(options);
      case 'SERIES':
      case 'ANIME':
        return this.getTrendingTV(options);
      case 'ALL':
      default:
        return this.getTrendingAll(options);
    }
  }

  /**
   * Transform TMDB movie to TrendingContentItem
   */
  private static transformMovie(movie: TMDBMovie): TrendingContentItem {
    return {
      tmdbId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      posterUrl: tmdbClient.getPosterUrl(movie.poster_path, 'MEDIUM'),
      backdropUrl: tmdbClient.getBackdropUrl(movie.backdrop_path, 'MEDIUM'),
      rating: movie.vote_average,
      releaseDate: movie.release_date,
      overview: movie.overview,
      contentType: 'MOVIE',
      genreIds: movie.genre_ids,
      popularity: movie.popularity,
      mediaType: 'movie',
    };
  }

  /**
   * Transform TMDB TV show to TrendingContentItem
   */
  private static transformTVShow(show: TMDBTVShow): TrendingContentItem {
    // Check if it's anime (Japanese animation)
    const isAnime = show.original_language === 'ja' && show.genre_ids.includes(16);
    
    return {
      tmdbId: show.id,
      title: show.name,
      posterPath: show.poster_path,
      posterUrl: tmdbClient.getPosterUrl(show.poster_path, 'MEDIUM'),
      backdropUrl: tmdbClient.getBackdropUrl(show.backdrop_path, 'MEDIUM'),
      rating: show.vote_average,
      releaseDate: show.first_air_date,
      overview: show.overview,
      contentType: isAnime ? 'ANIME' : 'SERIES',
      genreIds: show.genre_ids,
      popularity: show.popularity,
      mediaType: 'tv',
    };
  }
}
