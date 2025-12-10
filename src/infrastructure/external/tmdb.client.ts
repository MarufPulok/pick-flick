/**
 * TMDB API Client
 * Handles all interactions with The Movie Database API
 */

import { serverEnv } from '@/config/env.config';
import { EXTERNAL_APIS } from '@/config/url.config';
import axios, { type AxiosError, type AxiosInstance } from 'axios';

/**
 * TMDB API Response Types
 */
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  adult: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  origin_country: string[];
}

export interface TMDBSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenresResponse {
  genres: TMDBGenre[];
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  genres: TMDBGenre[];
  production_countries: { iso_3166_1: string; name: string }[];
  status: string;
  tagline: string;
}

export interface TMDBTVDetails extends TMDBTVShow {
  number_of_seasons: number;
  number_of_episodes: number;
  genres: TMDBGenre[];
  episode_run_time: number[];
  status: string;
  tagline: string;
}

/**
 * TMDB Discovery Parameters
 */
export interface TMDBDiscoverParams {
  with_genres?: string;
  with_original_language?: string;
  'vote_average.gte'?: number;
  'vote_count.gte'?: number;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  'first_air_date.gte'?: string;
  'first_air_date.lte'?: string;
  sort_by?: string;
  page?: number;
  include_adult?: boolean;
}

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  private queue: Array<() => void> = [];
  private isProcessing = false;
  private lastCallTime = 0;
  private minInterval = 100; // 100ms between calls (10 req/sec)

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;

      if (timeSinceLastCall < this.minInterval) {
        await new Promise((r) => setTimeout(r, this.minInterval - timeSinceLastCall));
      }

      const fn = this.queue.shift();
      if (fn) {
        this.lastCallTime = Date.now();
        await fn();
      }
    }

    this.isProcessing = false;
  }
}

/**
 * TMDB API Client Class
 */
class TMDBClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = axios.create({
      baseURL: EXTERNAL_APIS.TMDB.BASE_URL,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverEnv.TMDB_ACCESS_TOKEN}`,
      },
      timeout: 10000,
    });

    this.rateLimiter = new RateLimiter();

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          // Rate limited - wait and retry
          await new Promise((r) => setTimeout(r, 1000));
          return this.client.request(error.config!);
        }
        throw error;
      }
    );
  }

  /**
   * Discover movies with filters
   */
  async discoverMovies(params: TMDBDiscoverParams = {}): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.rateLimiter.throttle(async () => {
      const response = await this.client.get<TMDBSearchResponse<TMDBMovie>>('/discover/movie', {
        params: {
          include_adult: false,
          language: 'en-US',
          sort_by: 'popularity.desc',
          'vote_count.gte': 100,
          ...params,
        },
      });
      return response.data;
    });
  }

  /**
   * Discover TV shows with filters
   */
  async discoverTV(params: TMDBDiscoverParams = {}): Promise<TMDBSearchResponse<TMDBTVShow>> {
    return this.rateLimiter.throttle(async () => {
      const response = await this.client.get<TMDBSearchResponse<TMDBTVShow>>('/discover/tv', {
        params: {
          include_adult: false,
          language: 'en-US',
          sort_by: 'popularity.desc',
          'vote_count.gte': 100,
          ...params,
        },
      });
      return response.data;
    });
  }

  /**
   * Discover anime (TV shows with Japanese language and Animation genre)
   */
  async discoverAnime(params: TMDBDiscoverParams = {}): Promise<TMDBSearchResponse<TMDBTVShow>> {
    return this.discoverTV({
      with_original_language: 'ja',
      with_genres: '16', // Animation genre ID
      ...params,
    });
  }

  /**
   * Get movie details by ID
   */
  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    return this.rateLimiter.throttle(async () => {
      const response = await this.client.get<TMDBMovieDetails>(`/movie/${movieId}`, {
        params: { language: 'en-US' },
      });
      return response.data;
    });
  }

  /**
   * Get TV show details by ID
   */
  async getTVDetails(tvId: number): Promise<TMDBTVDetails> {
    return this.rateLimiter.throttle(async () => {
      const response = await this.client.get<TMDBTVDetails>(`/tv/${tvId}`, {
        params: { language: 'en-US' },
      });
      return response.data;
    });
  }

  /**
   * Get movie genres list
   */
  async getMovieGenres(): Promise<TMDBGenre[]> {
    return this.rateLimiter.throttle(async () => {
      const response = await this.client.get<TMDBGenresResponse>('/genre/movie/list', {
        params: { language: 'en-US' },
      });
      return response.data.genres;
    });
  }

  /**
   * Get TV genres list
   */
  async getTVGenres(): Promise<TMDBGenre[]> {
    return this.rateLimiter.throttle(async () => {
      const response = await this.client.get<TMDBGenresResponse>('/genre/tv/list', {
        params: { language: 'en-US' },
      });
      return response.data.genres;
    });
  }

  /**
   * Search movies by query
   */
  async searchMovies(query: string, page = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.rateLimiter.throttle(async () => {
      const response = await this.client.get<TMDBSearchResponse<TMDBMovie>>('/search/movie', {
        params: {
          query,
          page,
          include_adult: false,
          language: 'en-US',
        },
      });
      return response.data;
    });
  }

  /**
   * Search TV shows by query
   */
  async searchTV(query: string, page = 1): Promise<TMDBSearchResponse<TMDBTVShow>> {
    return this.rateLimiter.throttle(async () => {
      const response = await this.client.get<TMDBSearchResponse<TMDBTVShow>>('/search/tv', {
        params: {
          query,
          page,
          include_adult: false,
          language: 'en-US',
        },
      });
      return response.data;
    });
  }

  /**
   * Get poster URL
   */
  getPosterUrl(path: string | null, size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL' = 'MEDIUM'): string | null {
    if (!path) return null;
    return `${EXTERNAL_APIS.TMDB.IMAGE_BASE_URL}/${EXTERNAL_APIS.TMDB.POSTER_SIZES[size]}${path}`;
  }

  /**
   * Get backdrop URL
   */
  getBackdropUrl(path: string | null, size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL' = 'LARGE'): string | null {
    if (!path) return null;
    return `${EXTERNAL_APIS.TMDB.IMAGE_BASE_URL}/${EXTERNAL_APIS.TMDB.BACKDROP_SIZES[size]}${path}`;
  }
}

// Singleton instance
export const tmdbClient = new TMDBClient();
