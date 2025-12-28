/**
 * useSimilar Hook
 * React Query hook for fetching similar content
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useQuery } from '@tanstack/react-query';

interface SimilarContentItem {
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

interface SimilarContentResponse {
  items: SimilarContentItem[];
  tmdbId: number;
  contentType: ContentType;
  count: number;
}

interface UseSimilarOptions {
  limit?: number;
  excludeIds?: number[];
  enabled?: boolean;
}

export function useSimilar(
  tmdbId: number | null,
  contentType: ContentType | null,
  options: UseSimilarOptions = {}
) {
  const { limit = 8, excludeIds = [], enabled = true } = options;

  return useQuery<SimilarContentResponse>({
    queryKey: ['similar', tmdbId, contentType, limit, excludeIds],
    queryFn: async () => {
      if (!tmdbId || !contentType) {
        throw new Error('Missing tmdbId or contentType');
      }

      const params = new URLSearchParams({
        type: contentType,
        limit: limit.toString(),
      });

      if (excludeIds.length > 0) {
        params.set('exclude', excludeIds.join(','));
      }

      const response = await fetch(`/api/similar/${tmdbId}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch similar content');
      }

      return response.json();
    },
    enabled: enabled && !!tmdbId && !!contentType,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
