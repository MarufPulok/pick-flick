/**
 * LanguageStep Component
 * Step 3: Select languages and optional minimum rating
 * Single Responsibility: Handles language and rating preferences
 */

'use client';

import { LANGUAGES } from '@/config/app.config';

type ContentType = 'MOVIE' | 'SERIES' | 'ANIME';

interface LanguageStepProps {
  contentTypes: ContentType[];
  selectedLanguages: string[];
  minRating: number | undefined;
  onToggleLanguage: (langCode: string) => void;
  onSetMinRating: (rating: number | undefined) => void;
}

export function LanguageStep({
  contentTypes,
  selectedLanguages,
  minRating,
  onToggleLanguage,
  onSetMinRating,
}: LanguageStepProps) {
  const hasAnime = contentTypes.includes('ANIME');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Language preferences</h2>
        <p className="text-muted-foreground">
          Which languages do you prefer?
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.values(LANGUAGES).map((lang) => {
          const isJapaneseLocked = lang.code === 'ja' && hasAnime;
          return (
            <button
              key={lang.code}
              onClick={() => onToggleLanguage(lang.code)}
              disabled={isJapaneseLocked}
              className={`px-4 py-3 rounded-lg border transition-all text-left ${
                selectedLanguages.includes(lang.code)
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-border hover:border-primary/50'
              } ${isJapaneseLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium">
                {lang.flag} {lang.name}
                {isJapaneseLocked && <span className="ml-2 text-xs">🔒</span>}
              </div>
            </button>
          );
        })}
      </div>

      {hasAnime && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm">
            💡 <strong>Pro tip:</strong> Japanese will be automatically
            included for anime recommendations!
          </p>
        </div>
      )}

      {/* Minimum Rating */}
      <div className="pt-6 border-t border-border">
        <h3 className="text-lg font-semibold mb-3">Minimum Rating (Optional)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Only recommend content rated this & above
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: undefined, label: 'Any' },
            { value: 6, label: '6+' },
            { value: 7, label: '7+' },
            { value: 8, label: '8+' },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onSetMinRating(option.value)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                minRating === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-2xl mb-1">⭐</div>
              <div className="font-semibold">{option.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
