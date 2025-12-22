/**
 * Free Streaming Configuration
 * Environment-driven configuration for all free streaming platforms
 */

/**
 * Free streaming configuration interface
 */
export interface FreeStreamingConfig {
  // Global feature toggle
  ENABLE_FREE_STREAMING: boolean;
  
  // Individual service toggles (only working sites)
  ENABLE_MOVIEBOX: boolean;
  ENABLE_CINEB: boolean;
  ENABLE_SYNCPLAY: boolean;
  ENABLE_HIANIME: boolean;
  
  // Display preferences
  MAX_FREE_SERVICES_DISPLAYED: number;
  SHOW_SERVICE_DESCRIPTIONS: boolean;
  
  // Custom service URLs
  MOVIEBOX_BASE_URL: string;
  CINEB_BASE_URL: string;
  SYNCPLAY_BASE_URL: string;
  HIANIME_BASE_URL: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: FreeStreamingConfig = {
  // Global feature toggle
  ENABLE_FREE_STREAMING: true,
  
  // Individual service toggles (only working sites)
  ENABLE_MOVIEBOX: true,
  ENABLE_CINEB: true,
  ENABLE_SYNCPLAY: true,
  ENABLE_HIANIME: true,
  
  // Display preferences
  MAX_FREE_SERVICES_DISPLAYED: 4,
  SHOW_SERVICE_DESCRIPTIONS: true,
  
  // Default service URLs (only working sites)
  MOVIEBOX_BASE_URL: 'https://moviebox.ph',
  CINEB_BASE_URL: 'https://cineb.gg',
  SYNCPLAY_BASE_URL: 'https://syncplay.vercel.app',
  HIANIME_BASE_URL: 'https://hianime.to',
};

/**
 * Parse boolean environment variable with fallback
 */
function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse number environment variable with fallback
 */
function parseNumberEnv(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse string environment variable with fallback
 */
function parseStringEnv(value: string | undefined, defaultValue: string): string {
  return value || defaultValue;
}

/**
 * Load configuration from environment variables
 */
export const freeStreamingConfig: FreeStreamingConfig = {
  // Global feature toggle
  ENABLE_FREE_STREAMING: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_FREE_STREAMING,
    DEFAULT_CONFIG.ENABLE_FREE_STREAMING
  ),
  
  // Individual service toggles (only working sites)
  ENABLE_MOVIEBOX: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_MOVIEBOX,
    DEFAULT_CONFIG.ENABLE_MOVIEBOX
  ),
  ENABLE_CINEB: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_CINEB,
    DEFAULT_CONFIG.ENABLE_CINEB
  ),
  ENABLE_SYNCPLAY: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_SYNCPLAY,
    DEFAULT_CONFIG.ENABLE_SYNCPLAY
  ),
  ENABLE_HIANIME: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_HIANIME,
    DEFAULT_CONFIG.ENABLE_HIANIME
  ),
  
  // Display preferences
  MAX_FREE_SERVICES_DISPLAYED: parseNumberEnv(
    process.env.NEXT_PUBLIC_MAX_FREE_SERVICES,
    DEFAULT_CONFIG.MAX_FREE_SERVICES_DISPLAYED
  ),
  SHOW_SERVICE_DESCRIPTIONS: parseBooleanEnv(
    process.env.NEXT_PUBLIC_SHOW_SERVICE_DESCRIPTIONS,
    DEFAULT_CONFIG.SHOW_SERVICE_DESCRIPTIONS
  ),
  
  // Custom service URLs (only working sites)
  MOVIEBOX_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_MOVIEBOX_BASE_URL,
    DEFAULT_CONFIG.MOVIEBOX_BASE_URL
  ),
  CINEB_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_CINEB_BASE_URL,
    DEFAULT_CONFIG.CINEB_BASE_URL
  ),
  SYNCPLAY_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_SYNCPLAY_BASE_URL,
    DEFAULT_CONFIG.SYNCPLAY_BASE_URL
  ),
  HIANIME_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_HIANIME_BASE_URL,
    DEFAULT_CONFIG.HIANIME_BASE_URL
  ),
};

/**
 * Check if a specific service is enabled
 */
export function isServiceEnabled(serviceId: string): boolean {
  if (!freeStreamingConfig.ENABLE_FREE_STREAMING) {
    return false;
  }

  const serviceKey = `ENABLE_${serviceId.toUpperCase().replace('-', '_')}` as keyof FreeStreamingConfig;
  return freeStreamingConfig[serviceKey] as boolean ?? true;
}

/**
 * Get custom URL for a service
 */
export function getServiceUrl(serviceId: string): string | undefined {
  const urlKey = `${serviceId.toUpperCase().replace('-', '_')}_BASE_URL` as keyof FreeStreamingConfig;
  return freeStreamingConfig[urlKey] as string;
}