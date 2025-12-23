/**
 * Service Status Checker
 * Pre-fetches service availability status (design-only, opt-in feature)
 * Uses no-cors fetch to ping services without blocking UI
 */

'use client';

import { storage } from './storage';

const STORAGE_KEY = 'service-status-cache';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const TIMEOUT_MS = 3000; // 3 second timeout

/**
 * Service status types
 */
export type ServiceStatusType = 'online' | 'slow' | 'offline' | 'unknown';

/**
 * Cached service status
 */
export interface ServiceStatus {
  serviceId: string;
  status: ServiceStatusType;
  lastChecked: number;
  responseTime?: number; // in ms
}

/**
 * Status cache structure
 */
interface StatusCache {
  [serviceId: string]: ServiceStatus;
}

/**
 * Get cached status for all services
 */
function getStatusCache(): StatusCache {
  return storage.get<StatusCache>(STORAGE_KEY) || {};
}

/**
 * Update status cache
 */
function updateStatusCache(serviceId: string, status: ServiceStatus): void {
  const cache = getStatusCache();
  cache[serviceId] = status;
  storage.set(STORAGE_KEY, cache);
}

/**
 * Check if cached status is still valid
 */
function isCacheValid(status: ServiceStatus | undefined): boolean {
  if (!status) return false;
  return Date.now() - status.lastChecked < CACHE_DURATION_MS;
}

/**
 * Get cached service status (returns undefined if not cached or expired)
 */
export function getCachedStatus(serviceId: string): ServiceStatus | undefined {
  const cache = getStatusCache();
  const status = cache[serviceId];
  
  if (isCacheValid(status)) {
    return status;
  }
  
  return undefined;
}

/**
 * Check service status by pinging the base URL
 * Uses no-cors mode to avoid CORS issues
 * NOTE: This is a best-effort check - many services will return 'unknown'
 */
export async function checkServiceStatus(
  serviceId: string,
  baseUrl: string
): Promise<ServiceStatus> {
  // Check cache first
  const cached = getCachedStatus(serviceId);
  if (cached) return cached;
  
  const startTime = Date.now();
  
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Use no-cors mode - we only care if the request completes
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    // With no-cors, we can't read the response, but if we get here without error,
    // the service is likely online
    const status: ServiceStatus = {
      serviceId,
      status: responseTime > 2000 ? 'slow' : 'online',
      lastChecked: Date.now(),
      responseTime,
    };
    
    updateStatusCache(serviceId, status);
    return status;
    
  } catch (error) {
    // Request failed or timed out
    const status: ServiceStatus = {
      serviceId,
      status: error instanceof DOMException && error.name === 'AbortError' 
        ? 'slow' 
        : 'unknown',
      lastChecked: Date.now(),
    };
    
    updateStatusCache(serviceId, status);
    return status;
  }
}

/**
 * Get status indicator color for UI
 */
export function getStatusColor(status: ServiceStatusType): string {
  switch (status) {
    case 'online': return 'text-green-400';
    case 'slow': return 'text-yellow-400';
    case 'offline': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

/**
 * Get status indicator dot for UI
 */
export function getStatusDot(status: ServiceStatusType): string {
  switch (status) {
    case 'online': return '🟢';
    case 'slow': return '🟡';
    case 'offline': return '🔴';
    default: return '⚪';
  }
}

/**
 * Clear status cache
 */
export function clearStatusCache(): void {
  storage.remove(STORAGE_KEY);
}
