/**
 * StreamPlayer Component
 * Embedded streaming player with switchable embed providers
 * Tracks viewing for "Continue Watching" feature
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { Button } from '@/components/ui/button';
import { useRecordViewing } from '@/hooks/use-continue-watching';
import {
  DEFAULT_EMBED_PROVIDER,
  EMBED_PROVIDERS,
  buildEmbedUrl,
} from '@/lib/embed-providers';
import { getFreeStreamingOptions } from '@/lib/free-streaming';
import { setStreamOpen } from '@/lib/watching-state';
import { ExternalLink, Maximize2, Minimize2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface StreamPlayerProps {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  season?: number;
  episode?: number;
  posterPath?: string | null;
  onClose: () => void;
}

export function StreamPlayer({
  tmdbId,
  contentType,
  title,
  season,
  episode,
  posterPath,
  onClose,
}: StreamPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [providerId, setProviderId] = useState(DEFAULT_EMBED_PROVIDER.id);
  const recordViewing = useRecordViewing();

  const streamUrl = buildEmbedUrl(providerId, tmdbId, contentType, season, episode);

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
    setIsFullscreen((prev) => !prev);
  }, []);

  const openExternal = useCallback(() => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  }, [streamUrl]);

  const externalLinks = getFreeStreamingOptions(title, contentType);

  // Portal: the pick section is an isolated stacking context, so the overlay must sit on body to cover the nav.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex shrink-0 flex-col gap-2 px-4 py-2 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h2 className="font-display min-w-0 truncate text-lg font-semibold tracking-[-0.02em]">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close" className="sm:hidden">
            <X className="size-4" strokeWidth={1.5} />
            Close
          </Button>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <div role="group" aria-label="Source" className="flex min-w-0 items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Source</span>
            <div className="scrollbar-hide flex min-w-0 gap-1 overflow-x-auto rounded-md border border-border p-1">
              {EMBED_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProviderId(p.id)}
                  aria-pressed={providerId === p.id}
                  className={`h-7 shrink-0 cursor-pointer rounded-sm px-3 text-xs ${
                    providerId === p.id
                      ? 'bg-foreground/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <Button variant="icon" onClick={openExternal} aria-label="Open in new tab">
            <ExternalLink className="size-4" strokeWidth={1.5} />
          </Button>
          <Button variant="icon" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} className="hidden sm:inline-flex">
            {isFullscreen ? <Minimize2 className="size-4" strokeWidth={1.5} /> : <Maximize2 className="size-4" strokeWidth={1.5} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close" className="hidden sm:inline-flex">
            <X className="size-4" strokeWidth={1.5} />
            Close
          </Button>
        </div>
      </div>

      {/* key forces iframe reload on provider change */}
      <div className={`min-h-0 flex-1 overflow-hidden ${isFullscreen ? '' : 'mx-4 rounded-md border border-border'}`}>
        <iframe
          key={`${providerId}-${tmdbId}`}
          src={streamUrl}
          title={`Stream ${title}`}
          className="h-full w-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="no-referrer"
        />
      </div>

      {!isFullscreen && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm text-muted-foreground">
          <p>Source not loading? Try another source above.</p>
          {externalLinks.map((service) => (
            <a
              key={service.id}
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-4 hover:text-foreground"
            >
              Open on {service.name}
            </a>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
