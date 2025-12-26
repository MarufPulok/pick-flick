/**
 * Currently Watching Banner
 * Sticky banner that shows when user has an active watching session
 * Persists across page refreshes via localStorage
 */

'use client';

import { useHistoryActions } from '@/hooks/use-history-actions';
import { clearWatching, getCurrentlyWatching, isStreamOpen, onWatchingStateChange, WatchingState } from '@/lib/watching-state';
import { Check, Clock, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Format minutes into human readable duration
 */
function formatDuration(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

export function CurrentlyWatchingBanner() {
  const [watchingState, setWatchingState] = useState<WatchingState | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [streamActive, setStreamActive] = useState(false);
  const { recordAction, isRecording } = useHistoryActions();

  // Sync state from storage
  const syncState = useCallback(() => {
    const current = getCurrentlyWatching();
    setWatchingState(current);
    setStreamActive(isStreamOpen());
    if (current) {
      const mins = Math.floor((Date.now() - current.startedAt) / (1000 * 60));
      setDuration(mins);
    }
  }, []);

  // Check for active watching session on mount and subscribe to changes
  useEffect(() => {
    syncState();
    
    // Subscribe to state changes for instant updates
    const unsubscribe = onWatchingStateChange(syncState);
    
    // Update duration every minute
    const interval = setInterval(syncState, 60000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [syncState]);

  // Handle "Mark as Watched"
  const handleMarkWatched = useCallback(() => {
    if (!watchingState || isRecording) return;

    recordAction({
      tmdbId: watchingState.tmdbId,
      contentType: watchingState.contentType,
      action: 'WATCHED',
      title: watchingState.title,
      posterPath: watchingState.posterUrl,
    });

    clearWatching();
    setWatchingState(null);
    toast.success(`"${watchingState.title}" marked as watched!`);
  }, [watchingState, isRecording, recordAction]);

  // Handle "Cancel" - just clear without recording
  const handleCancel = useCallback(() => {
    if (!watchingState) return;
    clearWatching();
    setWatchingState(null);
  }, [watchingState]);

  // Don't render if no active session or if stream player is open
  if (!watchingState || streamActive) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-violet-950/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border border-violet-500/30 shadow-2xl shadow-violet-500/20 p-4">
          <div className="flex items-center gap-4">
            {/* Poster Thumbnail */}
            {watchingState.posterUrl && (
              <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-violet-400/30">
                <Image
                  src={watchingState.posterUrl}
                  alt={watchingState.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-violet-300 font-medium mb-0.5">
                🎬 Currently Watching
              </p>
              <p className="text-white font-semibold truncate">
                {watchingState.title}
              </p>
              <p className="text-xs text-violet-300/70 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Started {formatDuration(duration)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg text-violet-300 hover:bg-violet-800/50 transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleMarkWatched}
                disabled={isRecording}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Done Watching</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
