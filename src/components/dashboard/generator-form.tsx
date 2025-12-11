/**
 * GeneratorForm Component
 * Handles mode selection and filter inputs for recommendations
 * Single Responsibility: Only handles generator UI and filter state
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
    <div className="glass rounded-2xl p-8">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-8 p-1 bg-secondary rounded-lg max-w-md mx-auto">
        <button
          onClick={() => onModeChange('SMART')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'SMART' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-secondary-foreground/10'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Smart Mode
        </button>
        <button
          onClick={() => onModeChange('FILTERED')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'FILTERED' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-secondary-foreground/10'
          }`}
        >
          <Sliders className="w-4 h-4 inline mr-2" />
          Filtered Mode
        </button>
      </div>

      {mode === 'SMART' ? (
        /* Smart Mode */
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Feeling Lucky?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Get one perfect recommendation based on your taste profile
          </p>
        </div>
      ) : (
        /* Filtered Mode */
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Content Type</label>
            <select
              value={filters.contentType}
              onChange={(e) => onFilterChange({ ...filters, contentType: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'MOVIE' && '🎬 Movies'}
                  {type === 'SERIES' && '📺 TV Series'}
                  {type === 'ANIME' && '⚡ Anime'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Genre (Optional)</label>
            <select
              value={filters.genre}
              onChange={(e) => onFilterChange({ ...filters, genre: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Any Genre</option>
              {availableGenres.map((genre) => (
                <option key={genre.id} value={String(genre.id)}>
                  {genre.icon} {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={filters.language}
              onChange={(e) => onFilterChange({ ...filters, language: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.values(LANGUAGES).map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Minimum Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => onFilterChange({ ...filters, rating: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.entries(RATING_TIERS).map(([key, tier]) => (
                <option key={key} value={key}>
                  ⭐ {tier.label} - {tier.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
          <p className="text-destructive text-sm mb-3">{error}</p>
          {error.includes('onboarding') && (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Complete Onboarding
            </Link>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg glow hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding your pick...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {mode === 'SMART' ? 'Get My Pick' : 'Generate'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
