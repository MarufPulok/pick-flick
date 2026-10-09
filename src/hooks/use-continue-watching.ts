/**
 * useContinueWatching Hook
 * React Query hook for continue watching functionality
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ContinueWatchingItem {
  id: string;
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  lastWatchedAt: string;
  watchCount: number;
}

interface ContinueWatchingResponse {
  items: ContinueWatchingItem[];
  total: number;
}

/**
 * Hook to fetch continue watching list
 */
export function useContinueWatching() {
  const { data, isLoading, error, refetch } = useQuery<ContinueWatchingResponse>({
    queryKey: ['continue-watching'],
    queryFn: async () => {
      const response = await fetch('/api/continue-watching');
      if (!response.ok) {
        throw new Error('Failed to fetch continue watching');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    items: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to record a viewing session
 */
export function useRecordViewing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tmdbId: number;
      contentType: ContentType;
      title: string;
      posterPath?: string | null;
    }) => {
      const response = await fetch('/api/continue-watching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to record viewing');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}

/**
 * Hook to remove from continue watching
 */
export function useRemoveFromContinue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tmdbId: number;
      contentType: ContentType;
    }) => {
      const response = await fetch('/api/continue-watching', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from continue watching');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}
