/**
 * SearchResultCard Component
 * Displays individual search result with poster, info, and streaming buttons
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { getFreeStreamingOptions } from '@/lib/free-streaming';
import { ExternalLink, Film, Star, Tv, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SearchResultItem {
  tmdbId: number;
  title: string;
  type: 'movie' | 'tv' | 'person';
  contentType: ContentType | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  releaseDate: string | null;
  overview: string | null;
  genreIds: number[];
  popularity: number;
  profileUrl?: string | null;
  knownFor?: string[];
}

interface SearchResultCardProps {
  result: SearchResultItem;
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const year = result.releaseDate 
    ? new Date(result.releaseDate).getFullYear() 
    : null;

  const linkUrl = result.type === 'person'
    ? `/search?q=${encodeURIComponent(result.title)}`
    : `/watch?id=${result.tmdbId}&type=${result.contentType}&title=${encodeURIComponent(result.title)}&poster=${encodeURIComponent(result.posterUrl || '')}`;

  const TypeIcon = result.type === 'movie' ? Film 
                 : result.type === 'tv' ? Tv 
                 : User;

  // Get streaming options for movies/TV
  const streamingServices = result.type !== 'person' && result.contentType
    ? getFreeStreamingOptions(result.title, result.contentType).slice(0, 3)
    : [];

  return (
    <div className="group flex gap-4 p-4 rounded-xl glass hover:bg-white/5
                    transition-all duration-200 border border-transparent
                    hover:border-primary/30">
      {/* Poster / Profile */}
      <Link
        href={linkUrl}
        className="w-20 h-28 rounded-lg overflow-hidden bg-secondary flex-shrink-0
                   ring-2 ring-transparent group-hover:ring-primary transition-all"
      >
        {result.posterUrl || result.profileUrl ? (
          <Image
            src={result.posterUrl || result.profileUrl!}
            alt={result.title}
            width={80}
            height={112}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <TypeIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        {/* Title and Type */}
        <div className="flex items-start justify-between gap-2">
          <Link href={linkUrl}>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {result.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs flex-shrink-0">
            <TypeIcon className="w-3 h-3" />
            <span className="capitalize">{result.type}</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          {year && <span>{year}</span>}
          {result.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              {result.rating.toFixed(1)}
            </span>
          )}
          {result.contentType && (
            <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] uppercase">
              {result.contentType}
            </span>
          )}
        </div>

        {/* Overview */}
        {result.overview && result.type !== 'person' && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {result.overview}
          </p>
        )}

        {/* Known For (Person) */}
        {result.knownFor && result.knownFor.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Known for: {result.knownFor.slice(0, 3).join(', ')}
          </p>
        )}

        {/* Streaming Buttons - Inline */}
        {streamingServices.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-green-400 font-medium">🆓 Play on:</span>
            {streamingServices.map((service) => (
              <a
                key={service.id}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                           bg-green-600/20 hover:bg-green-600/30 text-green-400
                           text-xs font-medium transition-colors border border-green-500/30"
              >
                {service.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Search Results Grid
 */
interface SearchResultsGridProps {
  results: SearchResultItem[];
}

export function SearchResultsGrid({ results }: SearchResultsGridProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <SearchResultCard key={`${result.type}-${result.tmdbId}`} result={result} />
      ))}
    </div>
  );
}
