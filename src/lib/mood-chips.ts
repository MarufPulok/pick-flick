/**
 * Mood chips for the pick screen. Every chip resolves to TMDB genre ids (and
 * optionally languages) that ride on top of the taste profile; empty genres
 * means "use the smart profile". The server builds the row per user and hour.
 */

import { GENRE_NAMES, LANGUAGE_NAMES } from '@/config/genre-names';

export interface MoodChip {
  id: string;
  label: string;
  genres: string[];
  languages?: string[];
}

export const BASE_CHIPS: MoodChip[] = [
  { id: 'light', label: 'Something light', genres: ['35'] },
  { id: 'slow', label: 'Slow burn', genres: ['18', '9648'] },
  { id: 'edge', label: 'Edge of seat', genres: ['53', '28'] },
];

export const SURPRISE_CHIP: MoodChip = { id: 'surprise', label: 'Surprise me', genres: [] };

/** One chip for the hour; late nights get short and gripping, mornings get easy. */
const TIME_CHIPS: Array<{ when: (hour: number, day: number) => boolean; chip: MoodChip }> = [
  { when: (h, d) => d === 5 && h >= 17, chip: { id: 'friday', label: 'Friday night', genres: ['28', '35'] } },
  { when: (h) => h >= 23 || h < 5, chip: { id: 'late', label: 'Short & gripping', genres: ['53', '27'] } },
  { when: (h) => h >= 5 && h < 12, chip: { id: 'morning', label: 'Easy watch', genres: ['35', '10751'] } },
  { when: (h, d) => (d === 0 || d === 6) && h >= 12 && h < 17, chip: { id: 'weekend', label: 'Weekend epic', genres: ['12', '14'] } },
];

/**
 * Build the row: base moods, the hour's chip, up to two learned chips from the
 * strongest genre and language the user has taught us, then Surprise me.
 */
export function buildMoodChips(opts: {
  hour: number;
  day: number;
  genreWeights?: Record<string, number>;
  languageWeights?: Record<string, number>;
  /** Day counter for the rotation; defaults to today. */
  seed?: number;
}): MoodChip[] {
  const chips: MoodChip[] = [...BASE_CHIPS];
  const timeChip = TIME_CHIPS.find((t) => t.when(opts.hour, opts.day))?.chip;
  if (timeChip) chips.push(timeChip);

  // Learned chips: only tastes the user has confirmed a few times (60 = three
  // positive signals from neutral), rotating daily through the top three so the
  // row does not print the same chip every night.
  const dayIndex = opts.seed ?? Math.floor(Date.now() / 86_400_000);
  const rotate = (weights: Record<string, number> | undefined, names: Record<string, string>) => {
    const ranked = Object.entries(weights ?? {})
      .filter(([k, w]) => w >= 60 && names[k])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return ranked.length ? ranked[dayIndex % ranked.length][0] : undefined;
  };

  const genre = rotate(opts.genreWeights, GENRE_NAMES);
  const language = rotate(opts.languageWeights, LANGUAGE_NAMES);
  const used = new Set(chips.flatMap((c) => c.genres));
  if (genre && !used.has(genre)) chips.push({ id: `genre-${genre}`, label: `More ${GENRE_NAMES[genre]}`, genres: [genre] });
  if (language && language !== 'en') {
    chips.push({ id: `lang-${language}`, label: `${LANGUAGE_NAMES[language]} night`, genres: [], languages: [language] });
  }

  chips.push(SURPRISE_CHIP);
  return chips;
}
