'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ANIME_GENRES, CONTENT_TYPES, GENRES, LANGUAGES, RATING_TIERS } from '@/config/app.config';
import { Poster } from '@/components/ui/poster';
import { useMoodChips } from '@/hooks/use-feed';
import { useHistoryActions } from '@/hooks/use-history-actions';
import { useIsInWatchlist, useWatchlist } from '@/hooks/use-watchlist';
import { BASE_CHIPS, SURPRISE_CHIP, type MoodChip } from '@/lib/mood-chips';
import { cn } from '@/lib/utils';
import { markAsWatching } from '@/lib/watching-state';
import { Ban, Bookmark, BookmarkCheck, Eye, ThumbsDown, ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StreamPlayer } from './stream-player';

export interface Recommendation {
  tmdbId: number;
  title: string;
  overview: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  contentType: 'MOVIE' | 'SERIES' | 'ANIME';
  releaseDate?: string;
  rating?: number | null;
  voteCount?: number;
  originalLanguage?: string;
  genreIds?: number[];
  runtime?: number | null;
  profileComplete?: boolean;
  trailerUrl?: string | null;
  explanation?: { title: string; description: string } | null;
  watchProviders?: {
    flatrate?: Array<{ name: string; logoUrl: string; providerId: number }>;
    link?: string;
  } | null;
}

type Mode = 'SMART' | 'FILTERED';

interface Filters {
  contentType: string;
  genre: string;
  language: string;
  rating: keyof typeof RATING_TIERS;
}

const LANGUAGE_NAME = Object.fromEntries(Object.values(LANGUAGES).map((l) => [l.code, l.name]));

function fmtRuntime(min: number) {
  const h = Math.floor(min / 60);
  return h ? `${h}h ${min % 60}m` : `${min}m`;
}

function metaLine(r: Recommendation) {
  const parts: string[] = [];
  if (r.releaseDate) parts.push(String(new Date(r.releaseDate).getFullYear()));
  if (r.originalLanguage) parts.push(LANGUAGE_NAME[r.originalLanguage] ?? r.originalLanguage.toUpperCase());
  if (r.contentType !== 'MOVIE') parts.push(r.contentType === 'ANIME' ? 'Anime' : 'Series');
  if (r.runtime) parts.push(r.contentType === 'MOVIE' ? fmtRuntime(r.runtime) : `${r.runtime}m episodes`);
  if (typeof r.rating === 'number') parts.push(r.rating.toFixed(1));
  return parts.join(' · ');
}

