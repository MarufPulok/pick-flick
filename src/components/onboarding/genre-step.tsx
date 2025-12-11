/**
 * GenreStep Component
 * Step 2: Select favorite genres
 * Single Responsibility: Only handles genre selection
 */

'use client';

import { ANIME_GENRES, GENRES } from '@/config/app.config';

type ContentType = 'MOVIE' | 'SERIES' | 'ANIME';

interface GenreStepProps {
  contentTypes: ContentType[];
  selected: string[];
  onToggle: (genreId: string) => void;
}

export function GenreStep({ contentTypes, selected, onToggle }: GenreStepProps) {
  // Get relevant genres based on selected content types
  const hasAnime = contentTypes.includes('ANIME');
  const hasMovieOrSeries = contentTypes.includes('MOVIE') || contentTypes.includes('SERIES');

  const relevantGenres =
    hasAnime && hasMovieOrSeries
      ? [...Object.values(GENRES), ...Object.values(ANIME_GENRES)]
      : hasAnime
      ? Object.values(ANIME_GENRES)
      : Object.values(GENRES);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pick your favorites</h2>
        <p className="text-muted-foreground">
          Choose at least 3 genres you love
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {relevantGenres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onToggle(String(genre.id))}
            className={`px-4 py-3 rounded-lg border transition-all ${
              selected.includes(String(genre.id))
                ? 'border-primary bg-primary/10 font-medium'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="mr-2">{genre.icon}</span>
            {genre.name}
          </button>
        ))}
      </div>

      {selected.length > 0 && selected.length < 3 && (
        <p className="text-sm text-muted-foreground text-center">
          {3 - selected.length} more to go!
        </p>
      )}
    </div>
  );
}
