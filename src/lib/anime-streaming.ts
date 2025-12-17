/**
 * Anime Streaming Utilities
 * Functions for constructing HiAnime streaming URLs
 */

const DEFAULT_ANIME_STREAM_BASE_URL = 'https://hianime.to';

/**
 * Constructs a HiAnime search URL for the given anime title
 * 
 * @param title - The anime title to search for
 * @returns A fully-formed HiAnime search URL, or null if the title is invalid
 * 
 * @example
 * getAnimeStreamUrl("Fruits Basket")
 * // Returns: "https://hianime.to/search?keyword=Fruits+Basket"
 * 
 * @example
 * getAnimeStreamUrl("")
 * // Returns: null
 * 
 * @example
 * getAnimeStreamUrl(null)
 * // Returns: null
 */
export function getAnimeStreamUrl(
  title: string | null | undefined
): string | null {
  // Early return for invalid titles
  if (!title) return null;
  
  const trimmed = title.trim();
  if (!trimmed) return null;
  
  try {
    // Read base URL from environment with fallback to default
    const rawBase = process.env.NEXT_PUBLIC_ANIME_STREAM_BASE_URL ?? DEFAULT_ANIME_STREAM_BASE_URL;
    
    // Strip trailing slashes from base URL
    const base = rawBase.replace(/\/+$/, '');
    
    // Use URLSearchParams for proper encoding
    const params = new URLSearchParams({ keyword: trimmed });
    
    return `${base}/search?${params.toString()}`;
  } catch (error) {
    console.error('Failed to construct anime stream URL:', error);
    return null;
  }
}
