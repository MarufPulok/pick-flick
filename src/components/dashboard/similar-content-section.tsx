/**
 * SimilarContentSection Component
 * Displays "More Like This" recommendations in an expandable panel
 * Styled to match the existing app design language
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useSimilar } from '@/hooks/use-similar';
import { ChevronDown, ChevronUp, Film, Loader2, Play, Sparkles, Tv } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface SimilarContentSectionProps {
  tmdbId: number;
  contentType: ContentType;
  currentTitle: string;
}

export function SimilarContentSection({
  tmdbId,
  contentType,
  currentTitle,
}: SimilarContentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data, isLoading, error } = useSimilar(tmdbId, contentType, {
    limit: 6,
    excludeIds: [tmdbId],
    enabled: isExpanded,
  });

  const items = data?.items ?? [];

  return (
    <div className="mt-6">
      {/* Toggle Header - Styled as glass card header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 px-4 text-left
                   glass rounded-xl hover:bg-white/10 transition-all duration-200
                   border border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-semibold block">More Like This</span>
            <span className="text-xs text-muted-foreground">
              Based on &ldquo;{currentTitle.length > 25 ? currentTitle.slice(0, 25) + '...' : currentTitle}&rdquo;
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <div className={`p-1.5 rounded-lg bg-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </button>

      {/* Expandable Content with smooth animation */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
      }`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Finding similar titles...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">Couldn&apos;t load similar content</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">No similar titles found</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {items.map((item) => (
              <SimilarContentCard key={item.tmdbId} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SimilarContentItem {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  posterUrl: string | null;
  rating: number;
  releaseDate: string;
  contentType: ContentType;
}

function SimilarContentCard({ item }: { item: SimilarContentItem }) {
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
  const watchUrl = `/dashboard?watch=${item.tmdbId}&type=${item.contentType}`;

  return (
    <Link
      href={watchUrl}
      className="group flex-shrink-0 w-[120px] sm:w-[140px]"
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-secondary 
                      ring-2 ring-transparent group-hover:ring-primary transition-all duration-200
                      group-hover:scale-[1.02] group-hover:shadow-lg">
        {item.posterUrl ? (
          <Image
            src={item.posterUrl}
            alt={item.title}
            fill
            sizes="140px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            {item.contentType === 'MOVIE' ? (
              <Film className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Tv className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                        flex items-center justify-center">
          <div className="p-3 rounded-full bg-primary/90 backdrop-blur-sm shadow-lg
                          transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm
                        text-[10px] font-semibold text-white flex items-center gap-0.5">
          <span className="text-yellow-400">★</span> {item.rating.toFixed(1)}
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <h4 className="font-medium text-xs line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        {year && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{year}</p>
        )}
      </div>
    </Link>
  );
}
