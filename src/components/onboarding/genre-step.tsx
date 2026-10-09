'use client';

import { ANIME_GENRES, GENRES } from '@/config/app.config';
import { cn } from '@/lib/utils';

type ContentType = 'MOVIE' | 'SERIES' | 'ANIME';

interface GenreStepProps {
  contentTypes: ContentType[];
  selected: string[];
  onToggle: (genreId: string) => void;
}

export function GenreStep({ contentTypes, selected, onToggle }: GenreStepProps) {
  const hasAnime = contentTypes.includes('ANIME');
  const hasMovieOrSeries = contentTypes.includes('MOVIE') || contentTypes.includes('SERIES');

  const relevantGenres =
    hasAnime && hasMovieOrSeries
      ? [...Object.values(GENRES), ...Object.values(ANIME_GENRES)]
      : hasAnime
      ? Object.values(ANIME_GENRES)
      : Object.values(GENRES);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Which genres?</h1>
      <p className="mt-2 text-muted-foreground">
        {selected.length >= 3 ? `${selected.length} chosen.` : `Choose at least 3. ${3 - selected.length} to go.`}
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {relevantGenres.map((genre) => {
          const on = selected.includes(String(genre.id));
          return (
            <button
              key={genre.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(String(genre.id))}
              className={cn(
                'h-10 cursor-pointer rounded-full border px-4 text-sm transition-colors',
                on ? 'border-accent bg-accent font-medium text-accent-foreground' : 'border-border hover:bg-foreground/[0.06]'
              )}
            >
              {genre.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
