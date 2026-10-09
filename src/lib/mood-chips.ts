/**
 * Mood shortcuts for the pick screen. Chips and free text both resolve to
 * TMDB genre ids; an empty result means "use the smart profile".
 */

export interface MoodChip {
  id: string;
  label: string;
  genres: string[];
}

export const MOOD_CHIPS: MoodChip[] = [
  { id: 'light', label: 'Something light', genres: ['35'] },
  { id: 'slow', label: 'Slow burn', genres: ['18', '9648'] },
  { id: 'edge', label: 'Edge of seat', genres: ['53', '28'] },
  { id: 'surprise', label: 'Surprise me', genres: [] },
];

// ponytail: keyword map, not NLP. Swap for the mood-analyze API if it grows a text input.
const KEYWORDS: Array<[RegExp, string[]]> = [
  [/\b(funny|laugh|comedy|light|silly|fun)\b/i, ['35']],
  [/\b(scary|horror|creepy|haunt)\b/i, ['27']],
  [/\b(thrill|tense|suspense|edge)\b/i, ['53']],
  [/\b(action|fight|explos|adrenaline)\b/i, ['28']],
  [/\b(romance|romantic|love|date)\b/i, ['10749']],
  [/\b(drama|cry|sad|slow|quiet|moving)\b/i, ['18']],
  [/\b(mystery|whodunit|twist|detective)\b/i, ['9648']],
  [/\b(sci-?fi|space|future|robot)\b/i, ['878']],
  [/\b(fantasy|magic|dragon)\b/i, ['14']],
  [/\b(crime|heist|gangster|mafia)\b/i, ['80']],
  [/\b(animated|animation|cartoon)\b/i, ['16']],
  [/\b(family|kids|children)\b/i, ['10751']],
  [/\b(doc|documentary|true story|real)\b/i, ['99']],
  [/\b(war|battle|soldier)\b/i, ['10752']],
  [/\b(western|cowboy)\b/i, ['37']],
  [/\b(music|musical|concert)\b/i, ['10402']],
];

export function moodTextToGenres(text: string): string[] {
  const hits = new Set<string>();
  for (const [re, genres] of KEYWORDS) {
    if (re.test(text)) genres.forEach((g) => hits.add(g));
  }
  return [...hits].slice(0, 2);
}
