'use client';

/**
 * Theme Provider
 * Dark mode handling with system preference detection
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Storage utility functions
function getStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  try {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    return stored || defaultTheme;
  } catch {
    return defaultTheme;
  }
}

// Subscribe to system preference changes
function subscribeToSystemTheme(callback: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getSystemThemeSnapshot(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSnapshot(): boolean {
  return true; // Default to dark on server
}

// Subscribe to localStorage changes
function createStorageSubscribe(storageKey: string) {
  return (callback: () => void) => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        callback();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  };
}

function createStorageSnapshot(storageKey: string, defaultTheme: Theme) {
  return () => getStoredTheme(storageKey, defaultTheme);
}

function createServerStorageSnapshot(defaultTheme: Theme) {
  return () => defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'pickflick-theme',
}: ThemeProviderProps) {
  // Subscribe to localStorage for theme
  const theme = useSyncExternalStore(
    createStorageSubscribe(storageKey),
    createStorageSnapshot(storageKey, defaultTheme),
    createServerStorageSnapshot(defaultTheme)
  );

  // Subscribe to system preference
  const systemIsDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getServerSnapshot
  );

  // Calculate resolved theme
  const resolvedTheme: 'dark' | 'light' =
    theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Set theme function
  const setTheme = useCallback(
    (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme);
        // Dispatch storage event to trigger re-render
        window.dispatchEvent(
          new StorageEvent('storage', { key: storageKey, newValue: newTheme })
        );
      } catch {
        // localStorage might be unavailable
      }
    },
    [storageKey]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
