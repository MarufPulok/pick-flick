/**
 * History Page
 * Displays user's watch history with filters and pagination
 */

'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { HistoryFilters, HistoryItem, useHistoryPage } from '@/hooks/use-history-page';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useState } from 'react';

const TYPES = [
  { id: 'ALL', label: 'All' },
  { id: 'MOVIE', label: 'Movies' },
  { id: 'SERIES', label: 'Series' },
  { id: 'ANIME', label: 'Anime' },
] as const;

const ACTIONS = [
  { id: 'ALL', label: 'All' },
  { id: 'WATCHED', label: 'Watched' },
  { id: 'LIKED', label: 'Liked' },
  { id: 'DISLIKED', label: 'Disliked' },
] as const;

const DATE_RANGES = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
] as const;

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value?: string;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-md border border-border p-1" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'h-7 cursor-pointer rounded-sm px-3 text-xs transition-colors',
            value === o.id ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<HistoryFilters>({
    contentType: 'ALL',
    action: 'ALL',
    dateRange: 'all',
  });

  const { items, total, totalPages, isLoading, error, refetch } = useHistoryPage({
    page,
    limit: 12,
    filters,
  });

  const handleFilterChange = useCallback(<K extends keyof HistoryFilters>(
    key: K,
    value: HistoryFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    const exportData = items.map(item => ({
      title: item.title,
      type: item.contentType,
      action: item.action,
      rating: item.rating,
      releaseDate: item.releaseDate,
      date: item.createdAt,
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, 'watch-history.json');
    } else {
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, 'watch-history.csv');
    }
  }, [items]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-330 px-4 sm:px-6 lg:px-15 pt-24 pb-24">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">History</h1>
      <p className="tabular mt-2 font-mono text-sm text-muted-foreground">{total.toLocaleString()} tracked</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Segmented label="Type" options={TYPES} value={filters.contentType} onChange={(v) => handleFilterChange('contentType', v)} />
        <Segmented label="Status" options={ACTIONS} value={filters.action} onChange={(v) => handleFilterChange('action', v)} />
        <Segmented label="Date" options={DATE_RANGES} value={filters.dateRange} onChange={(v) => handleFilterChange('dateRange', v)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleExport('json')}>Export JSON</Button>
        <Button variant="ghost" size="sm" onClick={() => handleExport('csv')}>Export CSV</Button>
      </div>

      <div className="mt-8">
        {error ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">Could not load your history.</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Try again</Button>
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
        ) : items.length === 0 ? (
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">No history yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Picks you watch, like or dislike will show up here.</p>
            <Link href="/dashboard" className={cn(buttonVariants({ variant: 'play' }), 'mt-6')}>
              Get a pick
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {items.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant="quiet"
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      aria-current={page === pageNum ? 'page' : undefined}
                      className={cn('tabular font-mono px-3', page === pageNum && 'bg-foreground/10 text-foreground')}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  {totalPages > 5 && (
                    <>
                      <span className="px-1 text-muted-foreground">...</span>
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        aria-current={page === totalPages ? 'page' : undefined}
                        className={cn('tabular font-mono px-3', page === totalPages && 'bg-foreground/10 text-foreground')}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <li>
      <Link href={`/dashboard?watch=${item.tmdbId}&type=${item.contentType}`} className="group block">
        <div className="relative aspect-2/3 overflow-hidden rounded-md border border-border bg-surface transition-[border-color] group-hover:border-foreground/40">
          {item.posterPath && (
            <Image
              src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
              alt=""
              fill
              sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-tight">{item.title}</p>
        <p className="tabular mt-0.5 font-mono text-sm text-muted-foreground">
          {item.action.toLowerCase()} · {formattedDate}
        </p>
      </Link>
    </li>
  );
}
