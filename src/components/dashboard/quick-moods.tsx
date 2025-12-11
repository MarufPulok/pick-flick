/**
 * QuickMoods Component
 * Compact mood-based shortcuts
 */

'use client';

import { Flame, Heart, Laugh, Skull, Zap } from 'lucide-react';

const MOODS = [
  { id: 'action', label: 'Action', icon: <Zap className="w-4 h-4" />, gradient: 'from-orange-500 to-red-500', genres: ['28', '12'] },
  { id: 'romance', label: 'Romance', icon: <Heart className="w-4 h-4" />, gradient: 'from-pink-500 to-rose-500', genres: ['10749'] },
  { id: 'comedy', label: 'Comedy', icon: <Laugh className="w-4 h-4" />, gradient: 'from-yellow-500 to-amber-500', genres: ['35'] },
  { id: 'thriller', label: 'Thriller', icon: <Skull className="w-4 h-4" />, gradient: 'from-gray-700 to-gray-900', genres: ['53', '27'] },
  { id: 'trending', label: 'Hot', icon: <Flame className="w-4 h-4" />, gradient: 'from-violet-500 to-purple-600', genres: [] },
];

interface QuickMoodsProps {
  onSelectMood: (genres: string[]) => void;
}

export function QuickMoods({ onSelectMood }: QuickMoodsProps) {
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
      {MOODS.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onSelectMood(mood.genres)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${mood.gradient} text-white font-medium text-xs whitespace-nowrap hover:scale-105 transition-transform active:scale-95`}
        >
          {mood.icon}
          {mood.label}
        </button>
      ))}
    </div>
  );
}
