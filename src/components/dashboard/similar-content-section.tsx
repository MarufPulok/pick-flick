/**
 * SimilarContentSection Component
 * "More like this" rail shown under the pick
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { useSimilar } from '@/hooks/use-similar';
import { Poster } from '@/components/ui/poster';
import Link from 'next/link';

interface SimilarContentSectionProps {
  tmdbId: number;
  contentType: ContentType;
  currentTitle: string;
}

export function SimilarContentSection({ tmdbId, contentType }: SimilarContentSectionProps) {
  const { data, isLoading } = useSimilar(tmdbId, contentType, {
    limit: 8,
    excludeIds: [tmdbId],
  });

  const items = data?.items ?? [];

  if (!isLoading && items.length === 0) return null;

  return (
    <div className="mt-8" aria-busy={isLoading}>
      <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">More like this</h2>
      <div className="rail scrollbar-hide mt-4 flex gap-4 overflow-x-auto">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="w-36 shrink-0">
                <div className="aspect-2/3 rounded-md bg-foreground/10" />
                <div className="mt-2 h-4 w-24 rounded-sm bg-foreground/10" />
              </div>
            ))
          : items.map((item) => {
              const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
              return (
                <Link
                  key={item.tmdbId}
                  href={`/dashboard?watch=${item.tmdbId}&type=${item.contentType}&title=${encodeURIComponent(item.title)}${item.posterPath ? `&poster=${encodeURIComponent(item.posterPath)}` : ''}`}
                  className="group w-36 shrink-0"
                >
                  <Poster src={item.posterUrl} sizes="144px" className="transition-[border-color] group-hover:border-foreground/40" />
                  <p className="mt-2 line-clamp-2 text-sm leading-tight">{item.title}</p>
                  {year && <p className="tabular font-mono text-sm text-muted-foreground">{year}</p>}
                </Link>
              );
            })}
      </div>
    </div>
  );
}
