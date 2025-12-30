/**
 * SearchBar Component
 * Search input with real-time autocomplete suggestions and inline streaming buttons
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useSearchSuggestions } from '@/hooks/use-search';
import { getFreeStreamingOptions } from '@/lib/free-streaming';
import { ExternalLink, Film, Loader2, Search, Tv, User, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchResultItem {
  tmdbId: number;
  title: string;
  type: 'movie' | 'tv' | 'person';
  contentType: ContentType | null;
  posterUrl: string | null;
  releaseDate: string | null;
  rating: number;
  profileUrl?: string | null;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (query: string) => void;
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
  showAutocomplete?: boolean;
}

export function SearchBar({
  placeholder = 'Search movies, shows, people...',
  onSearch,
  onChange,
  defaultValue = '',
  autoFocus = false,
  className = '',
  showAutocomplete = true,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useSearchSuggestions(query, isFocused && showAutocomplete);
  const showSuggestionsDropdown = showAutocomplete && isFocused && query.length >= 2 && (suggestions?.length || isLoading);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestionsDropdown || !suggestions?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsFocused(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestionsDropdown, suggestions, selectedIndex, query]);

  // Handle search submit
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch?.(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    }
  }, [query, onSearch, router]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((item: SearchResultItem) => {
    if (!item) return;
    
    if (item.type === 'person') {
      router.push(`/search?q=${encodeURIComponent(item.title)}`);
    } else {
      // Extract poster path from full URL if available (path includes leading slash)
      const posterFile = item.posterUrl?.split('/t/p/')[1]?.split('/')[1] || null;
      const posterPath = posterFile ? `/${posterFile}` : null;
      
      const params = new URLSearchParams({
        watch: item.tmdbId.toString(),
        type: item.contentType || 'MOVIE',
        title: item.title,
      });
      if (posterPath) {
        params.set('poster', posterPath);
      }
      router.push(`/dashboard?${params.toString()}`);
    }
    setQuery('');
    setIsFocused(false);
  }, [router]);

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`
        relative flex items-center gap-2 px-4 py-3 rounded-xl
        bg-secondary/50 border transition-all duration-200
        ${isFocused 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'border-border hover:border-muted-foreground/50'
        }
      `}>
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            setSelectedIndex(-1);
            onChange?.(newValue);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <button
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100]
                        glass rounded-xl border border-border shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <ul className="py-1 max-h-[450px] overflow-y-auto">
              {suggestions.map((item, index) => {
                // Get streaming services for this item
                const streamingServices = item.type !== 'person' && item.contentType
                  ? getFreeStreamingOptions(item.title, item.contentType).slice(0, 3)
                  : [];

                return (
                  <li key={`${item.type}-${item.tmdbId}`} className="border-b border-border/30 last:border-b-0">
                    <div
                      className={`
                        px-4 py-3 transition-colors
                        ${index === selectedIndex ? 'bg-primary/20' : 'hover:bg-secondary/50'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Poster/Profile */}
                        <button
                          onClick={() => handleSuggestionClick(item)}
                          className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                        >
                          {item.posterUrl || item.profileUrl ? (
                            <Image
                              src={item.posterUrl || item.profileUrl!}
                              alt={item.title}
                              width={48}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {item.type === 'movie' && <Film className="w-5 h-5 text-muted-foreground" />}
                              {item.type === 'tv' && <Tv className="w-5 h-5 text-muted-foreground" />}
                              {item.type === 'person' && <User className="w-5 h-5 text-muted-foreground" />}
                            </div>
                          )}
                        </button>

                        {/* Info */}
                        <button
                          onClick={() => handleSuggestionClick(item)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="capitalize">{item.type}</span>
                            {item.releaseDate && (
                              <>
                                <span>•</span>
                                <span>{new Date(item.releaseDate).getFullYear()}</span>
                              </>
                            )}
                            {item.rating > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-yellow-500">★ {item.rating.toFixed(1)}</span>
                              </>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Inline Streaming Buttons */}
                      {streamingServices.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 ml-15 pl-15">
                          <span className="text-[10px] text-green-400 font-medium ml-[60px]">🆓</span>
                          {streamingServices.map((service) => (
                            <a
                              key={service.id}
                              href={service.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 px-2 py-1 rounded-md
                                         bg-green-600/20 hover:bg-green-600/40 text-green-400
                                         text-[11px] font-medium transition-colors"
                            >
                              {service.name}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : query.length >= 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : null}

          {/* Search All Option */}
          {query.trim().length >= 2 && (
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                         bg-secondary/30 hover:bg-secondary/50 transition-colors
                         text-sm font-medium border-t border-border"
            >
              <Search className="w-4 h-4" />
              Search all for &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
