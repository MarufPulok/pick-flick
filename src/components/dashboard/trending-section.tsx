/**
 * TrendingSection Component
 * Displays trending movies and TV shows on the dashboard
 * Styled to match the existing app design language
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useTrending } from '@/hooks/use-trending';
import { ChevronLeft, ChevronRight, Film, Flame, Loader2, Play, Tv } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface TrendingSectionProps {
  limit?: number;
}

export function TrendingSection({ limit = 8 }: TrendingSectionProps) {
  const [selectedType, setSelectedType] = useState<'ALL' | 'MOVIE' | 'SERIES'>('ALL');
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('day');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const { data, isLoading, error } = useTrending({
    type: selectedType,
    timeWindow,
    limit,
  });

  const items = data?.items ?? [];

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const hasOverflow = scrollWidth > clientWidth;
    setShowLeftArrow(hasOverflow && scrollLeft > 10);
    setShowRightArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        clearTimeout(timer);
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
    return () => clearTimeout(timer);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    const scrollTo = direction === 'left' 
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: scrollTo,
      behavior: 'smooth',
    });
  };

  return (
    <div className="glass rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Trending Now</h2>
            <p className="text-xs text-muted-foreground">
              {timeWindow === 'day' ? "Today's" : "This week's"} popular picks
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <div className="flex rounded-xl bg-secondary/50 p-1 border border-white/5">
            {(['ALL', 'MOVIE', 'SERIES'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  selectedType === type
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {type === 'ALL' ? 'All' : type === 'MOVIE' ? 'Movies' : 'Shows'}
              </button>
            ))}
          </div>

          {/* Time Window */}
          <div className="flex rounded-xl bg-secondary/50 p-1 border border-white/5">
            {(['day', 'week'] as const).map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  timeWindow === tw
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {tw === 'day' ? 'Today' : 'Week'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading trending...</span>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load trending content</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No trending content available</p>
        </div>
      ) : (
        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center
                         bg-gradient-to-r from-card/95 via-card/50 to-transparent
                         hover:from-card hover:via-card/70 hover:to-transparent
                         transition-all duration-200"
              aria-label="Scroll left"
            >
              <div className="w-8 h-8 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center
                            shadow-lg backdrop-blur-sm transition-all hover:scale-110">
                <ChevronLeft className="w-5 h-5 text-primary-foreground" />
              </div>
            </button>
          )}

          {/* Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            className="w-full overflow-x-auto pb-2 scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onScroll={checkScrollButtons}
          >
            <div className="flex gap-3 flex-nowrap select-none">
              {items.map((item, index) => (
                <TrendingCard key={item.tmdbId} item={item} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center
                         bg-gradient-to-l from-card/95 via-card/50 to-transparent
                         hover:from-card hover:via-card/70 hover:to-transparent
                         transition-all duration-200"
              aria-label="Scroll right"
            >
              <div className="w-8 h-8 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center
                            shadow-lg backdrop-blur-sm transition-all hover:scale-110">
                <ChevronRight className="w-5 h-5 text-primary-foreground" />
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface TrendingContentItem {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  rating: number;
  releaseDate: string;
  contentType: ContentType;
}

function TrendingCard({ item, rank }: { item: TrendingContentItem; rank: number }) {
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
  const watchUrl = `/dashboard?watch=${item.tmdbId}&type=${item.contentType}`;

  // Top 3 get special styling
  const isTopThree = rank <= 3;
  const rankGradients = {
    1: 'from-yellow-400 to-orange-500',
    2: 'from-slate-300 to-slate-400',
    3: 'from-amber-600 to-amber-700',
  };

  return (
    <Link
      href={watchUrl}
      className="group flex-shrink-0 w-[130px] sm:w-[150px] select-none cursor-pointer"
    >
      {/* Poster with Rank */}
      <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-secondary 
                      border-2 border-transparent group-hover:border-primary/30
                      transition-all duration-200">
        {item.posterUrl ? (
          <Image
            src={item.posterUrl}
            alt={item.title}
            fill
            sizes="150px"
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

        {/* Rank Badge */}
        <div className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center
                        text-xs font-bold text-white shadow-lg
                        ${isTopThree 
                          ? `bg-gradient-to-br ${rankGradients[rank as 1 | 2 | 3]}` 
                          : 'bg-black/70 backdrop-blur-sm'}`}>
          {rank}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                        flex items-center justify-center pointer-events-none">
          <div className="p-2.5 rounded-full bg-primary/80 backdrop-blur-sm shadow-lg
                          transform scale-75 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-4 h-4 text-primary-foreground" fill="currentColor" />
          </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm
                        text-[10px] font-semibold text-white flex items-center gap-0.5">
          <span className="text-yellow-400">★</span> {item.rating.toFixed(1)}
        </div>

        {/* Content Type Badge */}
        <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
          {item.contentType === 'MOVIE' ? (
            <Film className="w-3 h-3 text-white" />
          ) : (
            <Tv className="w-3 h-3 text-white" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5 select-none">
        <h4 className="font-medium text-xs line-clamp-2 leading-tight transition-colors duration-200">
          {item.title}
        </h4>
        {year && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{year}</p>
        )}
      </div>
    </Link>
  );
}
