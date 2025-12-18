/**
 * UniversalFreeStreamingSection Component
 * Displays free streaming options for all content types (movies, TV series, and anime)
 * Replaces the anime-specific streaming section with universal coverage
 */

'use client';

import { freeStreamingConfig } from '@/config/free-streaming.config';
import { ContentType } from '@/dtos/common.dto';
import { getFreeStreamingOptions } from '@/lib/free-streaming';
import { ExternalLink, Film, Tv, Zap } from 'lucide-react';

interface UniversalFreeStreamingSectionProps {
  /** Content title to search for */
  title: string;
  /** Type of content (MOVIE, SERIES, ANIME) */
  contentType: ContentType;
  /** Maximum services to display (default: 4) */
  maxServices?: number;
}

/**
 * Get content type display information
 */
function getContentTypeInfo(contentType: ContentType) {
  switch (contentType) {
    case 'MOVIE':
      return {
        label: 'Movie',
        icon: Film,
        description: 'Free movies'
      };
    case 'SERIES':
      return {
        label: 'TV',
        icon: Tv,
        description: 'Free TV shows'
      };
    case 'ANIME':
      return {
        label: 'Anime',
        icon: Zap,
        description: 'Free anime'
      };
    default:
      return {
        label: 'Content',
        icon: Tv,
        description: 'Free streaming'
      };
  }
}

/**
 * Renders a section with free streaming options for any content type
 * Returns null if title is invalid or no services are available
 */
export function UniversalFreeStreamingSection({
  title,
  contentType,
  maxServices = 4,
}: UniversalFreeStreamingSectionProps) {
  // Early return for invalid titles
  if (!title?.trim()) return null;
  
  // Get available streaming options
  const streamingOptions = getFreeStreamingOptions(title, contentType);
  
  // Early return if no services available
  if (streamingOptions.length === 0) return null;
  
  // Get content type information
  const contentInfo = getContentTypeInfo(contentType);
  const ContentIcon = contentInfo.icon;
  
  // Determine services to display and if there are more
  const servicesToDisplay = streamingOptions.slice(0, maxServices);
  const hasMoreServices = streamingOptions.length > maxServices;
  const additionalCount = streamingOptions.length - maxServices;
  
  return (
    <div className="mb-4 p-4 rounded-xl border border-dashed border-green-500/50 bg-green-950/20">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ContentIcon className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-green-100">
            🆓 Free {contentInfo.label} Streaming
          </span>
        </div>
        
        {/* Streaming Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {servicesToDisplay.map((service) => (
            <a
              key={service.id}
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${title} on ${service.name} - Opens in new tab`}
              className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-950/30 text-green-100 hover:bg-green-900/40 hover:border-green-400/50 transition-all min-h-[44px] group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {service.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-green-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                {freeStreamingConfig.SHOW_SERVICE_DESCRIPTIONS && (
                  <p className="text-xs text-green-200/70 truncate">
                    {service.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
        
        {/* More Options Indicator */}
        {hasMoreServices && (
          <div className="text-center">
            <span className="text-xs text-green-200/60 font-medium">
              +{additionalCount} more free option{additionalCount !== 1 ? 's' : ''} available
            </span>
          </div>
        )}
        
        {/* Footer Message */}
        <div className="text-center">
          <p className="text-xs text-green-200/60 leading-relaxed">
            ✨ All options are <span className="font-semibold text-green-300">100% FREE</span> • Ad-supported content
          </p>
          <p className="text-xs text-green-200/50 mt-1">
            We don&apos;t host or control any video content. Links open in new tabs.
          </p>
        </div>
      </div>
    </div>
  );
}