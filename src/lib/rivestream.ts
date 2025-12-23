/**
 * RiveStream Integration
 * Provides embedded streaming via rivestream.org
 */

'use client';

import { ContentType } from '@/dtos/common.dto';

const RIVESTREAM_BASE_URL = 'https://rivestream.org';

/**
 * Content type mapping for RiveStream
 */
function getRiveStreamType(contentType: ContentType): string {
  switch (contentType) {
    case 'MOVIE':
      return 'movie';
    case 'SERIES':
    case 'ANIME':
      return 'tv';
    default:
      return 'movie';
  }
}

/**
 * Build RiveStream detail page URL
 */
export function buildRiveStreamUrl(
  tmdbId: number,
  contentType: ContentType
): string {
  const type = getRiveStreamType(contentType);
  return `${RIVESTREAM_BASE_URL}/detail?type=${type}&id=${tmdbId}`;
}

/**
 * Build RiveStream embed URL for iframe
 * Note: This may need adjustment based on actual embed URL pattern
 */
export function buildRiveStreamEmbedUrl(
  tmdbId: number,
  contentType: ContentType,
  season?: number,
  episode?: number
): string {
  const type = getRiveStreamType(contentType);
  
  let url = `${RIVESTREAM_BASE_URL}/embed?type=${type}&id=${tmdbId}`;
  
  // For TV shows, add season/episode if provided
  if ((contentType === 'SERIES' || contentType === 'ANIME') && season && episode) {
    url += `&season=${season}&episode=${episode}`;
  }
  
  return url;
}

/**
 * Check if content type is supported for streaming
 */
export function isStreamingSupported(contentType: ContentType): boolean {
  return ['MOVIE', 'SERIES', 'ANIME'].includes(contentType);
}
