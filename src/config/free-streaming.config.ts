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
  
  // Individual service toggles
  ENABLE_TUBI: boolean;
  ENABLE_CRACKLE: boolean;
  ENABLE_PLUTO: boolean;
  ENABLE_POPCORNFLIX: boolean;
  ENABLE_FILMRISE: boolean;
  ENABLE_YOUTUBE_FREE: boolean;
  ENABLE_INTERNET_ARCHIVE: boolean;
  ENABLE_HIANIME: boolean;
  ENABLE_ZORO: boolean;
  ENABLE_9ANIME: boolean;
  ENABLE_GOGOANIME: boolean;
  
  // Display preferences
  MAX_FREE_SERVICES_DISPLAYED: number;
  SHOW_SERVICE_DESCRIPTIONS: boolean;
  
  // Custom service URLs
  TUBI_BASE_URL: string;
  CRACKLE_BASE_URL: string;
  PLUTO_BASE_URL: string;
  POPCORNFLIX_BASE_URL: string;
  FILMRISE_BASE_URL: string;
  YOUTUBE_FREE_BASE_URL: string;
  INTERNET_ARCHIVE_BASE_URL: string;
  HIANIME_BASE_URL: string;
  ZORO_BASE_URL: string;
  NINEANIME_BASE_URL: string;
  GOGOANIME_BASE_URL: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: FreeStreamingConfig = {
  // Global feature toggle
  ENABLE_FREE_STREAMING: true,
  
  // Individual service toggles (all enabled by default)
  ENABLE_TUBI: true,
  ENABLE_CRACKLE: true,
  ENABLE_PLUTO: true,
  ENABLE_POPCORNFLIX: true,
  ENABLE_FILMRISE: true,
  ENABLE_YOUTUBE_FREE: true,
  ENABLE_INTERNET_ARCHIVE: true,
  ENABLE_HIANIME: true,
  ENABLE_ZORO: true,
  ENABLE_9ANIME: true,
  ENABLE_GOGOANIME: true,
  
  // Display preferences
  MAX_FREE_SERVICES_DISPLAYED: 4,
  SHOW_SERVICE_DESCRIPTIONS: true,
  
  // Default service URLs
  TUBI_BASE_URL: 'https://tubitv.com',
  CRACKLE_BASE_URL: 'https://www.crackle.com',
  PLUTO_BASE_URL: 'https://pluto.tv',
  POPCORNFLIX_BASE_URL: 'https://www.popcornflix.com',
  FILMRISE_BASE_URL: 'https://www.filmrise.com',
  YOUTUBE_FREE_BASE_URL: 'https://www.youtube.com',
  INTERNET_ARCHIVE_BASE_URL: 'https://archive.org',
  HIANIME_BASE_URL: 'https://hianime.to',
  ZORO_BASE_URL: 'https://zoro.to',
  NINEANIME_BASE_URL: 'https://9anime.to',
  GOGOANIME_BASE_URL: 'https://gogoanime.lu',
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
  
  // Individual service toggles
  ENABLE_TUBI: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_TUBI,
    DEFAULT_CONFIG.ENABLE_TUBI
  ),
  ENABLE_CRACKLE: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_CRACKLE,
    DEFAULT_CONFIG.ENABLE_CRACKLE
  ),
  ENABLE_PLUTO: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_PLUTO,
    DEFAULT_CONFIG.ENABLE_PLUTO
  ),
  ENABLE_POPCORNFLIX: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_POPCORNFLIX,
    DEFAULT_CONFIG.ENABLE_POPCORNFLIX
  ),
  ENABLE_FILMRISE: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_FILMRISE,
    DEFAULT_CONFIG.ENABLE_FILMRISE
  ),
  ENABLE_YOUTUBE_FREE: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_YOUTUBE_FREE,
    DEFAULT_CONFIG.ENABLE_YOUTUBE_FREE
  ),
  ENABLE_INTERNET_ARCHIVE: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_INTERNET_ARCHIVE,
    DEFAULT_CONFIG.ENABLE_INTERNET_ARCHIVE
  ),
  ENABLE_HIANIME: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_HIANIME,
    DEFAULT_CONFIG.ENABLE_HIANIME
  ),
  ENABLE_ZORO: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_ZORO,
    DEFAULT_CONFIG.ENABLE_ZORO
  ),
  ENABLE_9ANIME: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_9ANIME,
    DEFAULT_CONFIG.ENABLE_9ANIME
  ),
  ENABLE_GOGOANIME: parseBooleanEnv(
    process.env.NEXT_PUBLIC_ENABLE_GOGOANIME,
    DEFAULT_CONFIG.ENABLE_GOGOANIME
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
  
  // Custom service URLs
  TUBI_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_TUBI_BASE_URL,
    DEFAULT_CONFIG.TUBI_BASE_URL
  ),
  CRACKLE_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_CRACKLE_BASE_URL,
    DEFAULT_CONFIG.CRACKLE_BASE_URL
  ),
  PLUTO_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_PLUTO_BASE_URL,
    DEFAULT_CONFIG.PLUTO_BASE_URL
  ),
  POPCORNFLIX_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_POPCORNFLIX_BASE_URL,
    DEFAULT_CONFIG.POPCORNFLIX_BASE_URL
  ),
  FILMRISE_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_FILMRISE_BASE_URL,
    DEFAULT_CONFIG.FILMRISE_BASE_URL
  ),
  YOUTUBE_FREE_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_YOUTUBE_FREE_BASE_URL,
    DEFAULT_CONFIG.YOUTUBE_FREE_BASE_URL
  ),
  INTERNET_ARCHIVE_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_INTERNET_ARCHIVE_BASE_URL,
    DEFAULT_CONFIG.INTERNET_ARCHIVE_BASE_URL
  ),
  HIANIME_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_HIANIME_BASE_URL,
    DEFAULT_CONFIG.HIANIME_BASE_URL
  ),
  ZORO_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_ZORO_BASE_URL,
    DEFAULT_CONFIG.ZORO_BASE_URL
  ),
  NINEANIME_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_9ANIME_BASE_URL,
    DEFAULT_CONFIG.NINEANIME_BASE_URL
  ),
  GOGOANIME_BASE_URL: parseStringEnv(
    process.env.NEXT_PUBLIC_GOGOANIME_BASE_URL,
    DEFAULT_CONFIG.GOGOANIME_BASE_URL
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