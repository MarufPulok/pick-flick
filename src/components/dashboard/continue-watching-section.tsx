'use client';

import { ContentType } from '@/dtos/common.dto';
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

  const play = (tmdbId: number, contentType: ContentType, title: string, posterPath: string | null) => {
    const params = new URLSearchParams({ watch: String(tmdbId), type: contentType, title });
    if (posterPath) params.set('poster', posterPath);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <section>
      <h2 className="font-display text-lg font-semibold">Continue watching</h2>
      <ul className="scrollbar-hide mt-4 flex gap-4 overflow-x-auto">
        {shown.map((item) => {
          const removing = removingId === item.id;
          return (
            <li key={item.id} className={cn('group relative w-27.5 shrink-0 sm:w-32.5', removing && 'opacity-50')}>
              <button
                type="button"
                onClick={() => play(item.tmdbId, item.contentType, item.title, item.posterPath)}
                disabled={removing}
                className="block w-full cursor-pointer text-left"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-md border border-border bg-surface transition-[border-color] group-hover:border-foreground/40">
                  {item.posterPath ? (
                    <Image src={`https://image.tmdb.org/t/p/w342${item.posterPath}`} alt="" fill sizes="130px" className="object-cover" />
                  ) : (
                    <span className="font-display absolute inset-0 flex items-end p-2 text-sm font-semibold leading-tight">{item.title}</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-tight">{item.title}</p>
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
