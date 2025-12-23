/**
 * Service Usage Tracking
 * Tracks which streaming services users click on to enable preferred/recent features
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { storage } from './storage';

const STORAGE_KEY = 'service-usage';
const MAX_EVENTS = 50;

/**
 * Service usage event record
 */
export interface ServiceUsageEvent {
  serviceId: string;
  contentType: ContentType;
  timestamp: number;
  titleId?: number; // TMDB ID for traceability
}

/**
 * Aggregated service usage entry
 */
export interface ServiceUsageEntry {
  serviceId: string;
  usageCount: number;
  lastUsed: number;
  contentTypes: ContentType[];
}

/**
 * Service usage tracker interface
 */
export interface ServiceUsageTracker {
  trackUsage(event: Omit<ServiceUsageEvent, 'timestamp'>): void;
  getPreferredServices(contentType?: ContentType, limit?: number): string[];
  getRecentServices(limit?: number): ServiceUsageEntry[];
  getUsageCount(serviceId: string): number;
  isRecentlyUsed(serviceId: string, withinHours?: number): boolean;
  clearHistory(): void;
}

/**
 * Get stored usage events
 */
function getStoredEvents(): ServiceUsageEvent[] {
  return storage.get<ServiceUsageEvent[]>(STORAGE_KEY) || [];
}

/**
 * Store usage events
 */
function storeEvents(events: ServiceUsageEvent[]): void {
  storage.set(STORAGE_KEY, events);
}

/**
 * Track a service usage event
 */
export function trackUsage(event: Omit<ServiceUsageEvent, 'timestamp'>): void {
  const events = getStoredEvents();
  
  const newEvent: ServiceUsageEvent = {
    ...event,
    timestamp: Date.now(),
  };
  
  // Add to beginning (most recent first)
  events.unshift(newEvent);
  
  // Keep only last N events
  const trimmedEvents = events.slice(0, MAX_EVENTS);
  
  storeEvents(trimmedEvents);
}

/**
 * Get preferred services sorted by usage frequency
 * @param contentType - Optional filter by content type
 * @param limit - Maximum services to return (default: 3)
 */
export function getPreferredServices(
  contentType?: ContentType,
  limit = 3
): string[] {
  const events = getStoredEvents();
  
  // Filter by content type if provided
  const filteredEvents = contentType
    ? events.filter(e => e.contentType === contentType)
    : events;
  
  // Count usage per service
  const usageCount = new Map<string, number>();
  filteredEvents.forEach(event => {
    const count = usageCount.get(event.serviceId) || 0;
    usageCount.set(event.serviceId, count + 1);
  });
  
  // Sort by count descending and return top N
  return Array.from(usageCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([serviceId]) => serviceId);
}

/**
 * Get recently used services with aggregated data
 * @param limit - Maximum entries to return (default: 3)
 */
export function getRecentServices(limit = 3): ServiceUsageEntry[] {
  const events = getStoredEvents();
  
  // Aggregate by service
  const serviceMap = new Map<string, ServiceUsageEntry>();
  
  events.forEach(event => {
    const existing = serviceMap.get(event.serviceId);
    
    if (existing) {
      existing.usageCount++;
      existing.lastUsed = Math.max(existing.lastUsed, event.timestamp);
      if (!existing.contentTypes.includes(event.contentType)) {
        existing.contentTypes.push(event.contentType);
      }
    } else {
      serviceMap.set(event.serviceId, {
        serviceId: event.serviceId,
        usageCount: 1,
        lastUsed: event.timestamp,
        contentTypes: [event.contentType],
      });
    }
  });
  
  // Sort by last used (most recent first) and return top N
  return Array.from(serviceMap.values())
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, limit);
}

/**
 * Get total usage count for a specific service
 */
export function getUsageCount(serviceId: string): number {
  const events = getStoredEvents();
  return events.filter(e => e.serviceId === serviceId).length;
}

/**
 * Check if a service was used recently
 * @param serviceId - Service to check
 * @param withinHours - Time window in hours (default: 24)
 */
export function isRecentlyUsed(serviceId: string, withinHours = 24): boolean {
  const events = getStoredEvents();
  const threshold = Date.now() - (withinHours * 60 * 60 * 1000);
  
  return events.some(
    e => e.serviceId === serviceId && e.timestamp > threshold
  );
}

/**
 * Clear all usage history
 */
export function clearUsageHistory(): void {
  storage.remove(STORAGE_KEY);
}

/**
 * Create a service usage tracker instance
 */
export function createServiceUsageTracker(): ServiceUsageTracker {
  return {
    trackUsage,
    getPreferredServices,
    getRecentServices,
    getUsageCount,
    isRecentlyUsed,
    clearHistory: clearUsageHistory,
  };
}

// Export default tracker instance
export const serviceUsageTracker = createServiceUsageTracker();