export function PickScreen({ onPick }: { onPick?: (pick: Recommendation) => void }) {
  const [mode, setMode] = useState<Mode>('SMART');
  const [filters, setFilters] = useState<Filters>({ contentType: 'MOVIE', genre: '', language: 'en', rating: 'ANY' });
  const [refineOpen, setRefineOpen] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const { data: chipData } = useMoodChips();
  const chips = chipData?.chips ?? [...BASE_CHIPS, SURPRISE_CHIP];
  const [pick, setPick] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStream, setShowStream] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showSeen, setShowSeen] = useState(false);

  const { recordAction, isRecording } = useHistoryActions();
  const { toggleWatchlist, isPending: savePending } = useWatchlist();
  const saved = useIsInWatchlist(pick?.tmdbId ?? 0, pick?.contentType ?? 'MOVIE');
  const requestId = useRef(0);
  // Next pick, fetched in the background so "Not tonight" lands instantly.
  const next = useRef<{ body: string; data: Recommendation } | null>(null);

  const fetchPick = async (body: string): Promise<Recommendation> => {
    const res = await fetch('/api/recommendation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not find a pick');
    return data;
  };

  const generate = useCallback(
    async (opts: { genres?: string[]; languages?: string[]; mode?: Mode } = {}) => {
      const id = ++requestId.current;
      setIsLoading(true);
      setError(null);
      const activeMode = opts.mode ?? mode;
      const useFilters = activeMode === 'FILTERED' && !opts.genres;
      // Mood chips go through the taste pipeline (content types, exclusions,
      // learned weights) with the chip's genres or language on top.
      const body = JSON.stringify(
        useFilters
          ? {
              mode: 'FILTERED',
              contentType: filters.contentType,
              genres: filters.genre ? [filters.genre] : [],
              language: filters.language,
              minRating: RATING_TIERS[filters.rating].min,
            }
          : { mode: 'SMART', genres: opts.genres, languages: opts.languages }
      );
      try {
        const ready = next.current;
        next.current = null;
        const data =
          ready && ready.body === body && ready.data.tmdbId !== pick?.tmdbId ? ready.data : await fetchPick(body);
        if (id !== requestId.current) return;
        setPick(data);
        onPick?.(data);
        fetchPick(body)
          .then((d) => {
            if (d.tmdbId !== data.tmdbId) next.current = { body, data: d };
          })
          .catch(() => {});
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : 'Could not find a pick');
      } finally {
        if (id === requestId.current) setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, filters, pick?.tmdbId]
  );

  useEffect(() => {
    // First pick on arrival only; deferred so the effect itself sets no state.
    const t = setTimeout(() => generate(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFromChip = (chip: MoodChip) => {
    setActiveChip(chip.id);
    generate({ genres: chip.genres, languages: chip.languages });
  };

  const act = (action: 'LIKED' | 'DISLIKED' | 'BLACKLISTED' | 'WATCHED' | 'SKIPPED') => {
    if (!pick || isRecording) return;
    setShowSeen(false);
    recordAction({
      tmdbId: pick.tmdbId,
      contentType: pick.contentType,
      action,
      title: pick.title,
      posterPath: pick.posterUrl ?? undefined,
      rating: pick.rating ?? undefined,
      releaseDate: pick.releaseDate,
      source: mode,
      genreIds: pick.genreIds,
      originalLanguage: pick.originalLanguage,
    });
    if (action !== 'LIKED') generate();
  };

  const play = () => {
    if (!pick) return;
    markAsWatching({ tmdbId: pick.tmdbId, contentType: pick.contentType, title: pick.title, posterUrl: pick.posterUrl ?? undefined });
    setShowStream(true);
  };

  const genreOptions = filters.contentType === 'ANIME' ? Object.values(ANIME_GENRES) : Object.values(GENRES);

  return (
    <section className="relative isolate min-h-dvh overflow-hidden lg:min-h-[calc(100dvh-6rem)]">
      {/* The room: the pick's backdrop under a warm scrim. */}
      <div className="absolute inset-0 -z-10 bg-background">
        {pick?.backdropUrl && (
          <Image
            key={pick.tmdbId}
            src={pick.backdropUrl}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className={cn('object-cover object-[70%_center] reel-swap', isLoading && 'opacity-60')}
          />
        )}
        <div className="scrim absolute inset-0" />
      </div>

      <div className="mx-auto grid max-w-330 gap-8 px-4 pb-10 pt-18 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16 lg:px-15 lg:pb-16 lg:pt-30">
        <div className="flex min-w-0 max-w-155 flex-col lg:block">
          <div className="order-2 mt-6 flex items-center justify-between gap-2 lg:order-0 lg:mt-0">
            <p className="text-sm text-muted-foreground">Tonight I want</p>
            <Button type="button" variant="quiet" size="sm" className="px-3" onClick={() => setRefineOpen((o) => !o)} aria-expanded={refineOpen}>
              Refine
            </Button>
          </div>

          <div className="scrollbar-hide order-3 -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:order-0 lg:flex-wrap" role="group" aria-label="Tonight I want">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => pickFromChip(chip)}
                aria-pressed={activeChip === chip.id}
                className={cn(
                  'h-9 shrink-0 cursor-pointer rounded-full border px-4 text-sm transition-colors',
                  activeChip === chip.id
                    ? 'border-accent bg-accent font-medium text-accent-foreground'
                    : 'border-border text-foreground hover:bg-foreground/6'
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {refineOpen && (
            <div className="order-4 mt-5 grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2 lg:order-0">
              <Select label="Type" value={filters.contentType} onChange={(v) => setFilters((f) => ({ ...f, contentType: v, genre: '', language: v === 'ANIME' ? 'ja' : f.language }))}>
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t === 'MOVIE' ? 'Movie' : t === 'SERIES' ? 'Series' : 'Anime'}</option>
                ))}
              </Select>
              <Select label="Genre" value={filters.genre} onChange={(v) => setFilters((f) => ({ ...f, genre: v }))}>
                <option value="">Any</option>
                {genreOptions.map((g) => (
                  <option key={g.id} value={String(g.id)}>{g.name}</option>
                ))}
              </Select>
              <Select label="Language" value={filters.language} onChange={(v) => setFilters((f) => ({ ...f, language: v }))}>
                {Object.values(LANGUAGES).map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </Select>
              <Select label="Rating" value={filters.rating} onChange={(v) => setFilters((f) => ({ ...f, rating: v as Filters['rating'] }))}>
                {Object.entries(RATING_TIERS).map(([k, t]) => (
                  <option key={k} value={k}>{t.label}</option>
                ))}
              </Select>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Button type="button" variant="play" size="sm" onClick={() => { setMode('FILTERED'); setActiveChip(null); setRefineOpen(false); generate({ mode: 'FILTERED' }); }}>
                  Pick with these
                </Button>
                {mode === 'FILTERED' && (
                  <Button type="button" variant="quiet" size="sm" onClick={() => { setMode('SMART'); setRefineOpen(false); generate({ mode: 'SMART' }); }}>
                    Back to my taste
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="order-1 lg:order-0 lg:mt-16">
            {error ? (
              <div className="max-w-130">
                <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Nothing landed.</h1>
                <p className="mt-4 text-lg text-muted-foreground">{error}</p>
                <div className="mt-6">
                  <Button variant="play" onClick={() => generate()}>Try again</Button>
                </div>
              </div>
            ) : isLoading && !pick ? (
              <PickSkeleton />
            ) : pick ? (
              <div key={pick.tmdbId} className={cn('reel-swap-late', isLoading && 'opacity-50 transition-opacity')} aria-busy={isLoading}>
                <h1 className={cn('font-display text-balance font-semibold tracking-[-0.02em]', pick.title.length > 22 ? 'text-[clamp(2rem,5.5vw,4.25rem)]' : 'text-[clamp(2.5rem,7vw,5.5rem)]', 'leading-[0.95]')}>
                  {pick.title}
                </h1>
                <p className="tabular mt-3 font-mono text-sm text-muted-foreground lg:mt-5">
                  {metaLine(pick)}
                  {pick.trailerUrl && (
                    <>
                      {' · '}
                      <button type="button" onClick={() => setShowTrailer(true)} className="cursor-pointer underline decoration-border underline-offset-4 hover:text-foreground">
                        Trailer
                      </button>
                    </>
                  )}
                </p>
                <p className="mt-3 max-w-130 text-pretty text-base leading-relaxed text-foreground/85 sm:text-xl lg:mt-5">
                  {pick.explanation?.description || pick.overview}
                </p>
                {pick.profileComplete === false && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <Link href="/onboarding" className="underline underline-offset-4 hover:text-foreground">Set up your taste</Link> for picks that are yours, not everyone&apos;s.
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3 lg:mt-8">
                  <Button variant="play" className="w-40" onClick={play} disabled={isLoading}>Play</Button>
                  <Button variant="ghost" className="w-40" onClick={() => act('SKIPPED')} disabled={isLoading || isRecording}>Not tonight</Button>
                </div>

                <div className="mt-5 flex items-center gap-3 lg:mt-6">
                  <Button variant="icon" aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'} data-on={saved} disabled={savePending}
                    onClick={() => toggleWatchlist({ tmdbId: pick.tmdbId, contentType: pick.contentType, title: pick.title, posterPath: pick.posterUrl ?? undefined, rating: pick.rating ?? undefined, releaseDate: pick.releaseDate }, saved)}>
                    {saved ? <BookmarkCheck className="size-4" strokeWidth={1.5} /> : <Bookmark className="size-4" strokeWidth={1.5} />}
                  </Button>
                  <Button variant="icon" aria-label="Like" disabled={isRecording} onClick={() => act('LIKED')}>
                    <ThumbsUp className="size-4" strokeWidth={1.5} />
                  </Button>
                  <Button variant="icon" aria-label="Dislike and skip" disabled={isRecording} onClick={() => act('DISLIKED')}>
                    <ThumbsDown className="size-4" strokeWidth={1.5} />
                  </Button>
                  <Button variant="icon" aria-label="Never show this again" disabled={isRecording} onClick={() => act('BLACKLISTED')}>
                    <Ban className="size-4" strokeWidth={1.5} />
                  </Button>
                  <Button variant="icon" aria-label="Already seen it" disabled={isRecording} onClick={() => setShowSeen(true)}>
                    <Eye className="size-4" strokeWidth={1.5} />
                  </Button>
                  {pick.watchProviders?.flatrate?.length ? (
                    <a href={pick.watchProviders.link} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
                      Also on {pick.watchProviders.flatrate.slice(0, 2).map((p) => p.name).join(', ')}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="order-first mx-auto w-[min(34vw,140px)] lg:order-0 lg:mx-0 lg:w-90 lg:pt-7.5">
          {pick?.posterUrl ? (
            <Poster
              key={pick.tmdbId}
              src={pick.posterUrl}
              alt={`${pick.title} poster`}
              sizes="(min-width: 1024px) 360px, 34vw"
              priority
              className={cn('reel-swap w-full border-0 shadow-poster', isLoading && 'opacity-60')}
            />
          ) : (
            !error && <div className="aspect-2/3 w-full rounded-md bg-foreground/10" aria-hidden />
          )}
        </div>
      </div>


      <Dialog open={showTrailer} onOpenChange={setShowTrailer}>
        <DialogContent className="w-[95vw] max-w-4xl overflow-hidden border-0 bg-black p-0">
          <DialogTitle className="sr-only">{pick?.title} trailer</DialogTitle>
          <div className="aspect-video w-full">
            {showTrailer && pick?.trailerUrl && (
              <iframe src={`${pick.trailerUrl}?autoplay=1`} title={`${pick.title} trailer`} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSeen} onOpenChange={setShowSeen}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="font-display text-xl font-semibold">Seen it. How was it?</DialogTitle>
          <p className="text-sm text-muted-foreground">Your answer shapes what comes next.</p>
          <div className="mt-2 flex gap-3">
            <Button variant="play" className="flex-1" onClick={() => { act('LIKED'); generate(); }}>Loved it</Button>
            <Button variant="ghost" className="flex-1" onClick={() => act('DISLIKED')}>Not for me</Button>
          </div>
          <button type="button" onClick={() => act('WATCHED')} className="mt-1 cursor-pointer text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
            Just mark as seen
          </button>
        </DialogContent>
      </Dialog>

      {showStream && pick && (
        <StreamPlayer tmdbId={pick.tmdbId} contentType={pick.contentType} title={pick.title} posterPath={pick.posterUrl} onClose={() => setShowStream(false)} />
      )}
    </section>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-sm border border-border bg-background px-3 text-foreground focus-visible:border-accent focus-visible:outline-none">
        {children}
      </select>
    </label>
  );
}

function PickSkeleton() {
  return (
    <div aria-live="polite" aria-label="Finding tonight's pick">
      <div className="h-[72px] w-[70%] rounded-md bg-foreground/10 sm:h-[84px]" />
      <div className="mt-5 h-4 w-40 rounded-sm bg-foreground/10" />
      <div className="mt-6 h-5 w-[520px] max-w-full rounded-sm bg-foreground/10" />
      <div className="mt-2 h-5 w-[420px] max-w-full rounded-sm bg-foreground/10" />
      <div className="mt-8 flex gap-3">
        <div className="h-12 w-40 rounded-md bg-accent/30" />
        <div className="h-12 w-40 rounded-md border border-border" />
      </div>
    </div>
  );
}
