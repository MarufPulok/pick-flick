'use client';

import { Poster } from '@/components/ui/poster';
import { useFeed } from '@/hooks/use-feed';
import Link from 'next/link';

/** excludeId: `${contentType}:${tmdbId}` of the current hero, so it isn't repeated in the rail. */
export function ForYouSection({ excludeId }: { excludeId?: string }) {
  const { data, isLoading, error } = useFeed();
  const items = (data?.items ?? []).filter((i) => `${i.contentType}:${i.tmdbId}` !== excludeId);

  if (error || (!isLoading && items.length === 0)) return null;

  return (
    <section>
      <h2 className="font-display text-lg font-semibold">For you</h2>
      <ul className="rail scrollbar-hide mt-4 flex gap-4 overflow-x-auto" aria-busy={isLoading}>
        {(isLoading ? Array.from({ length: 8 }, () => null) : items).map((item, i) => (
          <li key={item ? `${item.contentType}:${item.tmdbId}` : i} className="w-27.5 shrink-0 sm:w-32.5">
            {item ? (
              <Link
                href={`/dashboard?watch=${item.tmdbId}&type=${item.contentType}&title=${encodeURIComponent(item.title)}${item.posterPath ? `&poster=${encodeURIComponent(item.posterPath)}` : ''}`}
                className="group block"
              >
                <Poster src={item.posterUrl} sizes="130px" className="transition-[border-color] group-hover:border-foreground/40" />
                <p className="mt-2 line-clamp-2 text-sm leading-tight">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.why}</p>
              </Link>
            ) : (
              <>
                <div className="aspect-2/3 rounded-md bg-foreground/10" />
                <div className="mt-2 h-4 w-24 rounded-sm bg-foreground/10" />
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
