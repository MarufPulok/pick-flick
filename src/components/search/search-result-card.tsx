/**
 * SearchResultCard Component
 * Poster tile for a search result (circular name-only tile for people)
 */

"use client";

import { ContentType } from "@/dtos/common.dto";
import Image from "next/image";
import Link from "next/link";

interface SearchResultItem {
  tmdbId: number;
  title: string;
  type: "movie" | "tv" | "person";
  contentType: ContentType | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  releaseDate: string | null;
  overview: string | null;
  genreIds: number[];
  popularity: number;
  profileUrl?: string | null;
  knownFor?: string[];
}

interface SearchResultCardProps {
  result: SearchResultItem;
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const year = result.releaseDate
    ? new Date(result.releaseDate).getFullYear()
    : null;

  // Extract poster path from full URL if available (path includes leading slash)
  const posterFile = result.posterUrl?.split("/t/p/")[1]?.split("/")[1] || null;
  const posterPath = posterFile ? `/${posterFile}` : null;

  if (result.type === "person") {
    return (
      <Link
        href={`/search?q=${encodeURIComponent(result.title)}`}
        className="group block"
      >
        <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full border border-border bg-surface transition-[border-color] group-hover:border-foreground/40">
          {result.profileUrl && (
            <Image
              src={result.profileUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 160px, (min-width: 640px) 25vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-center text-sm leading-tight">
          {result.title}
        </p>
      </Link>
    );
  }

  const meta = [year, result.rating > 0 ? result.rating.toFixed(1) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/dashboard?watch=${result.tmdbId}&type=${result.contentType}&title=${encodeURIComponent(result.title)}${posterPath ? `&poster=${encodeURIComponent(posterPath)}` : ""}`}
      className="group block"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-md border border-border bg-surface transition-[border-color] group-hover:border-foreground/40">
        {result.posterUrl && (
          <Image
            src={result.posterUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 160px, (min-width: 640px) 25vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-tight">{result.title}</p>
      {meta && (
        <p className="tabular mt-0.5 font-mono text-xs text-muted-foreground">
          {meta}
        </p>
      )}
    </Link>
  );
}

/**
 * Search Results Grid
 */
interface SearchResultsGridProps {
  results: SearchResultItem[];
}

export function SearchResultsGrid({ results }: SearchResultsGridProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {results.map((result) => (
        <li key={`${result.type}-${result.tmdbId}`}>
          <SearchResultCard result={result} />
        </li>
      ))}
    </ul>
  );
}
