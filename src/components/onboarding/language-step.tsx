'use client';

import { LANGUAGES } from '@/config/app.config';
import { cn } from '@/lib/utils';

type ContentType = 'MOVIE' | 'SERIES' | 'ANIME';

const RATING_OPTIONS = [
  { value: undefined, label: 'Any' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
];

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
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Which languages?</h1>
      <p className="mt-2 text-muted-foreground">
        {hasAnime ? 'Japanese stays on for anime.' : 'Pick all you are happy to watch in.'}
      </p>

      <div className="stagger mt-8 flex flex-wrap gap-2">
        {Object.values(LANGUAGES).map((lang) => {
          const locked = lang.code === 'ja' && hasAnime;
          const on = selectedLanguages.includes(lang.code);
          return (
            <button
              key={lang.code}
              type="button"
              aria-pressed={on}
              onClick={() => onToggleLanguage(lang.code)}
              disabled={locked}
              className={cn(
                'h-10 cursor-pointer rounded-full border px-4 text-sm transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:cursor-default',
                on ? 'border-accent bg-accent font-medium text-accent-foreground' : 'border-border hover:bg-foreground/[0.06]'
              )}
            >
              {lang.name}
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <p className="text-sm text-muted-foreground">Minimum rating. Optional.</p>
        <div role="group" aria-label="Minimum rating" className="mt-3 inline-flex gap-1 rounded-md border border-border p-1">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={minRating === option.value}
              onClick={() => onSetMinRating(option.value)}
              className={cn(
                'h-7 min-w-11 cursor-pointer rounded-sm px-3 text-xs transition-colors',
                minRating === option.value
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
