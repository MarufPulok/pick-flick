/**
 * RecommendationCard Component
 * Displays a single recommendation with feedback actions
 * Single Responsibility: Only handles recommendation display and user feedback
 */

'use client';

import { Calendar, Check, Film, Loader2, Sparkles, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import Image from 'next/image';

export interface Recommendation {
  tmdbId: number;
  title: string;
  overview: string;
  posterUrl?: string;
  contentType: 'MOVIE' | 'SERIES' | 'ANIME';
  releaseDate?: string;
  rating?: number;
  voteCount?: number;
  originalLanguage?: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  isLoading: boolean;
  isRecording: boolean;
  onRecordAction: (action: 'WATCHED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED') => void;
  onGetAnother: () => void;
  onBack: () => void;
}

export function RecommendationCard({
  recommendation,
  isLoading,
  isRecording,
  onRecordAction,
  onGetAnother,
  onBack,
}: RecommendationCardProps) {
  const getYear = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        {/* Poster */}
        <div className="relative aspect-[2/3] bg-muted">
          {recommendation.posterUrl ? (
            <Image
              src={recommendation.posterUrl}
              alt={recommendation.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 flex flex-col">
          <div className="flex-1">
            {/* Title and Type Badge */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {recommendation.contentType === 'MOVIE' && '🎬 Movie'}
                  {recommendation.contentType === 'SERIES' && '📺 Series'}
                  {recommendation.contentType === 'ANIME' && '⚡ Anime'}
                </div>
                {recommendation.originalLanguage && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs font-medium">
                    🌐 {recommendation.originalLanguage.toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold leading-tight">
                {recommendation.title}
              </h2>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-border">
              {recommendation.releaseDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {getYear(recommendation.releaseDate)}
                  </span>
                </div>
              )}
              {recommendation.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-medium">
                    {recommendation.rating.toFixed(1)}/10
                  </span>
                </div>
              )}
              {recommendation.voteCount && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    ({recommendation.voteCount.toLocaleString()} votes)
                  </span>
                </div>
              )}
            </div>

            {/* Overview */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Overview
              </h3>
              <p className="text-sm leading-relaxed">
                {recommendation.overview || 'No overview available.'}
              </p>
            </div>
          </div>

          {/* Feedback & Actions */}
          <div className="space-y-3 mt-6">
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onRecordAction('WATCHED')}
                disabled={isRecording}
                className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Watched
              </button>
              <button
                onClick={() => onRecordAction('BLACKLISTED')}
                disabled={isRecording}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Not Interested
              </button>
            </div>

            {/* Like/Dislike */}
            <div className="flex gap-3">
              <button
                onClick={() => onRecordAction('LIKED')}
                disabled={isRecording}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-green-500 hover:bg-green-500/10 text-green-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Like
              </button>
              <button
                onClick={() => onRecordAction('DISLIKED')}
                disabled={isRecording}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-red-500 hover:bg-red-500/10 text-red-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Dislike
              </button>
            </div>

            {/* Get Another / Back */}
            <div className="flex gap-3 pt-2 border-t border-border">
              <button
                onClick={onGetAnother}
                disabled={isLoading}
                className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Get Another
                  </>
                )}
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
