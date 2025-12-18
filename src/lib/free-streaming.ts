/**
 * Free Streaming Utility Functions
 * Core logic for filtering, prioritizing, and URL construction
 */

import { freeStreamingConfig, getServiceUrl, isServiceEnabled } from '@/config/free-streaming.config';
import { ContentType } from '@/dtos/common.dto';
import { FREE_STREAMING_SERVICES, FreeStreamingService } from './free-streaming-services';

/**
 * Service priority configuration by content type
 * Most reliable platforms appear first for each content type
 */
const SERVICE_PRIORITIES: Record<ContentType, string[]> = {
  MOVIE: ['tubi', 'crackle', 'pluto', 'popcornflix', 'filmrise', 'youtube-free', 'internet-archive'],
  SERIES: ['tubi', 'crackle', 'pluto', 'filmrise', 'internet-archive'],
  ANIME: ['hianime', 'zoro', '9anime', 'gogoanime'],
};

/**
 * Get available free streaming options for content
 * 
 * @param title - The content title to search for
 * @param contentType - The type of content (MOVIE, SERIES, ANIME)
 * @returns Array of available streaming services with constructed URLs
 */
export function getFreeStreamingOptions(
  title: string,
  contentType: ContentType
): FreeStreamingService[] {
  // Handle invalid titles
  if (!title?.trim()) {
    return [];
  }

  // Check if free streaming is globally enabled
  if (!freeStreamingConfig.ENABLE_FREE_STREAMING) {
    return [];
  }

  // Get services that support this content type and are enabled
  const supportedServices = FREE_STREAMING_SERVICES.filter(service =>
    service.supportedTypes.includes(contentType) && isServiceEnabled(service.id)
  );

  // Apply custom URLs from configuration
  const servicesWithCustomUrls = supportedServices.map(service => ({
    ...service,
    baseUrl: getServiceUrl(service.id) || service.baseUrl
  }));

  // Construct URLs for each service
  const servicesWithUrls = servicesWithCustomUrls
    .map(service => ({
      ...service,
      url: constructFreeStreamingUrl(service, title) || undefined
    }))
    .filter(service => service.url !== undefined); // Only include services with valid URLs

  // Prioritize services based on content type
  return prioritizeFreeServices(servicesWithUrls, contentType);
}

/**
 * Prioritize services by content type and reliability
 * 
 * @param services - Array of streaming services to prioritize
 * @param contentType - The content type to prioritize for
 * @returns Services sorted by priority for the given content type
 */
export function prioritizeFreeServices(
  services: FreeStreamingService[],
  contentType: ContentType
): FreeStreamingService[] {
  const priorities = SERVICE_PRIORITIES[contentType] || [];
  
  // Create a map for quick priority lookup
  const priorityMap = new Map(priorities.map((id, index) => [id, index]));
  
  // Sort services by priority, with unknown services at the end
  return services.sort((a, b) => {
    const priorityA = priorityMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const priorityB = priorityMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return priorityA - priorityB;
  });
}

/**
 * Construct streaming URL for a service and title
 * 
 * @param service - The streaming service configuration
 * @param title - The content title to search for
 * @returns Constructed URL or null if construction fails
 */
function constructFreeStreamingUrl(
  service: FreeStreamingService,
  title: string
): string | null {
  try {
    // Clean and validate inputs
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return null;
    }

    // Clean base URL (remove trailing slashes)
    const cleanBase = service.baseUrl.replace(/\/+$/, '');
    
    // Encode title for URL
    const encodedTitle = encodeURIComponent(cleanTitle);
    
    // Replace placeholder in search path
    const searchPath = service.searchPath.replace('{title}', encodedTitle);
    
    // Construct final URL
    return `${cleanBase}${searchPath}`;
  } catch (error) {
    console.error(`Failed to construct URL for ${service.name}:`, error);
    return null; // Exclude this service from results
  }
}