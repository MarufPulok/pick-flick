/**
 * ContentTypeStep Component
 * Step 1: Select content types (Movie, Series, Anime)
 * Single Responsibility: Only handles content type selection
 */

'use client';

import { CONTENT_TYPES } from '@/config/app.config';

type ContentType = 'MOVIE' | 'SERIES' | 'ANIME';

const CONTENT_TYPE_INFO = {
  MOVIE: { emoji: '🎬', label: 'Movies', description: 'Feature films' },
  SERIES: { emoji: '📺', label: 'TV Series', description: 'Shows & episodes' },
  ANIME: { emoji: '⚡', label: 'Anime', description: 'Japanese animation' },
} as const;

interface ContentTypeStepProps {
  selected: ContentType[];
  onToggle: (type: ContentType) => void;
}

export function ContentTypeStep({ selected, onToggle }: ContentTypeStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What do you watch?</h2>
        <p className="text-muted-foreground">Select all that apply</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CONTENT_TYPES.map((type) => {
          const info = CONTENT_TYPE_INFO[type];
          return (
            <button
              key={type}
              onClick={() => onToggle(type)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selected.includes(type)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-4xl mb-3">{info.emoji}</div>
              <div className="font-semibold mb-1">{info.label}</div>
              <div className="text-sm text-muted-foreground">
                {info.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
