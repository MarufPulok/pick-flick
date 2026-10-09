'use client';

import { useContinueWatching, useRemoveFromContinue } from '@/hooks/use-continue-watching';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ContinueWatchingSection() {
  const router = useRouter();
  const { items, isLoading } = useContinueWatching();
  const remove = useRemoveFromContinue();
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Records written without a real title carry nothing worth resuming.
  const shown = items.filter((i) => i.title && !/^(unknown title|untitled)$/i.test(i.title));
  if (isLoading || shown.length === 0) return null;

  const play = (item: (typeof items)[number]) => {
    const params = new URLSearchParams({ watch: String(item.tmdbId), type: item.contentType, title: item.title });
    if (item.posterPath) params.set('poster', item.posterPath);
    if (item.season && item.episode) {
      params.set('s', String(item.season));
      params.set('e', String(item.episode));
    }
    // Resume a few seconds back; skip when essentially finished so replay starts clean.
    const pct = item.durationSeconds ? item.positionSeconds / item.durationSeconds : 0;
    if (item.positionSeconds > 30 && pct < 0.95) params.set('t', String(Math.max(0, Math.floor(item.positionSeconds) - 5)));
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <section>
      <h2 className="font-display text-lg font-semibold">Continue watching</h2>
      <ul className="scrollbar-hide mt-4 flex gap-4 overflow-x-auto">
        {shown.map((item) => {
          const removing = removingId === item.id;
          const pct = item.durationSeconds ? Math.min(100, Math.round((item.positionSeconds / item.durationSeconds) * 100)) : 0;
          const label = item.contentType !== 'MOVIE' && item.season && item.episode ? `S${item.season} E${item.episode}` : null;
          return (
            <li key={item.id} className={cn('group relative w-27.5 shrink-0 sm:w-32.5', removing && 'opacity-50')}>
              <button
                type="button"
                onClick={() => play(item)}
                disabled={removing}
                className="block w-full cursor-pointer text-left"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-md border border-border bg-surface transition-[border-color] group-hover:border-foreground/40">
                  {item.posterPath ? (
                    <Image src={`https://image.tmdb.org/t/p/w342${item.posterPath}`} alt="" fill sizes="130px" className="object-cover" />
                  ) : (
                    <span className="font-display absolute inset-0 flex items-end p-2 text-sm font-semibold leading-tight">{item.title}</span>
                  )}
                  {pct > 0 && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-background/60" aria-hidden>
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-tight">{item.title}</p>
                {label && <p className="text-xs text-muted-foreground">{label}</p>}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setRemovingId(item.id);
                  try {
                    await remove.mutateAsync({ tmdbId: item.tmdbId, contentType: item.contentType });
                  } finally {
                    setRemovingId(null);
                  }
                }}
                disabled={removing}
                aria-label={`Remove ${item.title} from continue watching`}
                className="absolute right-1.5 top-1.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-3.5" strokeWidth={1.5} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
