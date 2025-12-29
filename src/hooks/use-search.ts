/**
 * useSearch Hook
 * React Query hook for search with debounce and suggestions
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface SearchResultItem {
  tmdbId: number;
  title: string;
  type: 'movie' | 'tv' | 'person';
  contentType: ContentType | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  releaseDate: string | null;
  overview: string | null;
  genreIds: number[];
  popularity: number;
  profileUrl?: string | null;
  knownFor?: string[];
}

interface SearchResponse {
  results: SearchResultItem[];
  query: string;
  page: number;
  totalPages: number;
  totalResults: number;
}

interface UseSearchOptions {
  page?: number;
  types?: ('movie' | 'tv' | 'person')[];
  minRating?: number;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Search hook with debounce
 */
export function useSearch(query: string, options: UseSearchOptions = {}) {
  const {
    page = 1,
    types,
    minRating = 0,
    enabled = true,
    debounceMs = 300,
  } = options;

  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery<SearchResponse>({
    queryKey: ['search', debouncedQuery, page, types, minRating],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        return {
          results: [],
          query: '',
          page: 1,
          totalPages: 0,
          totalResults: 0,
        };
      }

      const params = new URLSearchParams({
        q: debouncedQuery,
        page: page.toString(),
        minRating: minRating.toString(),
      });

      if (types && types.length > 0) {
        params.set('types', types.join(','));
      }

      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return response.json();
    },
    enabled: enabled && debouncedQuery.trim().length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Search suggestions hook (first 5 results, faster debounce)
 */
export function useSearchSuggestions(query: string, enabled = true) {
  const debouncedQuery = useDebounce(query, 200);

  return useQuery<SearchResultItem[]>({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        return [];
      }

      const params = new URLSearchParams({
        q: debouncedQuery,
        page: '1',
        types: 'movie,tv',
      });

      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        return [];
      }

      const data: SearchResponse = await response.json();
      return data.results.slice(0, 5);
    },
    enabled: enabled && debouncedQuery.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}
