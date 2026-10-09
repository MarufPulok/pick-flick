/**
 * SearchBar Component
 * Search input with real-time autocomplete suggestions and inline streaming buttons
 */

"use client";

import { ContentType } from "@/dtos/common.dto";
import { useSearchSuggestions } from "@/hooks/use-search";
import { Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchResultItem {
  tmdbId: number;
  title: string;
  type: "movie" | "tv" | "person";
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
  placeholder = "Search movies, shows, people...",
  onSearch,
  onChange,
  defaultValue = "",
  autoFocus = false,
  className = "",
  showAutocomplete = true,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useSearchSuggestions(
    query,
    isFocused && showAutocomplete,
  );
  const showSuggestionsDropdown =
    showAutocomplete &&
    isFocused &&
    query.length >= 2 &&
    (suggestions?.length || isLoading);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestionsDropdown || !suggestions?.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionClick(suggestions[selectedIndex]);
          } else if (query.trim()) {
            handleSearch();
          }
          break;
        case "Escape":
          setIsFocused(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showSuggestionsDropdown, suggestions, selectedIndex, query],
  );

  // Handle search submit
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch?.(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    }
  }, [query, onSearch, router]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (item: SearchResultItem) => {
      if (!item) return;

      if (item.type === "person") {
        router.push(`/search?q=${encodeURIComponent(item.title)}`);
      } else {
        // Extract poster path from full URL if available (path includes leading slash)
        const posterFile =
          item.posterUrl?.split("/t/p/")[1]?.split("/")[1] || null;
        const posterPath = posterFile ? `/${posterFile}` : null;

        const params = new URLSearchParams({
          watch: item.tmdbId.toString(),
          type: item.contentType || "MOVIE",
          title: item.title,
        });
        if (posterPath) {
          params.set("poster", posterPath);
        }
        router.push(`/dashboard?${params.toString()}`);
      }
      setQuery("");
      setIsFocused(false);
    },
    [router],
  );

  // Clear search
  const handleClear = useCallback(() => {
    setQuery("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full max-w-155 ${className}`}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
        />
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
          aria-busy={isLoading}
          className="h-12 w-full rounded-md border border-border bg-transparent pl-12 pr-12 text-foreground placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/35"
        />
        {query && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && (
        <div className="absolute left-0 right-0 top-full z-100 mt-2 overflow-hidden rounded-md border border-border bg-surface">
          {isLoading ? (
            <div className="space-y-2 p-2" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-15 rounded-md bg-foreground/10" />
              ))}
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <ul className="max-h-112 overflow-y-auto">
              {suggestions.map((item, index) => {
                const year = item.releaseDate
                  ? new Date(item.releaseDate).getFullYear()
                  : null;
                const thumb = item.posterUrl || item.profileUrl;
                return (
                  <li key={`${item.type}-${item.tmdbId}`}>
                    <button
                      onClick={() => handleSuggestionClick(item)}
                      className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors ${index === selectedIndex ? "bg-foreground/10" : "hover:bg-foreground/[0.06]"}`}
                    >
                      <span className="relative block h-15 w-10 shrink-0 overflow-hidden rounded-sm border border-border bg-background">
                        {thumb && (
                          <Image
                            src={thumb}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{item.title}</span>
                        <span className="tabular block font-mono text-xs text-muted-foreground">
                          {item.type === "person" ? "Person" : (year ?? "")}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : query.length >= 2 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : null}

          {/* Search All Option */}
          {query.trim().length >= 2 && (
            <button
              onClick={handleSearch}
              className="flex h-11 w-full cursor-pointer items-center gap-2 border-t border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="size-4" strokeWidth={1.5} />
              Search all for &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
