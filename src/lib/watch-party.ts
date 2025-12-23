/**
 * Watch Party Configuration
 * Defines watch party capabilities for streaming services
 * Design-only: Prepared for future integration with Teleparty/SyncPlay
 */

'use client';

/**
 * Watch party capability for a streaming service
 */
export interface WatchPartyCapability {
  serviceId: string;
  supportsWatchParty: boolean;
  partyType?: 'native' | 'external';
  externalPartyService?: string; // e.g., "teleparty", "syncplay"
  generatePartyUrl?: (contentUrl: string) => string;
}

/**
 * Watch party configuration per service
 * Currently, most free streaming services don't have native watch party support
 */
export const WATCH_PARTY_CONFIG: WatchPartyCapability[] = [
  {
    serviceId: 'syncplay',
    supportsWatchParty: true,
    partyType: 'native',
    // SyncPlay has built-in sync features
  },
  {
    serviceId: 'moviebox',
    supportsWatchParty: false,
  },
  {
    serviceId: 'cineb',
    supportsWatchParty: false,
  },
  {
    serviceId: 'hianime',
    supportsWatchParty: false,
  },
];

/**
 * Check if a service supports watch party
 */
export function supportsWatchParty(serviceId: string): boolean {
  const config = WATCH_PARTY_CONFIG.find(c => c.serviceId === serviceId);
  return config?.supportsWatchParty ?? false;
}

/**
 * Get watch party configuration for a service
 */
export function getWatchPartyConfig(serviceId: string): WatchPartyCapability | null {
  return WATCH_PARTY_CONFIG.find(c => c.serviceId === serviceId) ?? null;
}

/**
 * Get all services that support watch party
 */
export function getWatchPartyServices(): WatchPartyCapability[] {
  return WATCH_PARTY_CONFIG.filter(c => c.supportsWatchParty);
}
