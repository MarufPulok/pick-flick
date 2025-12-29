/**
 * useHistoryPage Hook
 * Extended history hook with filtering and pagination for the history page
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useQuery } from '@tanstack/react-query';

export type HistoryAction = 'WATCHED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED';

export interface HistoryItem {
  id: string;
  tmdbId: number;
  contentType: ContentType;
  action: HistoryAction;
  title: string;
  posterPath?: string;
  rating?: number;
  releaseDate?: string;
  source?: 'FILTERED' | 'SMART';
  createdAt: string;
}

interface HistoryPageResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface HistoryFilters {
  contentType?: ContentType | 'ALL';
  action?: HistoryAction | 'ALL';
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

interface UseHistoryPageOptions {
  page?: number;
  limit?: number;
  filters?: HistoryFilters;
}

export function useHistoryPage(options: UseHistoryPageOptions = {}) {
  const { page = 1, limit = 10, filters = {} } = options;

  const queryKey = ['history-page', page, limit, filters];

  const { data, isLoading, error, refetch, isFetching } = useQuery<HistoryPageResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.contentType && filters.contentType !== 'ALL') {
        params.set('contentType', filters.contentType);
      }
      if (filters.action && filters.action !== 'ALL') {
        params.set('action', filters.action);
      }
      if (filters.dateRange && filters.dateRange !== 'all') {
        params.set('dateRange', filters.dateRange);
      }

      const response = await fetch(`/api/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    items: data?.items || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
