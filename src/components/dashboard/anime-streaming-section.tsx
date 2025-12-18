/**
 * AnimeStreamingSection Component
 * Displays a "Watch on HiAnime" button for anime recommendations
 * Single Responsibility: Only handles anime streaming link display
 */

'use client';

import { getAnimeStreamUrl } from '@/lib/anime-streaming';
import { ExternalLink } from 'lucide-react';

interface AnimeStreamingSectionProps {
  /**
   * The anime title to search for on HiAnime
   */
  title: string;
  
  /**
   * Whether the recommendation is anime content
   */
  isAnime: boolean;
}

/**
 * Renders a section with a button to watch anime on HiAnime
 * Returns null if not anime or if URL construction fails
 */
export function AnimeStreamingSection({
  title,
  isAnime,
}: AnimeStreamingSectionProps) {
  // Early return if not anime
  if (!isAnime) return null;
  
  // Construct the HiAnime URL
  const streamUrl = getAnimeStreamUrl(title);
  
  // Early return if URL construction failed
  if (!streamUrl) return null;
  
  return (
    <div className="mb-4 p-4 rounded-xl border border-dashed border-indigo-500/50 bg-indigo-950/20">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-indigo-100">
            Free Anime Streaming
          </span>
        </div>
        
        <a
          href={streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch ${title} on HiAnime - Opens in new tab`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-indigo-500/50 bg-indigo-950/40 text-indigo-100 text-sm font-medium hover:bg-indigo-900/60 hover:border-indigo-400/60 transition-all min-h-[44px]"
        >
          <ExternalLink className="w-4 h-4" />
          Watch on HiAnime
        </a>
        
        <p className="text-xs text-indigo-200/60 leading-relaxed">
          Opens HiAnime search in a new tab. We don&apos;t host or control any video content.
        </p>
      </div>
    </div>
  );
}
