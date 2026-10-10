/**
 * StreamPlayer Component
 * Embedded streaming player with switchable embed providers
 * Tracks viewing for "Continue Watching" feature
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { Button } from '@/components/ui/button';
import { postViewingProgress, useRecordViewing } from '@/hooks/use-continue-watching';
import { DEFAULT_EMBED_PROVIDER, EMBED_PROVIDERS, type RankedProvider, getEmbedProvider, rankProviders } from '@/lib/embed-providers';
import { getFreeStreamingOptions } from '@/lib/free-streaming';
import { setStreamOpen } from '@/lib/watching-state';
import { ExternalLink, Maximize2, Minimize2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PROGRESS_PING_MS = 15_000;

interface StreamPlayerProps {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  season?: number;
  episode?: number;
  /** Resume position in seconds. */
  startAt?: number;
  posterPath?: string | null;
  onClose: () => void;
}

interface Progress {
  position: number;
  duration: number;
  season?: number;
  episode?: number;
  sentAt: number;
}

export function StreamPlayer({
  tmdbId,
  contentType,
  title,
  season,
  episode,
  startAt,
  posterPath,
  onClose,
}: StreamPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [providerId, setProviderId] = useState(DEFAULT_EMBED_PROVIDER.id);
  const [ranked, setRanked] = useState<RankedProvider[] | null>(null);
  const recordViewing = useRecordViewing();
  const queryClient = useQueryClient();
  const progress = useRef<Progress | null>(null);

  const provider = getEmbedProvider(providerId);
  const streamUrl = provider.buildUrl({ tmdbId, contentType, season, episode, startAt });

  // Probe providers from this browser, sort by latency, start on the fastest.
  useEffect(() => {
    let live = true;
    rankProviders().then((r) => {
      if (!live) return;
      setRanked(r);
      if (r[0]?.ms !== null) setProviderId(r[0].provider.id);
    });
    return () => {
      live = false;
    };
  }, []);

  const sources = ranked ?? EMBED_PROVIDERS.map((provider) => ({ provider, ms: null as number | null }));

  // Mark stream as open and record viewing when mounted
  useEffect(() => {
    setStreamOpen(true);
    
    // Record this viewing for "Continue Watching"
    recordViewing.mutate({
      tmdbId,
      contentType,
      title,
      posterPath: posterPath || null,
      season,
      episode,
    });

    return () => setStreamOpen(false);
  }, [tmdbId, contentType, title, posterPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progress tracking: providers with eventOrigin emit PLAYER_EVENT postMessages
  // ({ event, currentTime, duration, season?, episode? }). Throttled to one ping per
  // PROGRESS_PING_MS, flushed on pause/seek/end, tab hide, and unmount.
  // ponytail: only VidLink speaks this dialect; other providers get no position tracking.
  useEffect(() => {
    const origin = provider.eventOrigin;
    if (!origin) return;
    progress.current = null;

    const flush = () => {
      const p = progress.current;
      if (!p || p.duration <= 0) return;
      p.sentAt = Date.now();
      postViewingProgress({
        tmdbId,
        contentType,
        title,
        posterPath: posterPath || null,
        season: p.season ?? null,
        episode: p.episode ?? null,
        positionSeconds: Math.floor(p.position),
        durationSeconds: Math.floor(p.duration),
      });
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || e.data?.type !== 'PLAYER_EVENT') return;
      const d = e.data.data ?? {};
      if (typeof d.currentTime !== 'number') return;
      const prev = progress.current;
      progress.current = {
        position: d.currentTime,
        duration: typeof d.duration === 'number' ? d.duration : (prev?.duration ?? 0),
        season: d.season ?? prev?.season,
        episode: d.episode ?? prev?.episode,
        sentAt: prev?.sentAt ?? 0,
      };
      const force = d.event === 'pause' || d.event === 'ended' || d.event === 'seeked';
      if (force || Date.now() - progress.current.sentAt > PROGRESS_PING_MS) flush();
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onHide);
      flush();
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    };
  }, [provider.eventOrigin, tmdbId, contentType, title, posterPath, queryClient]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const openExternal = useCallback(() => {
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  }, [streamUrl]);

  const externalLinks = getFreeStreamingOptions(title, contentType);

  // Portal: the pick section is an isolated stacking context, so the overlay must sit on body to cover the nav.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-background transition-opacity duration-200 starting:opacity-0">
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
              {sources.map(({ provider: p, ms }) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProviderId(p.id)}
                  aria-pressed={providerId === p.id}
                  title={ms === null ? (ranked ? 'Unreachable' : 'Checking…') : `${ms} ms`}
                  className={`h-7 shrink-0 cursor-pointer rounded-sm px-3 text-xs transition-colors ${
                    providerId === p.id
                      ? 'bg-foreground/10 text-foreground'
                      : ranked && ms === null
                        ? 'text-muted-foreground/40 hover:text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.name}
                  {ms !== null && <span className="ml-1 tabular-nums opacity-50">{ms}</span>}
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
        {ranked === null ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground animate-lamp" aria-busy="true">
            Finding fastest source…
          </div>
        ) : (
          <Frame key={`${providerId}-${tmdbId}`} src={streamUrl} title={`Stream ${title}`} providerName={provider.name} />
        )}
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

/** The embed, with a "Loading <source>…" state until the frame reports load. Keyed by provider so a switch starts clean. */
function Frame({ src, title, providerName }: { src: string; title: string; providerName: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-full w-full">
      {!loaded && (
        <p className="animate-lamp absolute inset-0 flex items-center justify-center text-sm text-muted-foreground" aria-busy="true">
          Loading {providerName}…
        </p>
      )}
      <iframe
        src={src}
        title={title}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full border-0 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
