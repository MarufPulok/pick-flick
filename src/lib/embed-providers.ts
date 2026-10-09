'use client';

import { ContentType } from '@/dtos/common.dto';

export interface EmbedPlayback {
  tmdbId: number;
  contentType: ContentType;
  season?: number;
  episode?: number;
  /** Resume position in seconds. */
  startAt?: number;
}

export interface EmbedProvider {
  id: string;
  name: string;
  /** Origin of postMessage progress events, if the provider emits them. */
  eventOrigin?: string;
  buildUrl: (p: EmbedPlayback) => string;
}

function isMovie(p: EmbedPlayback) {
  return p.contentType === 'MOVIE';
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return q ? `?${q}` : '';
}

// Probed Oct 2026 from a real browser. First four vetted end-to-end; the rest answer with a player
// shell but were not watched through. Order here is only the fallback when probing fails;
// rankProviders() reorders by live latency. Expect entries to rot every 6-12 months.
export const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    id: 'vidlink',
    name: 'VidLink',
    eventOrigin: 'https://vidlink.pro',
    buildUrl(p) {
      const q = query({ startAt: p.startAt, nextbutton: !isMovie(p) });
      if (isMovie(p)) return `https://vidlink.pro/movie/${p.tmdbId}${q}`;
      // VidLink requires season/episode for TV; its next-episode button advances from there.
      return `https://vidlink.pro/tv/${p.tmdbId}/${p.season ?? 1}/${p.episode ?? 1}${q}`;
    },
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    buildUrl(p) {
      const q = query({ startAt: p.startAt, nextButton: !isMovie(p) });
      if (isMovie(p)) return `https://vidfast.pro/movie/${p.tmdbId}${q}`;
      return `https://vidfast.pro/tv/${p.tmdbId}/${p.season ?? 1}/${p.episode ?? 1}${q}`;
    },
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    buildUrl(p) {
      if (isMovie(p)) return `https://vidsrc.sh/embed/movie/${p.tmdbId}`;
      // Without season/episode VidSrc shows its own picker and resumes from its own storage.
      let url = `https://vidsrc.sh/embed/tv/${p.tmdbId}`;
      if (p.season && p.episode) url += `/${p.season}/${p.episode}`;
      return url;
    },
  },
  {
    id: 'vidzee',
    name: 'VidZee',
    buildUrl(p) {
      if (isMovie(p)) return `https://player.vidzee.wtf/embed/movie/${p.tmdbId}`;
      return `https://player.vidzee.wtf/embed/tv/${p.tmdbId}/${p.season ?? 1}/${p.episode ?? 1}`;
    },
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    buildUrl(p) {
      const base = `https://multiembed.mov/?video_id=${p.tmdbId}&tmdb=1`;
      return isMovie(p) ? base : `${base}&s=${p.season ?? 1}&e=${p.episode ?? 1}`;
    },
  },
  {
    id: '2embed',
    name: '2Embed',
    buildUrl(p) {
      if (isMovie(p)) return `https://www.2embed.cc/embed/${p.tmdbId}`;
      return `https://www.2embed.cc/embedtv/${p.tmdbId}&s=${p.season ?? 1}&e=${p.episode ?? 1}`;
    },
  },
  {
    id: 'vidrock',
    name: 'VidRock',
    buildUrl(p) {
      if (isMovie(p)) return `https://vidrock.net/movie/${p.tmdbId}`;
      return `https://vidrock.net/tv/${p.tmdbId}/${p.season ?? 1}/${p.episode ?? 1}`;
    },
  },
  {
    id: 'vidjoy',
    name: 'VidJoy',
    buildUrl(p) {
      if (isMovie(p)) return `https://vidjoy.pro/embed/movie/${p.tmdbId}`;
      return `https://vidjoy.pro/embed/tv/${p.tmdbId}/${p.season ?? 1}/${p.episode ?? 1}`;
    },
  },
  {
    id: 'vidlove',
    name: 'VidLove',
    buildUrl(p) {
      if (isMovie(p)) return `https://player.vidlove.cc/embed/movie/${p.tmdbId}`;
      return `https://player.vidlove.cc/embed/tv/${p.tmdbId}/${p.season ?? 1}/${p.episode ?? 1}`;
    },
  },
  {
    id: 'viduki',
    name: 'Viduki',
    buildUrl(p) {
      if (isMovie(p)) return `https://vidsrc.wtf/api/2/movie/?id=${p.tmdbId}`;
      return `https://vidsrc.wtf/api/2/tv/?id=${p.tmdbId}&s=${p.season ?? 1}&e=${p.episode ?? 1}`;
    },
  },
  {
    id: 'vidnest',
    name: 'VidNest',
    buildUrl(p) {
      if (isMovie(p)) return `https://vidnest.fun/movie/${p.tmdbId}`;
      return `https://vidnest.fun/tv/${p.tmdbId}/${p.season ?? 1}/${p.episode ?? 1}`;
    },
  },
  {
    id: 'nontongo',
    name: 'NontonGo',
    buildUrl(p) {
      if (isMovie(p)) return `https://www.nontongo.win/embed/movie/${p.tmdbId}`;
      return `https://www.nontongo.win/embed/tv/${p.tmdbId}/${p.season ?? 1}/${p.episode ?? 1}`;
    },
  },
];

export const DEFAULT_EMBED_PROVIDER = EMBED_PROVIDERS[0];

export interface RankedProvider {
  provider: EmbedProvider;
  /** Round-trip ms from this browser, null when unreachable within the timeout. */
  ms: number | null;
}

const PROBE_TIMEOUT_MS = 4000;
const RANK_TTL_MS = 5 * 60 * 1000;
// Providers that report progress are worth a little latency; drop to 0 for pure speed ranking.
const EVENTS_BONUS_MS = 300;
const PROBE_TMDB_ID = 550; // Fight Club: every provider has it.

let rankCache: { at: number; ranked: RankedProvider[] } | null = null;

async function probe(provider: EmbedProvider): Promise<number | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), PROBE_TIMEOUT_MS);
  const t0 = performance.now();
  try {
    // no-cors: response is opaque, but DNS failures, TLS errors and timeouts still reject.
    await fetch(provider.buildUrl({ tmdbId: PROBE_TMDB_ID, contentType: 'MOVIE' }), {
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      signal: ctl.signal,
    });
    return Math.round(performance.now() - t0);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe every provider from the current browser and sort by latency, fastest first.
 * Unreachable providers keep list order at the end. Cached for RANK_TTL_MS.
 */
export async function rankProviders(force = false): Promise<RankedProvider[]> {
  if (!force && rankCache && Date.now() - rankCache.at < RANK_TTL_MS) return rankCache.ranked;
  const results = await Promise.all(EMBED_PROVIDERS.map(async (provider) => ({ provider, ms: await probe(provider) })));
  const score = (r: RankedProvider) => (r.ms ?? Infinity) - (r.provider.eventOrigin ? EVENTS_BONUS_MS : 0);
  const ranked = results
    .map((r, i) => ({ r, i }))
    .sort((a, b) => score(a.r) - score(b.r) || a.i - b.i)
    .map(({ r }) => r);
  rankCache = { at: Date.now(), ranked };
  return ranked;
}

export function getEmbedProvider(id: string): EmbedProvider {
  return EMBED_PROVIDERS.find((p) => p.id === id) ?? EMBED_PROVIDERS[0];
}

export function buildEmbedUrl(providerId: string, playback: EmbedPlayback): string {
  return getEmbedProvider(providerId).buildUrl(playback);
}
