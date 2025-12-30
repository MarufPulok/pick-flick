/**
 * StreamPlayer Component
 * Embedded streaming player using RiveStream
 * Tracks viewing for "Continue Watching" feature
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useRecordViewing } from '@/hooks/use-continue-watching';
import { buildRiveStreamUrl } from '@/lib/rivestream';
import { setStreamOpen } from '@/lib/watching-state';
import { ExternalLink, Maximize2, Minimize2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface StreamPlayerProps {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath?: string | null;
  onClose: () => void;
}

export function StreamPlayer({
  tmdbId,
  contentType,
  title,
  posterPath,
  onClose,
}: StreamPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamUrl = buildRiveStreamUrl(tmdbId, contentType);
  const recordViewing = useRecordViewing();

  // Mark stream as open and record viewing when mounted
  useEffect(() => {
    setStreamOpen(true);
    
    // Record this viewing for "Continue Watching"
    recordViewing.mutate({
      tmdbId,
      contentType,
      title,
      posterPath: posterPath || null,
    });

    return () => setStreamOpen(false);
  }, [tmdbId, contentType, title, posterPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const openExternal = useCallback(() => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  }, [streamUrl]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/95 flex flex-col ${
        isFullscreen ? '' : 'p-4 md:p-8'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between gap-4 ${
          isFullscreen ? 'absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10' : 'mb-4'
        }`}
      >
        <h2 className="text-lg font-semibold text-white truncate">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={openExternal}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-red-500/50 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Player iframe */}
      <div className={`flex-1 ${isFullscreen ? '' : 'rounded-xl overflow-hidden'}`}>
        <iframe
          src={streamUrl}
          title={`Stream ${title}`}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Footer hint */}
      {!isFullscreen && (
        <p className="mt-3 text-center text-xs text-white/50">
          Content provided by RiveStream • Press ESC or click X to close
        </p>
      )}
    </div>
  );
}
