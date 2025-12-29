/**
 * SimilarContentSection Component
 * Displays "More Like This" recommendations in an expandable panel
 * With inline streaming buttons and proper spacing
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useSimilar } from '@/hooks/use-similar';
import { getFreeStreamingOptions } from '@/lib/free-streaming';
import { ChevronDown, ExternalLink, Film, Loader2, Sparkles, Tv } from 'lucide-react';
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
    <div className="mt-8">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-4 px-5 text-left
                   glass rounded-2xl hover:bg-white/10 transition-all duration-200
                   border border-white/10"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-semibold block">More Like This</span>
            <span className="text-sm text-muted-foreground">
              Based on &ldquo;{currentTitle.length > 25 ? currentTitle.slice(0, 25) + '...' : currentTitle}&rdquo;
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          <div className={`p-2 rounded-xl bg-secondary/80 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[800px] opacity-100 mt-5' : 'max-h-0 opacity-0'
      }`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Finding similar titles...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Couldn&apos;t load similar content</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No similar titles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
  
  // Get streaming services
  const streamingServices = getFreeStreamingOptions(item.title, item.contentType).slice(0, 3);

  return (
    <div className="glass rounded-2xl overflow-hidden hover:bg-white/5 transition-all group">
      {/* Main Link Area */}
      <Link href={watchUrl} className="block">
        {/* Poster */}
        <div className="aspect-[2/3] relative overflow-hidden">
          {item.posterUrl ? (
            <Image
              src={item.posterUrl}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              {item.contentType === 'MOVIE' ? (
                <Film className="w-10 h-10 text-muted-foreground" />
              ) : (
                <Tv className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm
                          text-xs font-semibold text-white flex items-center gap-1">
            <span className="text-yellow-400">★</span> {item.rating.toFixed(1)}
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h4 className="font-semibold text-sm text-white line-clamp-2 leading-tight">
              {item.title}
            </h4>
            {year && (
              <p className="text-xs text-white/70 mt-1">{year} • {item.contentType}</p>
            )}
          </div>
        </div>
      </Link>

      {/* Streaming Buttons - Below Poster */}
      {streamingServices.length > 0 && (
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-green-400 font-medium">🆓</span>
            {streamingServices.map((service) => (
              <a
                key={service.id}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 rounded-md
                           bg-green-600/20 hover:bg-green-600/40 text-green-400
                           text-[10px] font-medium transition-colors"
              >
                {service.name}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
