/**
 * Environment Configuration
 * Centralized environment variable access with type safety
 */

/**
 * Server-side environment variables
 * These should only be accessed in server components or API routes
 */
export const serverEnv = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI!,

  // TMDB API
  TMDB_API_KEY: process.env.TMDB_API_KEY!,
  TMDB_ACCESS_TOKEN: process.env.TMDB_ACCESS_TOKEN!,
} as const;

/**
 * Client-side environment variables
 * These are exposed to the browser (prefixed with NEXT_PUBLIC_)
 */
export const clientEnv = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ANIME_STREAM_BASE_URL: process.env.NEXT_PUBLIC_ANIME_STREAM_BASE_URL || "https://hianime.to",
  
  // Free Streaming Configuration
  // Global feature toggle
  ENABLE_FREE_STREAMING: process.env.NEXT_PUBLIC_ENABLE_FREE_STREAMING || "true",
  
  // Individual platform toggles
  ENABLE_TUBI: process.env.NEXT_PUBLIC_ENABLE_TUBI || "true",
  ENABLE_CRACKLE: process.env.NEXT_PUBLIC_ENABLE_CRACKLE || "true",
  ENABLE_PLUTO: process.env.NEXT_PUBLIC_ENABLE_PLUTO || "true",
  ENABLE_POPCORNFLIX: process.env.NEXT_PUBLIC_ENABLE_POPCORNFLIX || "true",
  ENABLE_FILMRISE: process.env.NEXT_PUBLIC_ENABLE_FILMRISE || "true",
  ENABLE_YOUTUBE_FREE: process.env.NEXT_PUBLIC_ENABLE_YOUTUBE_FREE || "true",
  ENABLE_INTERNET_ARCHIVE: process.env.NEXT_PUBLIC_ENABLE_INTERNET_ARCHIVE || "true",
  ENABLE_HIANIME: process.env.NEXT_PUBLIC_ENABLE_HIANIME || "true",
  ENABLE_ZORO: process.env.NEXT_PUBLIC_ENABLE_ZORO || "true",
  ENABLE_9ANIME: process.env.NEXT_PUBLIC_ENABLE_9ANIME || "true",
  ENABLE_GOGOANIME: process.env.NEXT_PUBLIC_ENABLE_GOGOANIME || "true",
  
  // Display preferences
  MAX_FREE_SERVICES: process.env.NEXT_PUBLIC_MAX_FREE_SERVICES || "4",
  SHOW_SERVICE_DESCRIPTIONS: process.env.NEXT_PUBLIC_SHOW_SERVICE_DESCRIPTIONS || "true",
  
  // Custom platform URLs
  TUBI_BASE_URL: process.env.NEXT_PUBLIC_TUBI_BASE_URL || "https://tubitv.com",
  CRACKLE_BASE_URL: process.env.NEXT_PUBLIC_CRACKLE_BASE_URL || "https://www.crackle.com",
  PLUTO_BASE_URL: process.env.NEXT_PUBLIC_PLUTO_BASE_URL || "https://pluto.tv",
  POPCORNFLIX_BASE_URL: process.env.NEXT_PUBLIC_POPCORNFLIX_BASE_URL || "https://www.popcornflix.com",
  FILMRISE_BASE_URL: process.env.NEXT_PUBLIC_FILMRISE_BASE_URL || "https://www.filmrise.com",
  YOUTUBE_FREE_BASE_URL: process.env.NEXT_PUBLIC_YOUTUBE_FREE_BASE_URL || "https://www.youtube.com",
  INTERNET_ARCHIVE_BASE_URL: process.env.NEXT_PUBLIC_INTERNET_ARCHIVE_BASE_URL || "https://archive.org",
  HIANIME_BASE_URL: process.env.NEXT_PUBLIC_HIANIME_BASE_URL || "https://hianime.to",
  ZORO_BASE_URL: process.env.NEXT_PUBLIC_ZORO_BASE_URL || "https://zoro.to",
  NINEANIME_BASE_URL: process.env.NEXT_PUBLIC_9ANIME_BASE_URL || "https://9anime.to",
  GOGOANIME_BASE_URL: process.env.NEXT_PUBLIC_GOGOANIME_BASE_URL || "https://gogoanime.lu",
} as const;

/**
 * Validate required environment variables
 * Call this in your app initialization
 */
export function validateEnv() {
  const required = ["MONGODB_URI", "TMDB_API_KEY"] as const;
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please check your .env.local file.`
    );
  }
}
