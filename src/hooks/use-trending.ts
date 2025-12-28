/**
 * useTrending Hook
 * React Query hook for fetching trending content
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useQuery } from '@tanstack/react-query';

interface TrendingContentItem {
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
  mediaType?: 'movie' | 'tv';
}

interface TrendingContentResponse {
  items: TrendingContentItem[];
  contentType: string;
  timeWindow: 'day' | 'week';
  count: number;
}

interface UseTrendingOptions {
  type?: 'MOVIE' | 'SERIES' | 'ANIME' | 'ALL';
  timeWindow?: 'day' | 'week';
  limit?: number;
  enabled?: boolean;
}

export function useTrending(options: UseTrendingOptions = {}) {
  const { 
    type = 'ALL', 
    timeWindow = 'day', 
    limit = 10, 
    enabled = true 
  } = options;

  return useQuery<TrendingContentResponse>({
    queryKey: ['trending', type, timeWindow, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        type,
        timeWindow,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/trending?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch trending content');
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (trending changes, but not too frequently for UI)
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}
