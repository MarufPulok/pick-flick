/**
 * useFeed / useMoodChips
 * React Query hooks for the taste-ranked rail and the mood chip row
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import type { MoodChip } from '@/lib/mood-chips';
import { useQuery } from '@tanstack/react-query';

export interface FeedItem {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  posterUrl: string | null;
  rating: number;
  releaseDate: string;
  why: string;
}

export function useFeed() {
  return useQuery<{ items: FeedItem[]; profileComplete: boolean }>({
    queryKey: ['feed'],
    queryFn: async () => {
      const response = await fetch('/api/feed');
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useMoodChips() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  return useQuery<{ chips: MoodChip[] }>({
    queryKey: ['mood-chips', hour, day],
    queryFn: async () => {
      const response = await fetch(`/api/mood-chips?hour=${hour}&day=${day}`);
      if (!response.ok) throw new Error('Failed to fetch mood chips');
      return response.json();
    },
    staleTime: 30 * 60 * 1000,
  });
}
