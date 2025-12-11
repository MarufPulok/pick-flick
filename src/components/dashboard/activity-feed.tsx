/**
 * ActivityFeed Component
 * Shows recent recommendation history with actions
 */

'use client';

import { useHistory } from '@/hooks/use-history';
import { Check, Clock, Eye, ThumbsDown, ThumbsUp } from 'lucide-react';
import Image from 'next/image';

interface ActivityFeedProps {
  limit?: number;
}

const ACTION_CONFIG = {
  WATCHED: {
    icon: Eye,
    label: 'Watched',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  LIKED: {
    icon: ThumbsUp,
    label: 'Liked',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  DISLIKED: {
    icon: ThumbsDown,
    label: 'Disliked',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  BLACKLISTED: {
    icon: Check,
    label: 'Skipped',
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
  },
} as const;

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ limit = 5 }: ActivityFeedProps) {
  const { history, isLoading, total } = useHistory({ limit });

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-16 rounded-lg bg-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No activity yet</p>
          <p className="text-xs mt-1">Start watching to build your history!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        {total > limit && (
          <span className="text-xs text-muted-foreground">
            {total} total
          </span>
        )}
      </div>

      <div className="space-y-3">
        {history.map((item, index) => {
          const config = ACTION_CONFIG[item.action];
          const Icon = config.icon;

          return (
            <div
              key={`${item.tmdbId}-${item.action}-${index}`}
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-secondary/50 transition-colors group"
            >
              {/* Poster Thumbnail */}
              <div className="relative w-10 h-14 rounded-md overflow-hidden bg-secondary shrink-0">
                {item.posterPath ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <span>•</span>
                  <span>{formatTimeAgo(item.createdAt)}</span>
                </div>
              </div>

              {/* Rating if exists */}
              {item.rating && (
                <div className="text-xs text-amber-500 font-medium shrink-0">
                  ⭐ {item.rating.toFixed(1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
