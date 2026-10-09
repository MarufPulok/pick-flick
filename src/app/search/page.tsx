/**
 * Search Page
 * Displays search results with filters and pagination
 */

'use client';

import { SearchBar, SearchResultsGrid } from '@/components/search';
import { useSearch } from '@/hooks/use-search';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

/**
 * Search Content - Separated for Suspense boundary
 */
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [filterTypes, setFilterTypes] = useState<('movie' | 'tv' | 'person')[]>([]);

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
    <div className="mx-auto max-w-330 px-4 pb-24 pt-24 sm:px-6 lg:px-15">
      <SearchBar
        placeholder="What are you looking for?"
        defaultValue={initialQuery}
        onChange={(newQuery) => {
          setQuery(newQuery);
          setPage(1);
        }}
        onSearch={handleSearch}
        autoFocus
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
          <p className="text-sm text-muted-foreground">Search for a title, a show, or a person.</p>
        ) : isLoading ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6" aria-busy="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <li key={i}>
                <div className="aspect-2/3 rounded-md bg-foreground/10" />
                <div className="mt-2 h-4 rounded-md bg-foreground/10" />
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
          <div aria-busy={isFetching}>
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
