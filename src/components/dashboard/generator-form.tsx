/**
 * GeneratorForm Component
 * Compact recommendation generator
 */

'use client';

import { ANIME_GENRES, CONTENT_TYPES, GENRES, LANGUAGES, RATING_TIERS } from '@/config/app.config';
import { Loader2, Sliders, Sparkles } from 'lucide-react';
import Link from 'next/link';

type Mode = 'SMART' | 'FILTERED';

interface FilterState {
  contentType: string;
  genre: string;
  language: string;
  rating: string;
}

interface GeneratorFormProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export function GeneratorForm({
  mode,
  onModeChange,
  filters,
  onFilterChange,
  isLoading,
  error,
  onGenerate,
}: GeneratorFormProps) {
  const availableGenres = filters.contentType === 'ANIME' 
    ? Object.values(ANIME_GENRES)
    : Object.values(GENRES);

  return (
    <div className="glass rounded-xl p-4">
      {/* Mode Toggle */}
      <div className="flex gap-1 mb-4 p-1 bg-secondary rounded-lg">
        <button
          onClick={() => onModeChange('SMART')}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === 'SMART' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-secondary-foreground/10'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1" />
          Smart
        </button>
        <button
          onClick={() => onModeChange('FILTERED')}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === 'FILTERED' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-secondary-foreground/10'
          }`}
        >
          <Sliders className="w-4 h-4 inline mr-1" />
          Filter
        </button>
      </div>

      {mode === 'SMART' ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold mb-1">Feeling Lucky?</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Get one perfect pick based on your taste
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <select
            value={filters.contentType}
            onChange={(e) => onFilterChange({ ...filters, contentType: e.target.value })}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'MOVIE' && '🎬 Movie'}
                {type === 'SERIES' && '📺 Series'}
                {type === 'ANIME' && '⚡ Anime'}
              </option>
            ))}
          </select>
          <select
            value={filters.genre}
            onChange={(e) => onFilterChange({ ...filters, genre: e.target.value })}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
          >
            <option value="">Any Genre</option>
            {availableGenres.map((genre) => (
              <option key={genre.id} value={String(genre.id)}>
                {genre.icon} {genre.name}
              </option>
            ))}
          </select>
          <select
            value={filters.language}
            onChange={(e) => onFilterChange({ ...filters, language: e.target.value })}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
          >
            {Object.values(LANGUAGES).map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <select
            value={filters.rating}
            onChange={(e) => onFilterChange({ ...filters, rating: e.target.value })}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
          >
            {Object.entries(RATING_TIERS).map(([key, tier]) => (
              <option key={key} value={key}>
                ⭐ {tier.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
          <p className="text-destructive text-xs mb-2">{error}</p>
          {error.includes('onboarding') && (
            <Link href="/onboarding" className="text-xs text-primary hover:underline">
              Complete Onboarding
            </Link>
          )}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold glow hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Finding...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {mode === 'SMART' ? 'Get My Pick' : 'Generate'}
          </>
        )}
      </button>
    </div>
  );
}
