/**
 * Service Feedback Tracker
 * Allows users to report broken links or issues with streaming services
 * Stores feedback locally with future backend integration in mind
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { storage } from './storage';

const STORAGE_KEY = 'service-feedback';
const MAX_FEEDBACK_ENTRIES = 100;

/**
 * Types of feedback users can report
 */
export type FeedbackType = 'NOT_WORKING' | 'SLOW' | 'BROKEN_LINK' | 'WRONG_CONTENT';

/**
 * Service feedback record
 */
export interface ServiceFeedback {
  id: string;
  serviceId: string;
  contentType: ContentType;
  titleId?: number; // TMDB ID
  titleName?: string;
  feedbackType: FeedbackType;
  timestamp: number;
  userRegion?: string; // From browser if available
}

/**
 * Aggregated feedback stats for a service
 */
export interface ServiceFeedbackStats {
  serviceId: string;
  totalReports: number;
  recentReports: number; // Last 24 hours
  feedbackTypes: Record<FeedbackType, number>;
}

/**
 * Get stored feedback entries
 */
function getStoredFeedback(): ServiceFeedback[] {
  return storage.get<ServiceFeedback[]>(STORAGE_KEY) || [];
}

/**
 * Store feedback entries
 */
function storeFeedback(entries: ServiceFeedback[]): void {
  storage.set(STORAGE_KEY, entries);
}

/**
 * Generate unique feedback ID
 */
function generateFeedbackId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get user's approximate region (if available)
 */
function getUserRegion(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  
  // Try to get from browser's language/locale
  const locale = navigator.language || (navigator as { userLanguage?: string }).userLanguage;
  if (locale) {
    const parts = locale.split('-');
    return parts[1] || parts[0]; // e.g., "en-US" -> "US", "en" -> "en"
  }
  
  return undefined;
}

/**
 * Report an issue with a streaming service
 */
export function reportServiceIssue(
  feedback: Omit<ServiceFeedback, 'id' | 'timestamp' | 'userRegion'>
): ServiceFeedback {
  const entries = getStoredFeedback();
  
  const newFeedback: ServiceFeedback = {
    ...feedback,
    id: generateFeedbackId(),
    timestamp: Date.now(),
    userRegion: getUserRegion(),
  };
  
  // Add to beginning (most recent first)
  entries.unshift(newFeedback);
  
  // Keep only last N entries
  const trimmed = entries.slice(0, MAX_FEEDBACK_ENTRIES);
  storeFeedback(trimmed);
  
  return newFeedback;
}

/**
 * Get feedback count for a specific service
 */
export function getServiceFeedbackCount(serviceId: string): number {
  const entries = getStoredFeedback();
  return entries.filter(e => e.serviceId === serviceId).length;
}

/**
 * Get recent feedback count (last 24 hours) for a service
 */
export function getRecentFeedbackCount(serviceId: string): number {
  const entries = getStoredFeedback();
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  return entries.filter(
    e => e.serviceId === serviceId && e.timestamp > oneDayAgo
  ).length;
}

/**
 * Check if user has already reported this service for this title recently
 */
export function hasReportedRecently(
  serviceId: string,
  titleId?: number,
  withinHours = 24
): boolean {
  const entries = getStoredFeedback();
  const threshold = Date.now() - (withinHours * 60 * 60 * 1000);
  
  return entries.some(
    e => e.serviceId === serviceId && 
         e.timestamp > threshold &&
         (titleId === undefined || e.titleId === titleId)
  );
}

/**
 * Get aggregated stats for a service
 */
export function getServiceFeedbackStats(serviceId: string): ServiceFeedbackStats {
  const entries = getStoredFeedback();
  const serviceEntries = entries.filter(e => e.serviceId === serviceId);
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  const stats: ServiceFeedbackStats = {
    serviceId,
    totalReports: serviceEntries.length,
    recentReports: serviceEntries.filter(e => e.timestamp > oneDayAgo).length,
    feedbackTypes: {
      NOT_WORKING: 0,
      SLOW: 0,
      BROKEN_LINK: 0,
      WRONG_CONTENT: 0,
    },
  };
  
  serviceEntries.forEach(entry => {
    stats.feedbackTypes[entry.feedbackType]++;
  });
  
  return stats;
}

/**
 * Get all feedback entries (for debugging/export)
 */
export function getAllFeedback(): ServiceFeedback[] {
  return getStoredFeedback();
}

/**
 * Clear all feedback (for testing)
 */
export function clearAllFeedback(): void {
  storage.remove(STORAGE_KEY);
}
