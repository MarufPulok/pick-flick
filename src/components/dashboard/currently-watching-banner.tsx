/**
 * Currently Watching Banner
 * Sticky banner that shows when user has an active watching session
 * Persists across page refreshes via localStorage
 */

'use client';

import { useHistoryActions } from '@/hooks/use-history-actions';
import { clearWatching, getCurrentlyWatching, isStreamOpen, onWatchingStateChange, WatchingState } from '@/lib/watching-state';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

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
    toast.success(`"${watchingState.title}" marked as watched.`);
  }, [watchingState, isRecording, recordAction]);

  const handleResume = useCallback(() => {
    if (!watchingState) return;
    const q = new URLSearchParams({ id: String(watchingState.tmdbId), type: watchingState.contentType, title: watchingState.title });
    router.push(`/watch?${q}`);
  }, [watchingState, router]);

  // Don't render if no active session or if stream player is open
  if (!watchingState || streamActive) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-330 items-center gap-3 px-4 py-3 sm:px-6 lg:px-15">
        {watchingState.posterUrl && (
          <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-sm border border-border bg-surface">
            <Image src={watchingState.posterUrl} alt="" fill sizes="32px" className="object-cover" unoptimized />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{watchingState.title}</p>
          <p className="tabular hidden font-mono text-sm text-muted-foreground sm:block">Started {formatDuration(duration)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button variant="play" size="sm" onClick={handleResume}>
            Resume
          </Button>
          <Button variant="quiet" size="sm" onClick={handleMarkWatched} disabled={isRecording}>
            Done watching
          </Button>
        </div>
      </div>
    </div>
  );
}
