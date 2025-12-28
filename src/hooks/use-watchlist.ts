/**
 * useWatchlist Hook
 * React Query mutations and queries for watchlist operations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface WatchlistItem {
  id: string;
  tmdbId: number;
  contentType: 'MOVIE' | 'SERIES' | 'ANIME';
  title: string;
  posterPath?: string;
  rating?: number;
  releaseDate?: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  notes?: string;
  createdAt: string;
}

interface AddToWatchlistParams {
  tmdbId: number;
  contentType: 'MOVIE' | 'SERIES' | 'ANIME';
  title: string;
  posterPath?: string;
  rating?: number;
  releaseDate?: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  notes?: string;
}

interface WatchlistListResponse {
  items: WatchlistItem[];
  total: number;
  hasMore: boolean;
}

interface WatchlistStatsResponse {
  total: number;
  byType: {
    MOVIE: number;
    SERIES: number;
    ANIME: number;
  };
}

export function useWatchlist() {
  const queryClient = useQueryClient();

  // Add to watchlist mutation
  const { mutate: addToWatchlist, isPending: isAdding } = useMutation({
    mutationFn: async (params: AddToWatchlistParams) => {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to add to watchlist');
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlistStats'] });
      toast.success(`"${variables.title}" saved to watchlist! 🔖`);
    },
    onError: () => {
      toast.error('Failed to save to watchlist');
    },
  });

  // Remove from watchlist mutation
  const { mutate: removeFromWatchlist, isPending: isRemoving } = useMutation({
    mutationFn: async (params: { tmdbId: number; contentType: string; title: string }) => {
      const response = await fetch(
        `/api/watchlist?tmdbId=${params.tmdbId}&contentType=${params.contentType}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlistStats'] });
      toast.success(`"${variables.title}" removed from watchlist`);
    },
    onError: () => {
      toast.error('Failed to remove from watchlist');
    },
  });

  // Toggle watchlist (add if not exists, remove if exists)
  const toggleWatchlist = (
    params: AddToWatchlistParams,
    isInWatchlist: boolean
  ) => {
    if (isInWatchlist) {
      removeFromWatchlist({
        tmdbId: params.tmdbId,
        contentType: params.contentType,
        title: params.title,
      });
    } else {
      addToWatchlist(params);
    }
  };

  return {
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isAdding,
    isRemoving,
    isPending: isAdding || isRemoving,
  };
}

/**
 * Hook to get watchlist data
 */
export function useWatchlistQuery(options?: {
  contentType?: 'MOVIE' | 'SERIES' | 'ANIME';
  limit?: number;
  skip?: number;
}) {
  return useQuery<WatchlistListResponse>({
    queryKey: ['watchlist', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.contentType) params.set('contentType', options.contentType);
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.skip) params.set('skip', options.skip.toString());

      const response = await fetch(`/api/watchlist?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch watchlist');
      return response.json();
    },
  });
}

/**
 * Hook to get watchlist stats
 */
export function useWatchlistStats() {
  return useQuery<WatchlistStatsResponse>({
    queryKey: ['watchlistStats'],
    queryFn: async () => {
      const response = await fetch('/api/watchlist?stats=true');
      if (!response.ok) throw new Error('Failed to fetch watchlist stats');
      return response.json();
    },
  });
}

/**
 * Hook to check if an item is in watchlist
 * Uses the cached watchlist data to avoid extra API calls
 */
export function useIsInWatchlist(tmdbId: number, contentType: string) {
  const { data } = useWatchlistQuery({ limit: 100 });
  
  return data?.items.some(
    item => item.tmdbId === tmdbId && item.contentType === contentType
  ) ?? false;
}

/**
 * Hook to get a random item from watchlist
 */
export function useRandomWatchlistItem() {
  const queryClient = useQueryClient();
  
  const { mutateAsync: getRandomItem, isPending } = useMutation({
    mutationFn: async (contentType?: string) => {
      const params = new URLSearchParams({ random: 'true' });
      if (contentType) params.set('contentType', contentType);

      const response = await fetch(`/api/watchlist?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to get random item');
      return response.json();
    },
  });

  return { getRandomItem, isPending };
}
