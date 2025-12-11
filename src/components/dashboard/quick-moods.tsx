/**
 * QuickMoods Component
 * Quick mood-based recommendation shortcuts
 * Adds gamification and engagement to dashboard
 */

'use client';

import { Flame, Heart, Laugh, Skull, Zap } from 'lucide-react';

interface MoodOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  genres: string[];
}

const MOODS: MoodOption[] = [
  {
    id: 'action',
    label: 'Adrenaline',
    icon: <Zap className="w-5 h-5" />,
    gradient: 'from-orange-500 to-red-500',
    genres: ['28', '12'], // Action, Adventure
  },
  {
    id: 'romance',
    label: 'Romance',
    icon: <Heart className="w-5 h-5" />,
    gradient: 'from-pink-500 to-rose-500',
    genres: ['10749'], // Romance
  },
  {
    id: 'comedy',
    label: 'Laughs',
    icon: <Laugh className="w-5 h-5" />,
    gradient: 'from-yellow-500 to-amber-500',
    genres: ['35'], // Comedy
  },
  {
    id: 'thriller',
    label: 'Thrills',
    icon: <Skull className="w-5 h-5" />,
    gradient: 'from-gray-700 to-gray-900',
    genres: ['53', '27'], // Thriller, Horror
  },
  {
    id: 'trending',
    label: 'Trending',
    icon: <Flame className="w-5 h-5" />,
    gradient: 'from-violet-500 to-purple-600',
    genres: [],
  },
];

interface QuickMoodsProps {
  onSelectMood: (genres: string[]) => void;
}

export function QuickMoods({ onSelectMood }: QuickMoodsProps) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        ⚡ Quick Picks by Mood
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onSelectMood(mood.genres)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r ${mood.gradient} text-white font-medium text-sm whitespace-nowrap hover:scale-105 hover:shadow-lg transition-all duration-200 active:scale-95`}
          >
            {mood.icon}
            {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
}
