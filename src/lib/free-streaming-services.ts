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
}

/**
 * All available free streaming platforms
 * Organized by content type focus but many support multiple types
 */
export const FREE_STREAMING_SERVICES: FreeStreamingService[] = [
  // Movie-focused platforms
  {
    id: 'tubi',
    name: 'Tubi',
    baseUrl: 'https://tubitv.com',
    searchPath: '/search/{title}',
    supportedTypes: ['MOVIE', 'SERIES'],
    description: 'Free movies and TV with ads',
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: 'crackle',
    name: 'Crackle',
    baseUrl: 'https://www.crackle.com',
    searchPath: '/search?query={title}',
    supportedTypes: ['MOVIE', 'SERIES'],
    description: "Sony's free streaming service",
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: 'pluto',
    name: 'Pluto TV',
    baseUrl: 'https://pluto.tv',
    searchPath: '/search?query={title}',
    supportedTypes: ['MOVIE', 'SERIES'],
    description: 'Free TV and movies',
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: 'popcornflix',
    name: 'Popcornflix',
    baseUrl: 'https://www.popcornflix.com',
    searchPath: '/search?q={title}',
    supportedTypes: ['MOVIE'],
    description: 'Free movies, no subscription',
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: 'filmrise',
    name: 'FilmRise',
    baseUrl: 'https://www.filmrise.com',
    searchPath: '/search?q={title}',
    supportedTypes: ['MOVIE', 'SERIES'],
    description: 'Free movies and TV shows',
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: 'youtube-free',
    name: 'YouTube Free Movies',
    baseUrl: 'https://www.youtube.com',
    searchPath: '/results?search_query={title}+full+movie+free',
    supportedTypes: ['MOVIE'],
    description: 'Free movies on YouTube',
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: 'internet-archive',
    name: 'Internet Archive',
    baseUrl: 'https://archive.org',
    searchPath: '/search.php?query={title}&and[]=mediatype%3A%22movies%22',
    supportedTypes: ['MOVIE', 'SERIES'],
    description: 'Public domain content',
    adSupported: false,
    requiresSignup: false,
  },
  
  // Anime-focused platforms
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
  {
    id: 'zoro',
    name: 'Zoro.to',
    baseUrl: 'https://zoro.to',
    searchPath: '/search?keyword={title}',
    supportedTypes: ['ANIME'],
    description: 'High-quality anime streaming',
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: '9anime',
    name: '9anime',
    baseUrl: 'https://9anime.to',
    searchPath: '/search?keyword={title}',
    supportedTypes: ['ANIME'],
    description: 'Popular anime streaming site',
    adSupported: true,
    requiresSignup: false,
  },
  {
    id: 'gogoanime',
    name: 'Gogoanime',
    baseUrl: 'https://gogoanime.lu',
    searchPath: '/search.html?keyword={title}',
    supportedTypes: ['ANIME'],
    description: 'Extensive anime library',
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