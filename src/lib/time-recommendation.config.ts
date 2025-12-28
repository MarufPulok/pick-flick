/**
 * Time-Based Recommendation Configuration
 * Maps time periods and contexts to preferred genres and content types
 */

import { ContentType } from '@/dtos/common.dto';
import { DayType, TimeOfDay } from './time-context';

/**
 * Genre IDs from TMDB
 * @see https://developers.themoviedb.org/3/genres/get-movie-list
 */
export const TMDB_GENRES = {
  // Movies
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  TV_MOVIE: 10770,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
  // TV
  ACTION_ADVENTURE_TV: 10759,
  KIDS_TV: 10762,
  NEWS: 10763,
  REALITY: 10764,
  SCIFI_FANTASY_TV: 10765,
  SOAP: 10766,
  TALK: 10767,
  WAR_POLITICS_TV: 10768,
} as const;

/**
 * Time-based recommendation preset
 */
export interface TimeRecommendationPreset {
  name: string;
  description: string;
  genres: number[];
  contentTypes: ContentType[];
  minRating?: number;
  mood: string;
}

/**
 * Presets for each time of day
 */
export const TIME_PRESETS: Record<TimeOfDay, TimeRecommendationPreset> = {
  morning: {
    name: 'Morning Boost',
    description: 'Light, uplifting content to start your day',
    genres: [
      TMDB_GENRES.COMEDY,
      TMDB_GENRES.FAMILY,
      TMDB_GENRES.ANIMATION,
      TMDB_GENRES.DOCUMENTARY,
    ],
    contentTypes: ['MOVIE', 'SERIES'],
    minRating: 6.5,
    mood: 'uplifting',
  },
  afternoon: {
    name: 'Midday Mix',
    description: 'Engaging content for your break',
    genres: [
      TMDB_GENRES.ACTION,
      TMDB_GENRES.ADVENTURE,
      TMDB_GENRES.COMEDY,
      TMDB_GENRES.SCIENCE_FICTION,
    ],
    contentTypes: ['MOVIE', 'SERIES', 'ANIME'],
    minRating: 6.0,
    mood: 'engaging',
  },
  evening: {
    name: 'Evening Entertainment',
    description: 'Prime time viewing for winding down',
    genres: [
      TMDB_GENRES.DRAMA,
      TMDB_GENRES.THRILLER,
      TMDB_GENRES.CRIME,
      TMDB_GENRES.MYSTERY,
      TMDB_GENRES.ROMANCE,
    ],
    contentTypes: ['MOVIE', 'SERIES'],
    minRating: 7.0,
    mood: 'immersive',
  },
  night: {
    name: 'Night Cinema',
    description: 'Deeper, more intense viewing experiences',
    genres: [
      TMDB_GENRES.THRILLER,
      TMDB_GENRES.HORROR,
      TMDB_GENRES.MYSTERY,
      TMDB_GENRES.CRIME,
      TMDB_GENRES.SCIENCE_FICTION,
    ],
    contentTypes: ['MOVIE', 'SERIES', 'ANIME'],
    minRating: 7.0,
    mood: 'intense',
  },
  late_night: {
    name: 'Night Owl Picks',
    description: 'For the true night owls',
    genres: [
      TMDB_GENRES.HORROR,
      TMDB_GENRES.THRILLER,
      TMDB_GENRES.SCIENCE_FICTION,
      TMDB_GENRES.DOCUMENTARY,
    ],
    contentTypes: ['MOVIE', 'ANIME'],
    minRating: 6.5,
    mood: 'contemplative',
  },
};

/**
 * Weekend overrides - more relaxed viewing
 */
export const WEEKEND_PRESETS: Partial<Record<TimeOfDay, TimeRecommendationPreset>> = {
  morning: {
    name: 'Lazy Weekend Morning',
    description: 'Relaxed start to your weekend',
    genres: [
      TMDB_GENRES.COMEDY,
      TMDB_GENRES.FAMILY,
      TMDB_GENRES.ANIMATION,
      TMDB_GENRES.ROMANCE,
    ],
    contentTypes: ['MOVIE', 'SERIES', 'ANIME'],
    minRating: 6.0,
    mood: 'relaxed',
  },
  afternoon: {
    name: 'Weekend Adventure',
    description: 'Action-packed weekend viewing',
    genres: [
      TMDB_GENRES.ACTION,
      TMDB_GENRES.ADVENTURE,
      TMDB_GENRES.FANTASY,
      TMDB_GENRES.SCIENCE_FICTION,
    ],
    contentTypes: ['MOVIE', 'ANIME'],
    minRating: 6.5,
    mood: 'adventurous',
  },
  evening: {
    name: 'Weekend Movie Night',
    description: 'Perfect for a movie marathon',
    genres: [
      TMDB_GENRES.ACTION,
      TMDB_GENRES.THRILLER,
      TMDB_GENRES.SCIENCE_FICTION,
      TMDB_GENRES.FANTASY,
    ],
    contentTypes: ['MOVIE', 'SERIES'],
    minRating: 7.0,
    mood: 'epic',
  },
};

/**
 * Friday night special - party/social vibes
 */
export const FRIDAY_NIGHT_PRESET: TimeRecommendationPreset = {
  name: 'TGIF Picks',
  description: 'Start your weekend right!',
  genres: [
    TMDB_GENRES.COMEDY,
    TMDB_GENRES.ACTION,
    TMDB_GENRES.ADVENTURE,
    TMDB_GENRES.MUSIC,
  ],
  contentTypes: ['MOVIE', 'SERIES'],
  minRating: 6.5,
  mood: 'celebratory',
};

/**
 * Get the appropriate preset based on time context
 */
export function getTimeBasedPreset(
  timeOfDay: TimeOfDay,
  dayType: DayType
): TimeRecommendationPreset {
  if (dayType === 'friday_night') {
    return FRIDAY_NIGHT_PRESET;
  }
  
  if (dayType === 'weekend' && WEEKEND_PRESETS[timeOfDay]) {
    return WEEKEND_PRESETS[timeOfDay]!;
  }
  
  return TIME_PRESETS[timeOfDay];
}

/**
 * Get genre IDs as comma-separated string for TMDB API
 */
export function getGenresString(genres: number[]): string {
  return genres.join(',');
}
