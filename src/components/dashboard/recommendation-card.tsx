/**
 * RecommendationCard Component
 * Displays a single recommendation with feedback actions
 * Single Responsibility: Only handles recommendation display and user feedback
 */

'use client';

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Check, Film, Loader2, Play, Sparkles, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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
  genreIds?: number[];
  trailerUrl?: string;
  explanation?: {
    title: string;
    description: string;
  };
  watchProviders?: {
    flatrate?: Array<{ name: string; logoUrl: string; providerId: number }>;
    link?: string;
  };
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
  const [showTrailer, setShowTrailer] = useState(false);

  const getYear = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-4 sm:gap-6">
          {/* Poster */}
          <div className="relative aspect-[2/3] bg-muted w-full max-w-[300px] mx-auto md:mx-0">
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
          <div className="p-4 sm:p-6 flex flex-col">
            <div className="flex-1">
              {/* Title and Type Badge */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
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
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                  {recommendation.title}
                </h2>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 pb-4 border-b border-border">
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

              {/* Streaming Availability */}
              {recommendation.watchProviders?.flatrate && recommendation.watchProviders.flatrate.length > 0 && (
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">Stream on:</span>
                  <div className="flex items-center gap-2">
                    {recommendation.watchProviders.flatrate.map((provider, idx) => (
                      <Tooltip key={`${provider.providerId}-${idx}`}>
                        <TooltipTrigger asChild>
                          <a
                            href={recommendation.watchProviders?.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-9 h-9 rounded-lg overflow-hidden bg-black/20 hover:scale-110 transition-transform ring-1 ring-white/10 hover:ring-primary/50"
                          >
                            <img
                              src={provider.logoUrl}
                              alt={provider.name}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Watch on {provider.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Overview
                </h3>
                <p className="text-sm leading-relaxed">
                  {recommendation.overview || 'No overview available.'}
                </p>
              </div>

              {/* Why This Pick? - Enhanced card display */}
              {recommendation.explanation && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5">{recommendation.explanation.title.split(' ')[0]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {recommendation.explanation.title.split(' ').slice(1).join(' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {recommendation.explanation.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trailer Button - Opens Modal */}
              {recommendation.trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="mb-4 group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600/90 to-red-700/90 text-white text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow-md"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Trailer
                </button>
              )}
            </div>

            {/* Feedback & Actions */}
            <div className="space-y-4 mt-6">
              {/* Icon Actions Row */}
              <div className="flex items-center justify-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onRecordAction('WATCHED')}
                      disabled={isRecording}
                      className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center hover:scale-110"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Watched</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onRecordAction('LIKED')}
                      disabled={isRecording}
                      className="w-12 h-12 rounded-full border-2 border-green-500 hover:bg-green-500/20 text-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center hover:scale-110"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Like</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onRecordAction('DISLIKED')}
                      disabled={isRecording}
                      className="w-12 h-12 rounded-full border-2 border-red-500 hover:bg-red-500/20 text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center hover:scale-110"
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dislike</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onRecordAction('BLACKLISTED')}
                      disabled={isRecording}
                      className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center hover:scale-110"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Not Interested</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Get Another / Back */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button
                  onClick={onGetAnother}
                  disabled={isLoading}
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onBack}
                      className="w-12 h-12 rounded-xl border border-border hover:bg-secondary transition-colors inline-flex items-center justify-center"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Back</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <Dialog open={showTrailer} onOpenChange={setShowTrailer}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 border-0 bg-black overflow-hidden">
          <DialogTitle className="sr-only">
            {recommendation.title} - Trailer
          </DialogTitle>
          <div className="aspect-video w-full">
            {showTrailer && recommendation.trailerUrl && (
              <iframe
                src={`${recommendation.trailerUrl}?autoplay=1`}
                title={`${recommendation.title} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
