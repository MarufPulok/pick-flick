/**
 * StatsCards Component
 * Compact statistics display
 */

'use client';

import { Eye, Star, ThumbsDown, ThumbsUp } from 'lucide-react';

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
  if (!stats) {
    return (
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl p-3 bg-secondary animate-pulse h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      <div className="rounded-xl p-3 bg-gradient-to-br from-violet-500 to-purple-600">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">{stats.watchedCount}</div>
          <Eye className="w-4 h-4 text-white/70" />
        </div>
        <div className="text-xs text-white/70">Watched</div>
      </div>
      <div className="rounded-xl p-3 bg-gradient-to-br from-emerald-500 to-green-600">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">{stats.likedCount}</div>
          <ThumbsUp className="w-4 h-4 text-white/70" />
        </div>
        <div className="text-xs text-white/70">Liked</div>
      </div>
      <div className="rounded-xl p-3 bg-gradient-to-br from-rose-500 to-red-600">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">{stats.dislikedCount}</div>
          <ThumbsDown className="w-4 h-4 text-white/70" />
        </div>
        <div className="text-xs text-white/70">Disliked</div>
      </div>
      <div className="rounded-xl p-3 bg-gradient-to-br from-amber-500 to-orange-600">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
          </div>
          <Star className="w-4 h-4 text-white/70 fill-white/70" />
        </div>
        <div className="text-xs text-white/70">Avg</div>
      </div>
    </div>
  );
}

export function EngagementBar({ likeRatio }: { likeRatio: number }) {
  return null; // Removed for compact layout
}
