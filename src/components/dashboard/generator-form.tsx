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
    <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6 sm:mb-8 p-1 bg-secondary rounded-lg max-w-md mx-auto">
        <button
          onClick={() => onModeChange('SMART')}
          className={`flex-1 px-3 sm:px-5 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors min-h-[44px] ${
            mode === 'SMART' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-secondary-foreground/10'
          }`}
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Smart Mode</span>
          <span className="sm:hidden">Smart</span>
        </button>
        <button
          onClick={() => onModeChange('FILTERED')}
          className={`flex-1 px-3 sm:px-5 py-2.5 sm:py-3 rounded-md text-sm sm:text-base font-medium transition-colors min-h-[44px] ${
            mode === 'FILTERED' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-secondary-foreground/10'
          }`}
        >
          <Sliders className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Filtered Mode</span>
          <span className="sm:hidden">Filtered</span>
        </button>
      </div>

      {mode === 'SMART' ? (
        /* Smart Mode */
        <div className="text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse-glow">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Feeling Lucky?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto px-4">
            Get one perfect recommendation based on your taste profile
          </p>
        </div>
      ) : (
        /* Filtered Mode */
        <div className="max-w-md mx-auto space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Content Type</label>
            <select
              value={filters.contentType}
              onChange={(e) => onFilterChange({ ...filters, contentType: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
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
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
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
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
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
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
            >
              Complete Onboarding
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 sm:mt-8 text-center">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base sm:text-lg glow hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center gap-2 min-h-[44px]"
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
