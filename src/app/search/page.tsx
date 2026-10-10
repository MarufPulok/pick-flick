/**
 * Search Page
 * Displays search results with filters and pagination
 */

'use client';

import { SearchBar, SearchResultsGrid } from '@/components/search';
import { useSearch } from '@/hooks/use-search';
import { TrendingSection } from '@/components/dashboard/trending-section';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

const RECENT_KEY = 'recent-searches';
const readRecent = () => storage.get<string[]>(RECENT_KEY) ?? [];

function pushRecent(q: string) {
  const t = q.trim();
  if (t.length < 2) return;
  const next = [t, ...readRecent().filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
  storage.set(RECENT_KEY, next);
}

/**
 * Search Content - Separated for Suspense boundary
 */
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [recent, setRecent] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<('movie' | 'tv' | 'person')[]>([]);

  useEffect(() => {
    pushRecent(initialQuery);
    // localStorage is client-only; read after mount to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(readRecent());
  }, []);

  // Update query when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
      setPage(1);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching } = useSearch(query, {
    page,
    types: filterTypes.length > 0 ? filterTypes : undefined,
    enabled: query.length >= 2,
  });

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
    pushRecent(newQuery);
    setRecent(readRecent());
    router.push(`/search?q=${encodeURIComponent(newQuery)}`, { scroll: false });
  }, [router]);

  const toggleFilter = useCallback((type: 'movie' | 'tv' | 'person') => {
    setFilterTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    setPage(1);
  }, []);

  const results = data?.results ?? [];
  const totalResults = data?.totalResults ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="mx-auto max-w-330 px-4 pb-24 pt-24 transition-opacity duration-300 starting:opacity-0 sm:px-6 lg:px-15">
      <SearchBar
        placeholder="What are you looking for?"
        defaultValue={initialQuery}
        onChange={(newQuery) => {
          setQuery(newQuery);
          setPage(1);
        }}
        onSearch={handleSearch}
        autoFocus
        hotkey
        showAutocomplete={false}
      />

      <div className="mt-4 flex w-fit gap-1 rounded-md border border-border p-1" role="group" aria-label="Filter results">
        {[
          { type: 'movie' as const, label: 'Movies' },
          { type: 'tv' as const, label: 'TV Shows' },
          { type: 'person' as const, label: 'People' },
        ].map(({ type, label }) => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            aria-pressed={filterTypes.includes(type)}
            className={cn(
              'h-7 cursor-pointer rounded-sm px-3 text-xs transition-colors',
              filterTypes.includes(type)
                ? 'bg-foreground/10 text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {query.length < 2 ? (
          <div className="space-y-10">
            {recent.length > 0 && (
              <section aria-label="Recent searches">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-lg font-semibold">Recent</h2>
                  <button
                    onClick={() => { storage.remove(RECENT_KEY); setRecent([]); }}
                    className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <li key={r}>
                      <Link
                        href={`/search?q=${encodeURIComponent(r)}`}
                        className="inline-flex h-8 items-center rounded-full border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {r}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <TrendingSection />
          </div>
        ) : isLoading ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6" aria-busy="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <li key={i}>
                <div className="aspect-2/3 skeleton rounded-md" />
                <div className="mt-2 h-4 skeleton rounded-md" />
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <div>
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">No matches.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing for &ldquo;{query}&rdquo;. Try a different search.
            </p>
          </div>
        ) : (
          <div className="transition-opacity duration-200 aria-busy:opacity-60" aria-busy={isFetching}>
            <p className="tabular mb-4 font-mono text-sm text-muted-foreground">
              {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''}
            </p>

            <SearchResultsGrid results={results} />

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="tabular font-mono text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Search Page with Suspense boundary
 */
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <SearchContent />
    </Suspense>
  );
}
