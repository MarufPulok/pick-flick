'use client';

import { useTrending } from '@/hooks/use-trending';
import { cn } from '@/lib/utils';
import { Poster } from '@/components/ui/poster';
import Link from 'next/link';
import { useState } from 'react';

const TYPES = [
  { id: 'ALL', label: 'All' },
  { id: 'MOVIE', label: 'Movies' },
  { id: 'SERIES', label: 'Series' },
  { id: 'ANIME', label: 'Anime' },
] as const;

export function TrendingSection({ limit = 12 }: { limit?: number }) {
  const [type, setType] = useState<(typeof TYPES)[number]['id']>('ALL');
  const { data, isLoading, error } = useTrending({ type, timeWindow: 'day', limit });
  const items = data?.items ?? [];

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold">Trending today</h2>
        <div className="flex gap-1 rounded-md border border-border p-1" role="tablist" aria-label="Trending type">
          {TYPES.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={type === t.id}
              onClick={() => setType(t.id)}
              className={cn(
                'h-7 cursor-pointer rounded-sm px-3 text-xs transition-colors',
                type === t.id ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-muted-foreground">Trending is unavailable right now.</p>
      ) : (
        <ul className="rail scrollbar-hide mt-4 flex gap-4 overflow-x-auto" aria-busy={isLoading}>
          {(isLoading ? Array.from({ length: 8 }) : items).map((item, i) => (
            <li key={item ? (item as { tmdbId: number }).tmdbId : i} className="w-27.5 shrink-0 sm:w-32.5">
              {item ? (
                <Link
                  href={`/dashboard?watch=${(item as { tmdbId: number }).tmdbId}&type=${(item as { contentType: string }).contentType}&title=${encodeURIComponent((item as { title: string }).title)}${(item as { posterPath: string | null }).posterPath ? `&poster=${encodeURIComponent((item as { posterPath: string }).posterPath)}` : ''}`}
                  className="group block"
                >
                  <Poster src={(item as { posterUrl: string | null }).posterUrl} sizes="130px" className="transition-[border-color] group-hover:border-foreground/40" />
                  <p className="mt-2 line-clamp-2 text-sm leading-tight">{(item as { title: string }).title}</p>
                  {(item as { rating: number }).rating > 0 && (
                    <p className="tabular mt-0.5 font-mono text-xs text-muted-foreground">{(item as { rating: number }).rating.toFixed(1)}</p>
                  )}
                </Link>
              ) : (
                <div className="aspect-2/3 rounded-md bg-foreground/10" />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
