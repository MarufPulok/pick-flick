/**
 * Similar Content Service
 * Provides "More Like This" functionality using hybrid strategy
 * 
 * Strategy:
 * 1. Fetch both similar and recommendations from TMDB
 * 2. Merge and deduplicate results
 * 3. Filter out already watched/blacklisted content
 * 4. Rank by a combination of vote_average and popularity
 */

import { ContentType } from '@/dtos/common.dto';
import {
    tmdbClient,
    TMDBMovie,
    TMDBTVShow,
} from '@/infrastructure/external/tmdb.client';

export interface SimilarContentItem {
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
}

interface GetSimilarOptions {
  limit?: number;
  excludeIds?: Set<number>;
}

/**
 * Similar Content Service
 */
export class SimilarService {
  /**
   * Get similar content for a movie or TV show
   * Uses hybrid strategy: combines similar + recommendations, deduped and ranked
   */
  static async getSimilarContent(
    tmdbId: number,
    contentType: ContentType,
    options: GetSimilarOptions = {}
  ): Promise<SimilarContentItem[]> {
    const { limit = 10, excludeIds = new Set() } = options;

    try {
      if (contentType === 'MOVIE') {
        return this.getSimilarMovies(tmdbId, limit, excludeIds);
      } else {
        // SERIES and ANIME both use TV endpoints
        return this.getSimilarTV(tmdbId, limit, excludeIds, contentType);
      }
    } catch (error) {
      console.error('[SimilarService] Error fetching similar content:', error);
      return [];
    }
  }

  /**
   * Get similar movies using hybrid strategy
   */
  private static async getSimilarMovies(
    movieId: number,
    limit: number,
    excludeIds: Set<number>
  ): Promise<SimilarContentItem[]> {
    // Fetch both similar and recommendations in parallel
    const [similarResponse, recommendationsResponse] = await Promise.all([
      tmdbClient.getSimilarMovies(movieId),
      tmdbClient.getMovieRecommendations(movieId),
    ]);

    const allMovies = [
      ...similarResponse.results,
      ...recommendationsResponse.results,
    ];

    // Dedupe, filter, and transform
    const uniqueMovies = this.dedupeAndFilter<TMDBMovie>(
      allMovies,
      excludeIds,
      (m) => m.id
    );

    // Rank by combined score (rating * log(popularity))
    const ranked = uniqueMovies
      .map((movie) => ({
        ...movie,
        score: movie.vote_average * Math.log10(Math.max(movie.popularity, 1) + 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Transform to SimilarContentItem
    return ranked.map((movie) => ({
      tmdbId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      posterUrl: tmdbClient.getPosterUrl(movie.poster_path, 'MEDIUM'),
      backdropUrl: tmdbClient.getBackdropUrl(movie.backdrop_path, 'MEDIUM'),
      rating: movie.vote_average,
      releaseDate: movie.release_date,
      overview: movie.overview,
      contentType: 'MOVIE' as ContentType,
      genreIds: movie.genre_ids,
      popularity: movie.popularity,
    }));
  }

  /**
   * Get similar TV shows using hybrid strategy
   */
  private static async getSimilarTV(
    tvId: number,
    limit: number,
    excludeIds: Set<number>,
    contentType: ContentType // SERIES or ANIME
  ): Promise<SimilarContentItem[]> {
    // Fetch both similar and recommendations in parallel
    const [similarResponse, recommendationsResponse] = await Promise.all([
      tmdbClient.getSimilarTV(tvId),
      tmdbClient.getTVRecommendations(tvId),
    ]);

    const allShows = [
      ...similarResponse.results,
      ...recommendationsResponse.results,
    ];

    // Dedupe, filter, and transform
    const uniqueShows = this.dedupeAndFilter<TMDBTVShow>(
      allShows,
      excludeIds,
      (s) => s.id
    );

    // For ANIME, filter to Japanese animation
    const filteredShows = contentType === 'ANIME'
      ? uniqueShows.filter(
          (show) =>
            show.original_language === 'ja' &&
            show.genre_ids.includes(16) // Animation genre
        )
      : uniqueShows;

    // Rank by combined score
    const ranked = filteredShows
      .map((show) => ({
        ...show,
        score: show.vote_average * Math.log10(Math.max(show.popularity, 1) + 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Transform to SimilarContentItem
    return ranked.map((show) => ({
      tmdbId: show.id,
      title: show.name,
      posterPath: show.poster_path,
      posterUrl: tmdbClient.getPosterUrl(show.poster_path, 'MEDIUM'),
      backdropUrl: tmdbClient.getBackdropUrl(show.backdrop_path, 'MEDIUM'),
      rating: show.vote_average,
      releaseDate: show.first_air_date,
      overview: show.overview,
      contentType,
      genreIds: show.genre_ids,
      popularity: show.popularity,
    }));
  }

  /**
   * Deduplicate and filter items
   */
  private static dedupeAndFilter<T>(
    items: T[],
    excludeIds: Set<number>,
    getId: (item: T) => number
  ): T[] {
    const seen = new Set<number>();
    return items.filter((item) => {
      const id = getId(item);
      if (seen.has(id) || excludeIds.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }
}
