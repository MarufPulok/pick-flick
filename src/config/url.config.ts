/**
 * PickFlick API Routes Configuration
 * Centralized API endpoint definitions
 */

export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    CALLBACK: '/api/auth/callback',
    SESSION: '/api/auth/session',
  },
  
  // User Profile & Onboarding
  PROFILE: '/api/profile',
  
  // Recommendation Engine
  RECOMMENDATION: '/api/recommendation',
  
  // History & Feedback
  HISTORY: '/api/history',
  FEEDBACK: '/api/feedback',
  
  // Streaming Availability
  AVAILABILITY: '/api/availability',
} as const;

/**
 * External API Configurations
 */
export const EXTERNAL_APIS = {
  TMDB: {
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    POSTER_SIZES: {
      SMALL: 'w185',
      MEDIUM: 'w342',
      LARGE: 'w500',
      ORIGINAL: 'original',
    },
    BACKDROP_SIZES: {
      SMALL: 'w300',
      MEDIUM: 'w780',
      LARGE: 'w1280',
      ORIGINAL: 'original',
    },
  },
  JUSTWATCH: {
    BASE_URL: 'https://apis.justwatch.com/content',
  },
} as const;

/**
 * Helper to get poster URL
 */
export function getTMDBImageUrl(
  path: string | null | undefined,
  size: keyof typeof EXTERNAL_APIS.TMDB.POSTER_SIZES = 'MEDIUM'
): string | null {
  if (!path) return null;
  return `${EXTERNAL_APIS.TMDB.IMAGE_BASE_URL}/${EXTERNAL_APIS.TMDB.POSTER_SIZES[size]}${path}`;
}

/**
 * Helper to get backdrop URL
 */
export function getTMDBBackdropUrl(
  path: string | null | undefined,
  size: keyof typeof EXTERNAL_APIS.TMDB.BACKDROP_SIZES = 'LARGE'
): string | null {
  if (!path) return null;
  return `${EXTERNAL_APIS.TMDB.IMAGE_BASE_URL}/${EXTERNAL_APIS.TMDB.BACKDROP_SIZES[size]}${path}`;
}
