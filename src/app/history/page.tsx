/**
 * History Page
 * Displays user's watch history with filters and pagination
 */

'use client';

import { ContentType } from '@/dtos/common.dto';
import { HistoryFilters, HistoryItem, useHistoryPage } from '@/hooks/use-history-page';
import {
    ArrowLeft,
    Calendar,
    Check,
    Download,
    Film,
    Heart,
    Loader2,
    Play,
    Sparkles,
    ThumbsDown,
    Tv,
    X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

type ActionType = 'WATCHED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED' | 'ALL';

export default function HistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<HistoryFilters>({
    contentType: 'ALL',
    action: 'ALL',
    dateRange: 'all',
  });

  const { items, total, totalPages, isLoading, isFetching } = useHistoryPage({
    page,
    limit: 12,
    filters,
  });

  const handleFilterChange = useCallback(<K extends keyof HistoryFilters>(
    key: K,
    value: HistoryFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    const exportData = items.map(item => ({
      title: item.title,
      type: item.contentType,
      action: item.action,
      rating: item.rating,
      releaseDate: item.releaseDate,
      date: item.createdAt,
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, 'watch-history.json');
    } else {
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, 'watch-history.csv');
    }
  }, [items]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-animated px-4 sm:px-6 py-8 pt-20 sm:pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                Watch History
              </h1>
              <p className="text-muted-foreground mt-1">
                {total.toLocaleString()} items tracked
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Export Bar */}
        <div className="glass rounded-2xl p-4 sm:p-5 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Content Type Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-1">Type</span>
              {(['ALL', 'MOVIE', 'SERIES', 'ANIME'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('contentType', type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${filters.contentType === type
                      ? 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg shadow-primary/25'
                      : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {type === 'ALL' ? '✨ All' : type === 'MOVIE' ? '🎬 Movies' : type === 'SERIES' ? '📺 Series' : '🎌 Anime'}
                </button>
              ))}
            </div>

            <div className="hidden lg:block w-px h-8 bg-border" />

            {/* Action Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-1">Status</span>
              {([
                { action: 'ALL' as ActionType, icon: '📋', label: 'All' },
                { action: 'WATCHED' as ActionType, icon: '👁️', label: 'Watched' },
                { action: 'LIKED' as ActionType, icon: '❤️', label: 'Liked' },
                { action: 'DISLIKED' as ActionType, icon: '👎', label: 'Disliked' },
              ]).map(({ action, icon, label }) => (
                <button
                  key={action}
                  onClick={() => handleFilterChange('action', action)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${filters.action === action
                      ? 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg shadow-primary/25'
                      : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Date & Export */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value as HistoryFilters['dateRange'])}
                  className="bg-transparent text-sm border-none outline-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary text-sm transition-colors"
                  title="Export as JSON"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">JSON</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary text-sm transition-colors"
                  title="Export as CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <span className="text-muted-foreground">Loading your history...</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No History Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your watch history will appear here once you start exploring recommendations
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-violet-500 text-white font-medium shadow-lg shadow-primary/25 hover:shadow-xl transition-shadow"
            >
              <Play className="w-5 h-5" />
              Get Recommendations
            </Link>
          </div>
        ) : (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>

            {/* Loading indicator for pagination */}
            {isFetching && !isLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl glass hover:bg-white/10
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all
                          ${page === pageNum
                            ? 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg'
                            : 'glass hover:bg-white/10'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-muted-foreground">...</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all
                          ${page === totalPages
                            ? 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg'
                            : 'glass hover:bg-white/10'
                          }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2.5 rounded-xl glass hover:bg-white/10
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * History Card Component - Poster Grid Style
 */
function HistoryCard({ item }: { item: HistoryItem }) {
  const router = useRouter();
  const date = new Date(item.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const handleClick = () => {
    router.push(`/dashboard?watch=${item.tmdbId}&type=${item.contentType}`);
  };

  const TypeIcon = item.contentType === 'MOVIE' ? Film : Tv;
  
  const actionConfig = {
    WATCHED: { icon: Check, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500' },
    LIKED: { icon: Heart, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-500' },
    DISLIKED: { icon: ThumbsDown, color: 'from-orange-500 to-red-500', bg: 'bg-orange-500' },
    BLACKLISTED: { icon: X, color: 'from-gray-500 to-gray-600', bg: 'bg-gray-500' },
  }[item.action];

  const ActionIcon = actionConfig.icon;

  return (
    <button
      onClick={handleClick}
      className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-secondary transition-all duration-300
                 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 hover:z-10"
    >
      {/* Poster */}
      {item.posterPath ? (
        <Image
          src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
          alt={item.title}
          fill
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-background">
          <TypeIcon className="w-12 h-12 text-muted-foreground/50" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Action Badge */}
      <div className={`absolute top-2 right-2 p-1.5 rounded-full ${actionConfig.bg} shadow-lg`}>
        <ActionIcon className="w-3 h-3 text-white" />
      </div>

      {/* Content Type Badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium">
        {item.contentType}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>{formattedDate}</span>
          {item.rating && (
            <span className="flex items-center gap-0.5">
              ★ {item.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Hover Play Button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-3 rounded-full bg-primary shadow-lg shadow-primary/40 transform scale-75 group-hover:scale-100 transition-transform">
          <Play className="w-6 h-6 text-white" fill="white" />
        </div>
      </div>
    </button>
  );
}
