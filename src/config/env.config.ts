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
  
  // Free Streaming Configuration
  // Global feature toggle
  ENABLE_FREE_STREAMING: process.env.NEXT_PUBLIC_ENABLE_FREE_STREAMING || "true",
  
  // Individual platform toggles (only working sites)
  ENABLE_MOVIEBOX: process.env.NEXT_PUBLIC_ENABLE_MOVIEBOX || "true",
  ENABLE_CINEB: process.env.NEXT_PUBLIC_ENABLE_CINEB || "true",
  ENABLE_HIANIME: process.env.NEXT_PUBLIC_ENABLE_HIANIME || "true",
  
  // Display preferences
  MAX_FREE_SERVICES: process.env.NEXT_PUBLIC_MAX_FREE_SERVICES || "4",
  SHOW_SERVICE_DESCRIPTIONS: process.env.NEXT_PUBLIC_SHOW_SERVICE_DESCRIPTIONS || "true",
  
  // Custom platform URLs (only working sites)
  MOVIEBOX_BASE_URL: process.env.NEXT_PUBLIC_MOVIEBOX_BASE_URL || "https://moviebox.ph",
  CINEB_BASE_URL: process.env.NEXT_PUBLIC_CINEB_BASE_URL || "https://cineb.gg",
  HIANIME_BASE_URL: process.env.NEXT_PUBLIC_HIANIME_BASE_URL || "https://hianime.to",
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
