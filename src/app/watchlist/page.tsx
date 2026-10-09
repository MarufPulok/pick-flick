/**
 * Watchlist Page
 * View and manage saved content for later viewing
 */

'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import {
    useRandomWatchlistItem,
    useWatchlist,
    useWatchlistQuery,
    useWatchlistStats,
} from '@/hooks/use-watchlist';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'MOVIE', label: 'Movies' },
  { id: 'SERIES', label: 'Series' },
  { id: 'ANIME', label: 'Anime' },
] as const;

type ContentTypeFilter = (typeof FILTERS)[number]['id'];

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

const CONTAINER = 'mx-auto max-w-330 px-4 sm:px-6 lg:px-15 pt-24 pb-24';

export default function WatchlistPage() {
  const { status } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState<ContentTypeFilter>('ALL');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useWatchlistQuery({
    contentType: filter === 'ALL' ? undefined : filter,
    limit: 50,
  });
  const { data: stats } = useWatchlistStats();
  const { removeFromWatchlist, isPending: isRemoving } = useWatchlist();
  const { getRandomItem, isPending: isPickingRandom } = useRandomWatchlistItem();

  if (status === 'loading') {
    return <main className={CONTAINER} aria-busy="true" />;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handlePickRandom = async () => {
    const result = await getRandomItem(filter === 'ALL' ? undefined : filter);
    if (result?.item) {
      setHighlightedId(result.item.id);
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

  const meta = (item: WatchlistItem) =>
    [item.releaseDate && new Date(item.releaseDate).getFullYear(), item.rating && item.rating.toFixed(1)]
      .filter(Boolean)
      .join(' · ');

  return (
    <main className={CONTAINER}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Watchlist</h1>
        <div className="flex gap-1 rounded-md border border-border p-1" role="tablist" aria-label="Type">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'h-7 cursor-pointer rounded-sm px-3 text-xs transition-colors',
                filter === f.id ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="tabular font-mono text-sm text-muted-foreground">{stats?.total || 0} saved</p>
        <Button variant="ghost" size="sm" onClick={handlePickRandom} disabled={isPickingRandom || !data?.items.length}>
          Quick pick
        </Button>
      </div>

      <div className="mt-8">
        {error ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">Could not load your watchlist.</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6" aria-busy="true">
            {Array.from({ length: 12 }, (_, i) => (
              <li key={i}>
                <div className="aspect-2/3 rounded-md bg-foreground/10" />
                <div className="mt-2 h-4 w-3/4 rounded-md bg-foreground/10" />
              </li>
            ))}
          </ul>
        ) : data && data.items.length === 0 ? (
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">Nothing saved yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Save a pick and it will show up here.</p>
            <Link href="/dashboard" className={cn(buttonVariants({ variant: 'play' }), 'mt-6')}>
              Get a pick
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {data?.items.map((item: WatchlistItem) => (
              <li key={item.id} id={`watchlist-item-${item.id}`} className="group relative">
                <Link href={`/dashboard?watch=${item.tmdbId}&type=${item.contentType}`} className="block">
                  <div
                    className={cn(
                      'relative aspect-2/3 overflow-hidden rounded-md border bg-surface transition-[border-color] group-hover:border-foreground/40',
                      highlightedId === item.id ? 'border-foreground' : 'border-border'
                    )}
                  >
                    {item.posterPath && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-tight">{item.title}</p>
                  <p className="tabular mt-0.5 font-mono text-sm text-muted-foreground">{meta(item)}</p>
                </Link>
                <Button
                  variant="icon"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => handleRemove(item)}
                  disabled={isRemoving}
                  className="absolute right-2 top-2 bg-background/80 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus-visible:opacity-100"
                >
                  <X className="size-4" strokeWidth={1.5} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
