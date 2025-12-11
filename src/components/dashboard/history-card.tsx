/**
 * HistoryCard Component
 * Compact expandable history panel for single-screen layout
 */

'use client';

import { useHistory } from '@/hooks/use-history';
import { ChevronDown, ChevronUp, Clock, Eye, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const ACTION_CONFIG = {
  WATCHED: { icon: Eye, color: 'text-violet-500', bg: 'bg-violet-500' },
  LIKED: { icon: ThumbsUp, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  DISLIKED: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-500' },
  BLACKLISTED: { icon: X, color: 'text-gray-500', bg: 'bg-gray-500' },
} as const;

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HistoryCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { history, isLoading, total } = useHistory({ limit: isExpanded ? 10 : 4 });

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">History</span>
          </div>
          <div className="w-16 h-4 bg-secondary animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass rounded-xl p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">No history yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header - always visible, clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">History</span>
          <span className="text-xs text-muted-foreground">({total})</span>
        </div>
        
        {/* Mini avatars when collapsed */}
        <div className="flex items-center gap-1">
          {!isExpanded && history.slice(0, 3).map((item, i) => (
            <div 
              key={`${item.tmdbId}-${i}`}
              className="relative w-6 h-6 rounded overflow-hidden bg-secondary"
              style={{ marginLeft: i > 0 ? '-4px' : 0, zIndex: 3 - i }}
            >
              {item.posterPath ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>
          ))}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
          {history.map((item, index) => {
            const config = ACTION_CONFIG[item.action];
            const Icon = config.icon;

            return (
              <div
                key={`${item.tmdbId}-${item.action}-${index}`}
                className="flex items-center gap-2 py-1"
              >
                {/* Poster mini */}
                <div className="relative w-8 h-10 rounded overflow-hidden bg-secondary shrink-0">
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
                      <Eye className="w-3 h-3 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Title & action */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Icon className={`w-3 h-3 ${config.color}`} />
                    <span>{formatTimeAgo(item.createdAt)}</span>
                  </div>
                </div>

                {/* Rating */}
                {item.rating && (
                  <span className="text-[10px] text-amber-500">⭐{item.rating.toFixed(1)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
