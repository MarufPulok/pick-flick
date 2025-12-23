/**
 * Free Streaming Services Configuration
 * Defines all available free streaming platforms with their metadata
 */

import { ContentType } from '@/dtos/common.dto';

/**
 * Interface for free streaming service configuration
 */
export interface FreeStreamingService {
  /** Unique identifier for the service */
  id: string;
  /** Display name for users */
  name: string;
  /** Base URL for the platform */
  baseUrl: string;
  /** Search path template with {title} placeholder */
  searchPath: string;
  /** Array of supported content types */
  supportedTypes: ContentType[];
  /** Brief description for users */
  description: string;
  /** Always true for free services */
  adSupported: boolean;
  /** Whether account creation is needed */
  requiresSignup: boolean;
  /** Optional logo path */
  logo?: string;
  /** Constructed URL (added during processing) */
  url?: string;
  
  // ==========================================================================
  // FUTURE: Alternate Title Hooks (Design Only)
  // ==========================================================================
  
  /**
   * Future: Preferred language for search queries
   * Some services work better with original titles vs translated titles
   * 
   * Example:
   * - 'original': Use original title (e.g., "Kimetsu no Yaiba")
   * - 'en': Use English title (e.g., "Demon Slayer")
   * - 'local': Use user's locale title
   * - undefined: Use as-is
   */
  preferredTitleLanguage?: 'original' | 'en' | 'local';
  
  /**
   * Future: Title transformation function name
   * Reference to a function that transforms the title before search
   * 
   * Example transformations:
   * - 'romanize': Convert Japanese/Korean to romanized version
   * - 'removeYear': Strip year from title
   * - 'simplify': Remove special characters
   * - 'seriesFormat': Add "season X" or "S0X" format
   */
  titleTransform?: string;
  
  /**
   * Future: Alternative search paths for different content types
   * Some services have different URL patterns per content type
   * 
   * Example:
   * alternateSearchPaths: {
   *   ANIME: '/anime/search?q={title}',
   *   SERIES: '/tv/search?q={title}',
   * }
   */
  alternateSearchPaths?: Partial<Record<ContentType, string>>;
}

/**
 * All available free streaming platforms
 * Only working sites that are accessible in your region
 */
export const FREE_STREAMING_SERVICES: FreeStreamingService[] = [
  // Movie and TV series platforms
  {
    id: 'moviebox',
    name: 'MovieBox',
    baseUrl: 'https://moviebox.ph',
    searchPath: '/web/searchResult?keyword={title}',
    supportedTypes: ['MOVIE', 'SERIES'],
    description: 'Free movies and TV series',
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: 'cineb',
    name: 'Cineb',
    baseUrl: 'https://cineb.gg',
    searchPath: '/search/{title}',
    supportedTypes: ['MOVIE', 'SERIES'],
    description: 'Free movies and series streaming',
    adSupported: true,
    requiresSignup: false,
  },  
  {
    id: 'syncplay',
    name: 'SyncPlay',
    baseUrl: 'https://syncplay.vercel.app',
    searchPath: '/stream?q={title}',
    supportedTypes: ['MOVIE', 'SERIES', 'ANIME'],
    description: 'Free streaming aggregator',
    adSupported: true,
    requiresSignup: false,
  },
  
  // Anime platform
  {
    id: 'hianime',
    name: 'HiAnime',
    baseUrl: 'https://hianime.to',
    searchPath: '/search?keyword={title}',
    supportedTypes: ['ANIME'],
    description: 'Free anime streaming',
    adSupported: true,
    requiresSignup: false,
  },
];

/**
 * Get services by content type
 */
export function getServicesByContentType(contentType: ContentType): FreeStreamingService[] {
  return FREE_STREAMING_SERVICES.filter(service => 
    service.supportedTypes.includes(contentType)
  );
}

/**
 * Get service by ID
 */
export function getServiceById(id: string): FreeStreamingService | undefined {
  return FREE_STREAMING_SERVICES.find(service => service.id === id);
}