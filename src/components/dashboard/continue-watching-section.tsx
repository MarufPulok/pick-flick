/**
 * ContinueWatchingSection Component
 * Netflix-style "Continue Watching" row for dashboard
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useContinueWatching, useRemoveFromContinue } from '@/hooks/use-continue-watching';
import { Film, Loader2, Play, Tv, X, Zap } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export function ContinueWatchingSection() {
  const router = useRouter();
  const { items, isLoading } = useContinueWatching();
  const removeFromContinue = useRemoveFromContinue();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = useCallback(async (
    e: React.MouseEvent,
    tmdbId: number,
    contentType: ContentType,
    id: string
  ) => {
    e.stopPropagation();
    setRemovingId(id);
    
    try {
      await removeFromContinue.mutateAsync({ tmdbId, contentType });
    } finally {
      setRemovingId(null);
    }
  }, [removeFromContinue]);

  const handlePlay = useCallback((
    tmdbId: number, 
    contentType: ContentType, 
    title: string,
    posterPath: string | null
  ) => {
    // Navigate with title and poster in URL
    const params = new URLSearchParams({
      watch: tmdbId.toString(),
      type: contentType,
      title: title,
    });
    if (posterPath) {
      params.set('poster', posterPath);
    }
    router.push(`/dashboard?${params.toString()}`);
  }, [router]);

  // Don't render if no items or loading
  if (isLoading) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/20">
          <Play className="w-5 h-5 text-white" fill="white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Continue Watching</h2>
          <p className="text-sm text-muted-foreground">Pick up where you left off</p>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => {
          const isRemoving = removingId === item.id;
          const TypeIcon = item.contentType === 'MOVIE' ? Film 
                         : item.contentType === 'ANIME' ? Zap 
                         : Tv;

          return (
            <div
              key={item.id}
              className={`group flex-shrink-0 w-[160px] relative ${isRemoving ? 'opacity-50' : ''}`}
            >
              {/* Card */}
              <button
                onClick={() => handlePlay(item.tmdbId, item.contentType, item.title, item.posterPath)}
                className="w-full text-left"
                disabled={isRemoving}
              >
                {/* Poster */}
                <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-secondary
                                ring-2 ring-transparent group-hover:ring-red-500 transition-all">
                  {item.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                      alt={item.title}
                      fill
                      sizes="160px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TypeIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-4 rounded-full bg-red-600 shadow-lg shadow-red-600/50 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                  </div>

                  {/* Content Type Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium flex items-center gap-1">
                    <TypeIcon className="w-3 h-3" />
                    {item.contentType}
                  </div>

                  {/* Watch Count */}
                  {item.watchCount > 1 && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600/80 backdrop-blur-sm text-[10px] font-medium">
                      {item.watchCount}x
                    </div>
                  )}

                  {/* Title at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-semibold text-sm text-white line-clamp-2 leading-tight">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </button>

              {/* Remove Button */}
              <button
                onClick={(e) => handleRemove(e, item.tmdbId, item.contentType, item.id)}
                disabled={isRemoving}
                className="absolute top-1 right-1 p-1.5 rounded-full bg-black/70 text-white/70
                           hover:bg-red-600 hover:text-white opacity-0 group-hover:opacity-100
                           transition-all z-10"
                title="Remove from Continue Watching"
              >
                {isRemoving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
