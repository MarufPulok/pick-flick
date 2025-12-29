/**
 * SearchBar Component
 * Search input with real-time autocomplete suggestions
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useSearchSuggestions } from '@/hooks/use-search';
import { Film, Loader2, Search, Tv, User, X } from 'lucide-react';
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
      // For now, just search for the person's name
      router.push(`/search?q=${encodeURIComponent(item.title)}`);
    } else {
      // Navigate to dashboard with watch param
      router.push(`/dashboard?watch=${item.tmdbId}&type=${item.contentType}`);
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
            <ul className="py-1">
              {suggestions.map((item, index) => (
                <li key={`${item.type}-${item.tmdbId}`}>
                  <button
                    onClick={() => handleSuggestionClick(item)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left
                      transition-colors
                      ${index === selectedIndex 
                        ? 'bg-primary/20' 
                        : 'hover:bg-secondary/50'
                      }
                    `}
                  >
                    {/* Poster/Profile */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.posterUrl || item.profileUrl ? (
                        <Image
                          src={item.posterUrl || item.profileUrl!}
                          alt={item.title}
                          width={40}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === 'movie' && <Film className="w-4 h-4 text-muted-foreground" />}
                          {item.type === 'tv' && <Tv className="w-4 h-4 text-muted-foreground" />}
                          {item.type === 'person' && <User className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                    </div>
                  </button>
                </li>
              ))}
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
