/**
 * StatsCards Component
 * Displays user statistics in a grid layout
 * Single Responsibility: Only handles stats display
 */

'use client';

import { Star } from 'lucide-react';

interface UserStats {
  watchedCount: number;
  likedCount: number;
  dislikedCount: number;
  averageRating: number;
}

interface StatsCardsProps {
  stats: UserStats | null | undefined;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="glass rounded-xl p-4">
        <div className="text-2xl font-bold mb-1">{stats.watchedCount}</div>
        <div className="text-sm text-muted-foreground">Watched</div>
      </div>
      <div className="glass rounded-xl p-4">
        <div className="text-2xl font-bold mb-1">{stats.likedCount}</div>
        <div className="text-sm text-muted-foreground">Liked</div>
      </div>
      <div className="glass rounded-xl p-4">
        <div className="text-2xl font-bold mb-1">{stats.dislikedCount}</div>
        <div className="text-sm text-muted-foreground">Disliked</div>
      </div>
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
          <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
        </div>
        <div className="text-sm text-muted-foreground">Avg Rating</div>
      </div>
    </div>
  );
}
