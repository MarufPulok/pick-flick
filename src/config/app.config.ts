/**
 * PickFlick Application Configuration
 * App-wide constants and settings
 */

export const APP_CONFIG = {
  APP_NAME: 'PickFlick',
  APP_DESCRIPTION: 'One Click. One Pick. No Paralysis.',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Onboarding Constraints
  MIN_GENRES_REQUIRED: 3,
  MIN_LANGUAGES_REQUIRED: 1,
  
  // History Constraints (Free tier optimization)
  MAX_HISTORY_ITEMS: 50,
  
  // Recommendation Settings
  MAX_CANDIDATES_TO_FETCH: 40,
  TOP_RESULTS_TO_PICK_FROM: 20,
} as const;

/**
 * Content Types
 */
export const CONTENT_TYPES = ['MOVIE', 'SERIES', 'ANIME'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/**
 * Recommendation Modes
 */
export const RECOMMENDATION_MODES = ['FILTERED', 'SMART'] as const;
export type RecommendationMode = (typeof RECOMMENDATION_MODES)[number];

/**
 * Feedback Types
 */
export const FEEDBACK_TYPES = ['LIKE', 'UNLIKE'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/**
 * Genre Definitions with TMDB IDs
 * Used for both display and API queries
 */
export const GENRES = {
  // Movies & Series
  ACTION: { id: 28, name: 'Action', icon: '💥' },
  ADVENTURE: { id: 12, name: 'Adventure', icon: '🗺️' },
  ANIMATION: { id: 16, name: 'Animation', icon: '🎨' },
  COMEDY: { id: 35, name: 'Comedy', icon: '😂' },
  CRIME: { id: 80, name: 'Crime', icon: '🔍' },
  DOCUMENTARY: { id: 99, name: 'Documentary', icon: '📹' },
  DRAMA: { id: 18, name: 'Drama', icon: '🎭' },
  FAMILY: { id: 10751, name: 'Family', icon: '👨‍👩‍👧‍👦' },
  FANTASY: { id: 14, name: 'Fantasy', icon: '🧙' },
  HISTORY: { id: 36, name: 'History', icon: '📜' },
  HORROR: { id: 27, name: 'Horror', icon: '👻' },
  MUSIC: { id: 10402, name: 'Music', icon: '🎵' },
  MYSTERY: { id: 9648, name: 'Mystery', icon: '🕵️' },
  ROMANCE: { id: 10749, name: 'Romance', icon: '💕' },
  SCIENCE_FICTION: { id: 878, name: 'Sci-Fi', icon: '🚀' },
  THRILLER: { id: 53, name: 'Thriller', icon: '😰' },
  WAR: { id: 10752, name: 'War', icon: '⚔️' },
  WESTERN: { id: 37, name: 'Western', icon: '🤠' },
} as const;

export type GenreKey = keyof typeof GENRES;

/**
 * Anime-specific genres (MAL/Anilist mapping)
 */
export const ANIME_GENRES = {
  SHONEN: { id: 'shonen', name: 'Shōnen', icon: '⚡' },
  SHOJO: { id: 'shojo', name: 'Shōjo', icon: '🌸' },
  SEINEN: { id: 'seinen', name: 'Seinen', icon: '🎯' },
  JOSEI: { id: 'josei', name: 'Josei', icon: '💄' },
  ISEKAI: { id: 'isekai', name: 'Isekai', icon: '🌀' },
  MECHA: { id: 'mecha', name: 'Mecha', icon: '🤖' },
  SLICE_OF_LIFE: { id: 'slice-of-life', name: 'Slice of Life', icon: '☕' },
  SPORTS: { id: 'sports', name: 'Sports', icon: '⚽' },
} as const;

export type AnimeGenreKey = keyof typeof ANIME_GENRES;

/**
 * Language Options
 */
export const LANGUAGES = {
  EN: { code: 'en', name: 'English', flag: '🇺🇸' },
  BN: { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  HI: { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  KO: { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  JA: { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  ES: { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  FR: { code: 'fr', name: 'French', flag: '🇫🇷' },
  DE: { code: 'de', name: 'German', flag: '🇩🇪' },
  ZH: { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  PT: { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  IT: { code: 'it', name: 'Italian', flag: '🇮🇹' },
  TH: { code: 'th', name: 'Thai', flag: '🇹🇭' },
  TR: { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

/**
 * Rating Tiers for filtering
 */
export const RATING_TIERS = {
  ANY: { min: 0, label: 'Any Rating', description: 'All content' },
  DECENT: { min: 5, label: '5+', description: 'Decent and above' },
  GOOD: { min: 6, label: '6+', description: 'Good and above' },
  GREAT: { min: 7, label: '7+', description: 'Great and above' },
  EXCELLENT: { min: 8, label: '8+', description: 'Excellent only' },
} as const;

export type RatingTier = keyof typeof RATING_TIERS;

/**
 * Witty loading messages for the generator
 */
export const LOADING_MESSAGES = [
  'Rolling the dice...',
  'Asking the director...',
  'Consulting the film gods...',
  'Analyzing your taste...',
  'Scanning the multiverse...',
  'Flipping through the archives...',
  'Summoning the perfect pick...',
  'Channeling movie magic...',
  'Decoding your preferences...',
  'The algorithm is thinking...',
] as const;

/**
 * Get a random loading message
 */
export function getRandomLoadingMessage(): string {
  const index = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return LOADING_MESSAGES[index];
}
