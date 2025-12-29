/**
 * Search Page
 * Displays search results with filters and pagination
 */

'use client';

import { SearchBar, SearchResultsGrid } from '@/components/search';
import { useSearch } from '@/hooks/use-search';
import { ArrowLeft, Film, Loader2, Search, Tv, User } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-animated px-4 sm:px-6 py-8 pt-20 sm:pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold">Search</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Find movies, TV shows, and people
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
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
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <div className="flex gap-2">
            {[
              { type: 'movie' as const, label: 'Movies', Icon: Film },
              { type: 'tv' as const, label: 'TV Shows', Icon: Tv },
              { type: 'person' as const, label: 'People', Icon: User },
            ].map(({ type, label, Icon }) => (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                  transition-all duration-200
                  ${filterTypes.includes(type)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {query.length < 2 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Start Searching</h2>
            <p className="text-muted-foreground">
              Enter at least 2 characters to search
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-muted-foreground">Searching...</span>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
            <p className="text-muted-foreground">
              No results for &ldquo;{query}&rdquo;. Try a different search.
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                {isFetching && <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />}
              </p>
            </div>

            {/* Results Grid */}
            <SearchResultsGrid results={results} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
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
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
