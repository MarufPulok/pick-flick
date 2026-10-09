'use client';

import { CONTENT_TYPES } from '@/config/app.config';
import { cn } from '@/lib/utils';

type ContentType = 'MOVIE' | 'SERIES' | 'ANIME';

const LABELS = { MOVIE: 'Movies', SERIES: 'TV Series', ANIME: 'Anime' } as const;

interface ContentTypeStepProps {
  selected: ContentType[];
  onToggle: (type: ContentType) => void;
}

export function ContentTypeStep({ selected, onToggle }: ContentTypeStepProps) {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">What do you watch?</h1>
      <p className="mt-2 text-muted-foreground">Pick all that apply.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={selected.includes(type)}
            onClick={() => onToggle(type)}
            className={cn(
              'h-12 cursor-pointer rounded-full border px-6 text-base transition-colors',
              selected.includes(type)
                ? 'border-accent bg-accent font-medium text-accent-foreground'
                : 'border-border hover:bg-foreground/[0.06]'
            )}
          >
            {LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
