/**
 * useHistory Hook
 * React Query hook for fetching user's recommendation history
 */

'use client';

import { useQuery } from '@tanstack/react-query';

interface HistoryItem {
  _id: string;
  tmdbId: number;
  contentType: 'MOVIE' | 'SERIES' | 'ANIME';
  action: 'WATCHED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED';
  title: string;
  posterPath?: string;
  rating?: number;
  releaseDate?: string;
  source?: 'FILTERED' | 'SMART';
  createdAt: string;
}

interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  hasMore: boolean;
}

export function useHistory(options: { limit?: number } = {}) {
  const { limit = 10 } = options;

  const { data, isLoading, error, refetch } = useQuery<HistoryResponse>({
    queryKey: ['history', limit],
    queryFn: async () => {
      const response = await fetch(`/api/history?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      return response.json();
    },
  });

  return {
    history: data?.items || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refetch,
  };
}
