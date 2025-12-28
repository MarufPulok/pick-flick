/**
 * Watchlist Page
 * View and manage saved content for later viewing
 */

'use client';

import {
    useRandomWatchlistItem,
    useWatchlist,
    useWatchlistQuery,
    useWatchlistStats,
} from '@/hooks/use-watchlist';
import {
    Bookmark,
    Calendar,
    Dice5,
    Film,
    Filter,
    Loader2,
    PlayCircle,
    Star,
    Trash2,
    Tv,
    Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ContentTypeFilter = 'ALL' | 'MOVIE' | 'SERIES' | 'ANIME';

interface WatchlistItem {
  id: string;
  tmdbId: number;
  contentType: 'MOVIE' | 'SERIES' | 'ANIME';
  title: string;
  posterPath?: string;
  rating?: number;
  releaseDate?: string;
  priority: string;
  createdAt: string;
}

export default function WatchlistPage() {
  const { status } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState<ContentTypeFilter>('ALL');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { data, isLoading, error } = useWatchlistQuery({
    contentType: filter === 'ALL' ? undefined : filter,
    limit: 50,
  });
  const { data: stats } = useWatchlistStats();
  const { removeFromWatchlist, isPending: isRemoving } = useWatchlist();
  const { getRandomItem, isPending: isPickingRandom } = useRandomWatchlistItem();

  // Auth loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handlePickRandom = async () => {
    const result = await getRandomItem(filter === 'ALL' ? undefined : filter);
    if (result?.item) {
      setHighlightedId(result.item.id);
      // Scroll to the highlighted item
      setTimeout(() => {
        const element = document.getElementById(`watchlist-item-${result.item.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleRemove = (item: WatchlistItem) => {
    removeFromWatchlist({
      tmdbId: item.tmdbId,
      contentType: item.contentType,
      title: item.title,
    });
  };

  const getYear = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'MOVIE':
        return <Film className="w-3.5 h-3.5" />;
      case 'SERIES':
        return <Tv className="w-3.5 h-3.5" />;
      case 'ANIME':
        return <Zap className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-animated px-4 sm:px-6 py-8 sm:py-12 pt-20 sm:pt-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Bookmark className="w-7 h-7 text-amber-500" />
              My Watchlist
            </h1>
            <p className="text-muted-foreground mt-1">
              {stats?.total || 0} items saved for later
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as ContentTypeFilter)}
                className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Types</option>
                <option value="MOVIE">🎬 Movies</option>
                <option value="SERIES">📺 Series</option>
                <option value="ANIME">⚡ Anime</option>
              </select>
            </div>

            {/* Pick Random Button */}
            <button
              onClick={handlePickRandom}
              disabled={isPickingRandom || !data?.items.length}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPickingRandom ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Dice5 className="w-4 h-4" />
              )}
              Pick One!
            </button>
          </div>
        </div>

        {/* Stats Pills */}
        {stats && (
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="px-3 py-1.5 rounded-full bg-secondary/50 text-sm flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-blue-500" />
              {stats.byType.MOVIE} Movies
            </div>
            <div className="px-3 py-1.5 rounded-full bg-secondary/50 text-sm flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-green-500" />
              {stats.byType.SERIES} Series
            </div>
            <div className="px-3 py-1.5 rounded-full bg-secondary/50 text-sm flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {stats.byType.ANIME} Anime
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-red-500">Failed to load watchlist</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data?.items.length === 0 && (
          <div className="glass rounded-xl p-12 text-center">
            <Bookmark className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No items saved yet</h2>
            <p className="text-muted-foreground mb-6">
              Save movies, series, and anime to your watchlist to view them later
            </p>
            <Link
              href="/dashboard"
              className="inline-flex px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Get a Recommendation
            </Link>
          </div>
        )}

        {/* Watchlist Grid */}
        {data && data.items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.items.map((item: WatchlistItem) => (
              <div
                id={`watchlist-item-${item.id}`}
                key={item.id}
                className={`group relative glass rounded-xl overflow-hidden transition-all ${
                  highlightedId === item.id
                    ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-background scale-105'
                    : ''
                }`}
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] bg-muted">
                  {item.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                    <Link
                      href={`/dashboard?watch=${item.tmdbId}&type=${item.contentType}`}
                      className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Watch
                    </Link>
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={isRemoving}
                      className="w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {getContentTypeIcon(item.contentType)}
                    </span>
                    {item.rating && (
                      <span className="text-xs flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                    {item.releaseDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {getYear(item.releaseDate)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
