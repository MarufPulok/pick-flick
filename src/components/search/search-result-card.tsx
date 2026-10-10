/**
 * SearchResultCard Component
 * Poster tile for a search result (circular name-only tile for people)
 */

"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { ContentType } from "@/dtos/common.dto";
import { useHistoryActions } from "@/hooks/use-history-actions";
import { useIsInWatchlist, useWatchlist } from "@/hooks/use-watchlist";
import { cn } from "@/lib/utils";
import { Check, Eye, Play, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
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

function AuthedActions({ result, contentType }: { result: SearchResultItem; contentType: ContentType }) {
  const { addToWatchlist, isPending } = useWatchlist();
  const { recordAction, isRecording: recording } = useHistoryActions();
  const saved = useIsInWatchlist(result.tmdbId, contentType);
  const payload = {
    tmdbId: result.tmdbId,
    contentType,
    title: result.title,
    posterPath: result.posterUrl ?? undefined,
    rating: result.rating || undefined,
    releaseDate: result.releaseDate ?? undefined,
  };

  return (
    <>
      <Button
        variant="ghost"
        size="none"
        className="h-8 flex-1 px-2 text-xs"
        disabled={saved || isPending}
        onClick={() => addToWatchlist(payload)}
      >
        {saved ? <Check className="size-3.5" strokeWidth={1.5} /> : <Plus className="size-3.5" strokeWidth={1.5} />}
        {saved ? "In watchlist" : "Watchlist"}
      </Button>
      <Button
        variant="ghost"
        size="none"
        className="h-8 px-2 text-xs"
        disabled={recording}
        onClick={() => recordAction({ ...payload, action: "WATCHED", genreIds: result.genreIds })}
      >
        <Eye className="size-3.5" strokeWidth={1.5} />
        Seen
      </Button>
    </>
  );
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const { status } = useSession();
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

  const href = `/dashboard?watch=${result.tmdbId}&type=${result.contentType}&title=${encodeURIComponent(result.title)}${posterPath ? `&poster=${encodeURIComponent(posterPath)}` : ""}`;

  return (
    <div className="group">
      <Link href={href} className="block">
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
      {/* Hidden until hover/focus on pointer devices; always visible on touch */}
      <div className="mt-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <Link href={href} className={cn(buttonVariants({ variant: "ghost", size: "none" }), "h-8 px-2 text-xs")}>
          <Play className="size-3.5" strokeWidth={1.5} />
          Play
        </Link>
        {status === "authenticated" && result.contentType && (
          <AuthedActions result={result} contentType={result.contentType} />
        )}
      </div>
    </div>
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
