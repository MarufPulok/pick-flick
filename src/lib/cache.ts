/**
 * TTL Cache for API Responses
 * In-memory cache with automatic expiration
 * 
 * Use cases:
 * - TMDB discover queries (avoid repeated API calls for same filters)
 * - Trailer/video data (rarely changes)
 * - Watch provider data (rarely changes)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  DISCOVER: 5 * 60 * 1000,          // 5 minutes - discover results can change
  DETAILS: 24 * 60 * 60 * 1000,     // 24 hours - movie details rarely change
  VIDEOS: 7 * 24 * 60 * 60 * 1000,  // 7 days - trailers rarely change
  PROVIDERS: 24 * 60 * 60 * 1000,   // 24 hours - streaming availability changes
  GENRES: 7 * 24 * 60 * 60 * 1000,  // 7 days - genres almost never change
  // New TTL constants for enhanced caching
  SIMILAR: 60 * 60 * 1000,          // 1 hour - similar content is fairly stable
  SEARCH: 30 * 60 * 1000,           // 30 minutes - search results can change
  TRENDING: 15 * 60 * 1000,         // 15 minutes - trending changes frequently
  RECOMMENDATIONS: 60 * 60 * 1000,  // 1 hour - TMDB recommendations
} as const;

/**
 * Generic TTL Cache implementation
 * Thread-safe for Node.js single-threaded event loop
 */
export class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private maxSize: number;
  private name: string;

  constructor(options: { maxSize?: number; cleanupIntervalMs?: number; name?: string } = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.name = options.name ?? 'unnamed';
    
    // Periodic cleanup of expired entries (every 5 minutes by default)
    const cleanupMs = options.cleanupIntervalMs ?? 5 * 60 * 1000;
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupMs);
    
    // Prevent interval from blocking Node.js exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Get cache name for debugging
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get value from cache
   * Returns undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache with TTL
   */
  set(key: string, value: T, ttlMs: number): void {
    // Evict oldest entries if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const isNew = !this.cache.has(key);
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
    
    if (isNew) {
      this.stats.size++;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size--;
      return false;
    }
    
    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const had = this.cache.delete(key);
    if (had) this.stats.size--;
    return had;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; name: string } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      name: this.name,
      hitRate: total > 0 ? Math.round((this.stats.hits / total) * 100) : 0,
    };
  }

  /**
   * Get or compute value
   * If not in cache, calls the factory function and caches the result
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    this.stats.size = this.cache.size;
    
    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Cache:${this.name}] Cleaned up ${cleaned} expired entries. Size: ${this.cache.size}`);
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    // Remove ~10% of entries (oldest first)
    const toEvict = Math.max(1, Math.floor(this.maxSize * 0.1));
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.size--;
    }
  }

  /**
   * Stop the cleanup interval (for testing/cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Create a cache key from an object
 * Handles nested objects and arrays deterministically
 */
export function createCacheKey(prefix: string, params: object): string {
  const sortedEntries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  
  const paramString = sortedEntries
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('&');
  
  return `${prefix}:${paramString}`;
}

// ============================================================================
// Global cache instances for different data types
// ============================================================================

// Existing caches
export const discoverCache = new TTLCache<unknown>({ maxSize: 500, name: 'discover' });
export const detailsCache = new TTLCache<unknown>({ maxSize: 200, name: 'details' });
export const videosCache = new TTLCache<unknown>({ maxSize: 200, name: 'videos' });
export const providersCache = new TTLCache<unknown>({ maxSize: 200, name: 'providers' });

// New caches for enhanced features
export const similarCache = new TTLCache<unknown>({ maxSize: 300, name: 'similar' });
export const searchCache = new TTLCache<unknown>({ maxSize: 200, name: 'search' });
export const trendingCache = new TTLCache<unknown>({ maxSize: 50, name: 'trending' });
export const recommendationsCache = new TTLCache<unknown>({ maxSize: 300, name: 'recommendations' });

/**
 * Get aggregated stats from all cache instances
 */
export function getAllCacheStats() {
  const caches = [
    discoverCache,
    detailsCache,
    videosCache,
    providersCache,
    similarCache,
    searchCache,
    trendingCache,
    recommendationsCache,
  ];

  const stats = caches.map(cache => cache.getStats());
  
  const totals = {
    totalHits: stats.reduce((sum, s) => sum + s.hits, 0),
    totalMisses: stats.reduce((sum, s) => sum + s.misses, 0),
    totalSize: stats.reduce((sum, s) => sum + s.size, 0),
    overallHitRate: 0,
  };

  const totalRequests = totals.totalHits + totals.totalMisses;
  totals.overallHitRate = totalRequests > 0 
    ? Math.round((totals.totalHits / totalRequests) * 100) 
    : 0;

  return {
    caches: stats,
    totals,
  };
}

/**
 * Clear all caches (useful for testing or cache invalidation)
 */
export function clearAllCaches(): void {
  discoverCache.clear();
  detailsCache.clear();
  videosCache.clear();
  providersCache.clear();
  similarCache.clear();
  searchCache.clear();
  trendingCache.clear();
  recommendationsCache.clear();
}

