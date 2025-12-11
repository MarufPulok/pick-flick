/**
 * useStats Hook
 * React Query hook for fetching and managing user stats
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UserStats {
  watchedCount: number;
  likedCount: number;
  dislikedCount: number;
  averageRating: number;
}

export function useStats() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading, error } = useQuery<UserStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
  });

  const refreshStats = () => {
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  return {
    stats,
    isLoading,
    error,
    refreshStats,
  };
}
