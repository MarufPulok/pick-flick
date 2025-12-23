/**
 * UniversalFreeStreamingSection Component
 * Displays free streaming options for all content types (movies, TV series, and anime)
 * Features: preferred/recent service indicators, usage tracking, personalized ordering
 */

'use client';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { freeStreamingConfig } from '@/config/free-streaming.config';
import { ContentType } from '@/dtos/common.dto';
import { getFreeStreamingOptions, prioritizeFreeServices } from '@/lib/free-streaming';
import { FreeStreamingService } from '@/lib/free-streaming-services';
import { hasReportedRecently, reportServiceIssue } from '@/lib/service-feedback';
import {
    getPreferredServices,
    isRecentlyUsed,
    trackUsage,
} from '@/lib/service-usage';
import { AlertTriangle, Clock, ExternalLink, Film, Star, Tv, Zap } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface UniversalFreeStreamingSectionProps {
  /** Content title to search for */
  title: string;
  /** Type of content (MOVIE, SERIES, ANIME) */
  contentType: ContentType;
  /** Maximum services to display (default: 4) */
  maxServices?: number;
  /** Optional TMDB ID for tracking */
  tmdbId?: number;
  /** Optional callback when a service is clicked */
  onServiceClick?: (serviceId: string, url: string) => void;
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
 * Service card with preferred/recent indicators and report functionality
 */
function ServiceCard({
  service,
  title,
  titleId,
  contentType,
  isPreferred,
  isRecent,
  onClick,
}: {
  service: FreeStreamingService;
  title: string;
  titleId?: number;
  contentType: ContentType;
  isPreferred: boolean;
  isRecent: boolean;
  onClick: () => void;
}) {
  const hasBadge = isPreferred || isRecent;
  const [hasReported, setHasReported] = useState(() => 
    hasReportedRecently(service.id, titleId)
  );
  
  // Handle report button click
  const handleReport = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    reportServiceIssue({
      serviceId: service.id,
      contentType,
      titleId,
      titleName: title,
      feedbackType: 'NOT_WORKING',
    });
    
    setHasReported(true);
    toast.success('Thanks for reporting! We\'ll look into it.');
  }, [service.id, contentType, titleId, title]);
  
  return (
    <div className={`${hasReported ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-1 p-3 rounded-lg border border-green-500/30 bg-green-950/30 text-green-100 hover:bg-green-900/40 hover:border-green-400/50 transition-all min-h-[44px] group">
        {/* Main link area */}
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch ${title} on ${service.name} - Opens in new tab`}
          onClick={onClick}
          className="flex-1 min-w-0"
        >
          {/* Row 1: Service name + external link */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {service.name}
            </span>
            <ExternalLink className="w-3 h-3 text-green-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          
          {/* Row 2: Badges and/or description */}
          <div className="flex items-center gap-2 mt-1">
            {/* Reported badge - takes priority over other badges */}
            {hasReported ? (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-300 bg-red-900/40 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <AlertTriangle className="w-2.5 h-2.5" />
                Reported
              </span>
            ) : (
              <>
                {/* Preferred badge */}
                {isPreferred && (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Preferred
                  </span>
                )}
                {/* Recently used badge (only show if not preferred) */}
                {isRecent && !isPreferred && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    Recent
                  </span>
                )}
                {/* Description (show if no badge) */}
                {freeStreamingConfig.SHOW_SERVICE_DESCRIPTIONS && !hasBadge && (
                  <p className="text-xs text-green-200/70 truncate">
                    {service.description}
                  </p>
                )}
              </>
            )}
          </div>
        </a>
        
        {/* Report button - inline at right */}
        {!hasReported && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleReport}
                className="p-2 rounded-lg text-green-400/40 hover:text-red-400 hover:bg-red-900/40 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                aria-label="Report broken link"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Report broken link</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/**
 * Renders a section with free streaming options for any content type
 * Returns null if title is invalid or no services are available
 */
export function UniversalFreeStreamingSection({
  title,
  contentType,
  maxServices = 4,
  tmdbId,
  onServiceClick,
}: UniversalFreeStreamingSectionProps) {
  // Early return for invalid titles
  if (!title?.trim()) return null;
  
  // Get user preferred services for this content type
  const userPreferences = useMemo(
    () => getPreferredServices(contentType),
    [contentType]
  );
  
  // Get available streaming options with user preferences applied
  const streamingOptions = useMemo(() => {
    const options = getFreeStreamingOptions(title, contentType);
    // Re-prioritize with user preferences
    return userPreferences.length > 0
      ? prioritizeFreeServices(options, contentType, userPreferences)
      : options;
  }, [title, contentType, userPreferences]);
  
  // Early return if no services available
  if (streamingOptions.length === 0) return null;
  
  // Get content type information
  const contentInfo = getContentTypeInfo(contentType);
  const ContentIcon = contentInfo.icon;
  
  // Determine services to display and if there are more
  const servicesToDisplay = streamingOptions.slice(0, maxServices);
  const hasMoreServices = streamingOptions.length > maxServices;
  const additionalCount = streamingOptions.length - maxServices;
  
  // Handle service click - track usage
  const handleServiceClick = useCallback(
    (serviceId: string, url: string) => {
      trackUsage({
        serviceId,
        contentType,
        titleId: tmdbId,
      });
      onServiceClick?.(serviceId, url);
    },
    [contentType, tmdbId, onServiceClick]
  );
  
  // Sets of preferred and recent services for quick lookup
  const preferredSet = useMemo(
    () => new Set(userPreferences),
    [userPreferences]
  );
  
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
            <ServiceCard
              key={service.id}
              service={service}
              title={title}
              titleId={tmdbId}
              contentType={contentType}
              isPreferred={preferredSet.has(service.id)}
              isRecent={isRecentlyUsed(service.id)}
              onClick={() => handleServiceClick(service.id, service.url || '')}
            />
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