'use client';

import { ContentType } from '@/dtos/common.dto';

export interface EmbedProvider {
  id: string;
  name: string;
  buildUrl: (tmdbId: number, contentType: ContentType, season?: number, episode?: number) => string;
}

function tvType(contentType: ContentType) {
  return contentType === 'MOVIE' ? 'movie' : 'tv';
}

export const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    id: 'vidsrc',
    name: 'VidSrc',
    buildUrl(tmdbId, contentType, season, episode) {
      const type = tvType(contentType);
      let url = `https://vidsrc.to/embed/${type}/${tmdbId}`;
      if (type === 'tv' && season && episode) url += `/${season}/${episode}`;
      return url;
    },
  },
  {
    id: 'embedsu',
    name: 'EmbedSu',
    buildUrl(tmdbId, contentType, season, episode) {
      const type = tvType(contentType);
      let url = `https://embed.su/embed/${type}/${tmdbId}`;
      if (type === 'tv' && season && episode) url += `/${season}/${episode}`;
      return url;
    },
  },
  {
    id: '2embed',
    name: '2Embed',
    buildUrl(tmdbId, contentType, season, episode) {
      if (contentType === 'MOVIE') {
        return `https://www.2embed.org/embed/tmdb/movie?id=${tmdbId}`;
      }
      let url = `https://www.2embed.org/embed/tmdb/tv?id=${tmdbId}`;
      if (season && episode) url += `&s=${season}&e=${episode}`;
      return url;
    },
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    buildUrl(tmdbId, contentType, season, episode) {
      if (contentType === 'MOVIE') {
        return `https://autoembed.cc/movie/tmdb/${tmdbId}`;
      }
      let url = `https://autoembed.cc/tv/tmdb/${tmdbId}`;
      if (season && episode) url += `-${season}-${episode}`;
      return url;
    },
  },
];

const defaultId =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_EMBED_PROVIDER) || 'vidsrc';

export const DEFAULT_EMBED_PROVIDER =
  EMBED_PROVIDERS.find((p) => p.id === defaultId) ?? EMBED_PROVIDERS[0];

export function getEmbedProvider(id: string): EmbedProvider {
  return EMBED_PROVIDERS.find((p) => p.id === id) ?? EMBED_PROVIDERS[0];
}

export function buildEmbedUrl(
  providerId: string,
  tmdbId: number,
  contentType: ContentType,
  season?: number,
  episode?: number
): string {
  return getEmbedProvider(providerId).buildUrl(tmdbId, contentType, season, episode);
}
