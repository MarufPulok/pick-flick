/**
 * useHistoryActions Hook
 * React Query mutations for history actions with toast notifications
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RecordActionParams {
  tmdbId: number;
  contentType: 'MOVIE' | 'SERIES' | 'ANIME';
  action: 'WATCHED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED';
  title: string;
  posterPath?: string;
  rating?: number;
  releaseDate?: string;
  source?: 'FILTERED' | 'SMART';
}

export function useHistoryActions() {
  const queryClient = useQueryClient();

  const { mutate: recordAction, isPending } = useMutation({
    mutationFn: async (params: RecordActionParams) => {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to record action');
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      // Invalidate stats to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      // Show toast based on action
      const actionMessages = {
        WATCHED: '✅ Added to watch history',
        LIKED: '👍 Liked!',
        DISLIKED: '👎 Disliked',
        BLACKLISTED: '🚫 Blacklisted - generating new recommendation',
      };

      toast.success(actionMessages[variables.action]);
    },
    onError: (error) => {
      toast.error('Failed to record action');
      console.error('Record action error:', error);
    },
  });

  return {
    recordAction,
    isRecording: isPending,
  };
}
