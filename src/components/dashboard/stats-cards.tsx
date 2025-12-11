/**
 * StatsCards Component
 * Displays user statistics with engaging animations and visuals
 * Single Responsibility: Only handles stats display
 */

'use client';

import { Eye, Film, Flame, Star, ThumbsDown, ThumbsUp, TrendingUp, Tv } from 'lucide-react';

interface UserStats {
  watchedCount: number;
  likedCount: number;
  dislikedCount: number;
  averageRating: number;
  // Enhanced stats
  contentTypeDistribution?: {
    MOVIE: number;
    SERIES: number;
    ANIME: number;
  };
  likeRatio?: number;
  currentStreak?: number;
  lastActiveDate?: string | null;
}

interface StatsCardsProps {
  stats: UserStats | null | undefined;
}

interface StatCardProps {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  small?: boolean;
}

function StatCard({ value, label, icon, gradient, iconBg, small }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${small ? 'p-3' : 'p-5'} ${gradient} group hover:scale-[1.02] transition-all duration-300 cursor-default`}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-700" />
      
      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className={`${small ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left`}>
            {value}
          </div>
          <div className={`${small ? 'text-xs' : 'text-sm'} text-white/70 font-medium`}>{label}</div>
        </div>
        <div className={`${small ? 'p-2' : 'p-2.5'} rounded-xl ${iconBg} group-hover:rotate-12 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    // Show skeleton loader
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 bg-secondary animate-pulse h-24" />
        ))}
      </div>
    );
  }

  // Calculate like ratio for engagement metric (use server value if available)
  const totalReactions = stats.likedCount + stats.dislikedCount;
  const likeRatio = stats.likeRatio ?? (totalReactions > 0 
    ? Math.round((stats.likedCount / totalReactions) * 100) 
    : 0);

  return (
    <div className="space-y-4 mb-8">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={stats.watchedCount}
          label="Watched"
          icon={<Eye className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          iconBg="bg-white/20"
        />
        <StatCard
          value={stats.likedCount}
          label="Liked"
          icon={<ThumbsUp className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
          iconBg="bg-white/20"
        />
        <StatCard
          value={stats.dislikedCount}
          label="Disliked"
          icon={<ThumbsDown className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-rose-500 to-red-600"
          iconBg="bg-white/20"
        />
        <StatCard
          value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
          label="Avg Rating"
          icon={<Star className="w-5 h-5 text-white fill-white" />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          iconBg="bg-white/20"
        />
      </div>

      {/* Secondary Stats Row - Content Type Distribution & Streak */}
      {(stats.contentTypeDistribution || stats.currentStreak !== undefined) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.contentTypeDistribution && (
            <>
              <StatCard
                value={stats.contentTypeDistribution.MOVIE}
                label="Movies"
                icon={<Film className="w-4 h-4 text-white" />}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                iconBg="bg-white/20"
                small
              />
              <StatCard
                value={stats.contentTypeDistribution.SERIES}
                label="Series"
                icon={<Tv className="w-4 h-4 text-white" />}
                gradient="bg-gradient-to-br from-pink-500 to-rose-600"
                iconBg="bg-white/20"
                small
              />
              <StatCard
                value={stats.contentTypeDistribution.ANIME}
                label="Anime"
                icon={<span className="text-sm">⚡</span>}
                gradient="bg-gradient-to-br from-cyan-500 to-teal-600"
                iconBg="bg-white/20"
                small
              />
            </>
          )}
          {stats.currentStreak !== undefined && stats.currentStreak > 0 && (
            <StatCard
              value={`${stats.currentStreak}🔥`}
              label="Day Streak"
              icon={<Flame className="w-4 h-4 text-white" />}
              gradient="bg-gradient-to-br from-orange-500 to-red-600"
              iconBg="bg-white/20"
              small
            />
          )}
        </div>
      )}

      {/* Engagement Bar */}
      {likeRatio > 0 && totalReactions >= 3 && (
        <EngagementBar likeRatio={likeRatio} />
      )}
    </div>
  );
}

// Engagement bar for showing like ratio
export function EngagementBar({ likeRatio }: { likeRatio: number }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Your Taste Match</span>
        </div>
        <span className="text-sm font-bold text-primary">{likeRatio}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${likeRatio}%` }}
        />
      </div>
    </div>
  );
}
