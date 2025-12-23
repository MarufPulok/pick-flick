/**
 * Watching State Tracker
 * Manages "I'm watching this now" state with localStorage persistence
 * Designed for future social features ("Friends are watching")
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { storage } from './storage';

const STORAGE_KEY = 'watching-state';

/**
 * Current watching state
 */
export interface WatchingState {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterUrl?: string;
  startedAt: number;
  serviceUsed?: string;
  // Future social-ready fields
  isShareable?: boolean;
  visibility?: 'private' | 'friends' | 'public';
}

/**
 * Watching state tracker interface
 */
export interface WatchingStateTracker {
  markAsWatching(state: Omit<WatchingState, 'startedAt'>): void;
  getCurrentlyWatching(): WatchingState | null;
  clearWatching(): void;
  isWatching(tmdbId: number): boolean;
  getWatchDuration(): number | null;
}

/**
 * Get current watching state from storage
 */
export function getCurrentlyWatching(): WatchingState | null {
  return storage.get<WatchingState>(STORAGE_KEY);
}

/**
 * Mark content as currently watching
 */
export function markAsWatching(
  state: Omit<WatchingState, 'startedAt'>
): WatchingState {
  const watchingState: WatchingState = {
    ...state,
    startedAt: Date.now(),
    isShareable: state.isShareable ?? false,
    visibility: state.visibility ?? 'private',
  };
  
  storage.set(STORAGE_KEY, watchingState);
  return watchingState;
}

/**
 * Clear current watching state
 */
export function clearWatching(): void {
  storage.remove(STORAGE_KEY);
}

/**
 * Check if a specific content is being watched
 */
export function isWatching(tmdbId: number): boolean {
  const current = getCurrentlyWatching();
  return current?.tmdbId === tmdbId;
}

/**
 * Get how long the user has been watching (in minutes)
 */
export function getWatchDuration(): number | null {
  const current = getCurrentlyWatching();
  if (!current) return null;
  
  const durationMs = Date.now() - current.startedAt;
  return Math.floor(durationMs / (1000 * 60));
}

/**
 * Check if there's an active watching session that might need follow-up
 * Returns true if watching for more than 30 minutes
 */
export function hasActiveSession(): boolean {
  const duration = getWatchDuration();
  return duration !== null && duration >= 30;
}

/**
 * Create a watching state tracker instance
 */
export function createWatchingStateTracker(): WatchingStateTracker {
  return {
    markAsWatching,
    getCurrentlyWatching,
    clearWatching,
    isWatching,
    getWatchDuration,
  };
}

// Export default tracker instance
export const watchingStateTracker = createWatchingStateTracker();
