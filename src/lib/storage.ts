/**
 * Storage Abstraction Layer
 * Provides a unified interface for client-side storage with graceful degradation
 * Primary: localStorage, Fallback: in-memory storage
 */

'use client';

// In-memory fallback storage
const memoryStorage: Map<string, string> = new Map();

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Storage interface for type-safe access
 */
export interface Storage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

/**
 * Storage implementation with localStorage primary and in-memory fallback
 */
class StorageImpl implements Storage {
  private useLocalStorage: boolean;
  private prefix: string;

  constructor(prefix = 'pickflick') {
    this.prefix = prefix;
    this.useLocalStorage = isLocalStorageAvailable();
  }

  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get a value from storage
   * @param key - Storage key
   * @returns Parsed value or null if not found
   */
  get<T>(key: string): T | null {
    const fullKey = this.getFullKey(key);
    
    try {
      const raw = this.useLocalStorage
        ? window.localStorage.getItem(fullKey)
        : memoryStorage.get(fullKey);
      
      if (raw === null || raw === undefined) return null;
      
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[Storage] Failed to parse value for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set a value in storage
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   */
  set<T>(key: string, value: T): void {
    const fullKey = this.getFullKey(key);
    
    try {
      const serialized = JSON.stringify(value);
      
      if (this.useLocalStorage) {
        window.localStorage.setItem(fullKey, serialized);
      } else {
        memoryStorage.set(fullKey, serialized);
      }
    } catch (error) {
      console.warn(`[Storage] Failed to store value for key "${key}":`, error);
      // If localStorage fails (quota exceeded), fall back to memory
      if (this.useLocalStorage) {
        memoryStorage.set(fullKey, JSON.stringify(value));
      }
    }
  }

  /**
   * Remove a value from storage
   * @param key - Storage key to remove
   */
  remove(key: string): void {
    const fullKey = this.getFullKey(key);
    
    if (this.useLocalStorage) {
      window.localStorage.removeItem(fullKey);
    } else {
      memoryStorage.delete(fullKey);
    }
  }

  /**
   * Clear all values with this prefix
   */
  clear(): void {
    if (this.useLocalStorage) {
      const keys = Object.keys(window.localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${this.prefix}:`)) {
          window.localStorage.removeItem(key);
        }
      });
    } else {
      memoryStorage.forEach((_, key) => {
        if (key.startsWith(`${this.prefix}:`)) {
          memoryStorage.delete(key);
        }
      });
    }
  }

  /**
   * Check if using localStorage or memory fallback
   */
  isUsingLocalStorage(): boolean {
    return this.useLocalStorage;
  }
}

// Export singleton instance
export const storage = new StorageImpl();

// Export class for custom instances with different prefixes
export { StorageImpl };
