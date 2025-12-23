/**
 * Region Availability Model (Design Only)
 * 
 * This file defines the data structures and interfaces for tracking
 * streaming service availability by region. This is a design artifact
 * for future implementation when region-specific data becomes available.
 * 
 * ## Future Integration Points:
 * - TMDB Watch Providers API (already provides some region data)
 * - User's detected region via IP geolocation or browser settings
 * - Manual region selection in user preferences
 * 
 * ## Data Sources to Consider:
 * - JustWatch API (unofficial)
 * - Reelgood API
 * - TMDB's watch/providers endpoint
 */

'use client';

import { ContentType } from '@/dtos/common.dto';

/**
 * ISO 3166-1 alpha-2 country codes for common regions
 */
export type RegionCode = 
  | 'US' | 'GB' | 'CA' | 'AU' // English-speaking
  | 'DE' | 'FR' | 'ES' | 'IT' // Western Europe
  | 'JP' | 'KR' | 'IN' | 'BD' // Asia
  | 'BR' | 'MX' | 'AR'         // Latin America
  | string;                     // Allow any region code

/**
 * Service availability status for a region
 */
export type AvailabilityStatus = 
  | 'available'      // Definitely available
  | 'unavailable'    // Definitely not available
  | 'unknown'        // No data
  | 'geo-blocked'    // Available but blocked for user's location
  | 'subscription'   // Requires paid subscription
  | 'rent'           // Available to rent
  | 'buy'            // Available to purchase
  | 'free'           // Free with ads or no cost
  | 'premium';       // Requires premium tier

/**
 * Availability data for a specific service in a region
 */
export interface RegionAvailability {
  serviceId: string;
  regionCode: RegionCode;
  status: AvailabilityStatus;
  /** Direct link to content on the service */
  link?: string;
  /** Pricing information if applicable */
  price?: {
    amount: number;
    currency: string;
    type: 'subscription' | 'rent' | 'buy';
  };
  /** When this data was last updated */
  lastUpdated?: number;
  /** Data confidence level (0-1) */
  confidence?: number;
}

/**
 * Content availability across all regions/services
 */
export interface ContentAvailability {
  tmdbId: number;
  contentType: ContentType;
  /** Map of regionCode -> serviceId -> availability */
  regions: Record<RegionCode, Record<string, RegionAvailability>>;
  /** User's detected or selected region */
  userRegion?: RegionCode;
}

/**
 * User's region preferences
 */
export interface RegionPreferences {
  /** Auto-detected region */
  detectedRegion?: RegionCode;
  /** User-selected region (overrides detected) */
  selectedRegion?: RegionCode;
  /** Show content from other regions */
  showOtherRegions?: boolean;
  /** Preferred regions to check (in order) */
  preferredRegions?: RegionCode[];
}

// =============================================================================
// FUTURE IMPLEMENTATION NOTES
// =============================================================================

/**
 * Future: Detect user's region
 * 
 * Options:
 * 1. Use browser's Intl.DateTimeFormat().resolvedOptions().timeZone
 * 2. Use navigator.language to infer region
 * 3. Call a geolocation API (ipinfo.io, ipapi.co, etc.)
 * 4. Ask user to select during onboarding
 * 
 * Example:
 * ```typescript
 * async function detectUserRegion(): Promise<RegionCode> {
 *   // Try browser locale first
 *   const locale = navigator.language;
 *   if (locale.includes('-')) {
 *     return locale.split('-')[1].toUpperCase() as RegionCode;
 *   }
 *   
 *   // Fallback to IP geolocation
 *   const response = await fetch('https://ipapi.co/json/');
 *   const data = await response.json();
 *   return data.country_code;
 * }
 * ```
 */

/**
 * Future: Fetch availability data
 * 
 * Integration with TMDB's watch/providers endpoint:
 * ```typescript
 * async function fetchAvailability(
 *   tmdbId: number,
 *   contentType: ContentType,
 *   region: RegionCode
 * ): Promise<RegionAvailability[]> {
 *   const type = contentType === 'MOVIE' ? 'movie' : 'tv';
 *   const url = `https://api.themoviedb.org/3/${type}/${tmdbId}/watch/providers`;
 *   
 *   const response = await fetch(url, {
 *     headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
 *   });
 *   const data = await response.json();
 *   
 *   return parseWatchProviders(data.results[region]);
 * }
 * ```
 */

/**
 * Future: UI Integration
 * 
 * Show availability indicators on streaming service cards:
 * - 🟢 Available in your region
 * - 🟡 Available in other regions
 * - 🔴 Not available anywhere
 * - 💰 Paid option only
 * 
 * Allow users to:
 * - Filter services by availability
 * - See which regions have the content
 * - Get notified when content becomes available
 */

export { }; // Make this a module

