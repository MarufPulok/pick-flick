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
import {
    clearWatching,
    getCurrentlyWatching,
    isWatching,
    markAsWatching,
} from '@/lib/watching-state';
import { ArrowLeft, Calendar, Check, Clapperboard, Copy, Film, Loader2, Play, Sparkles, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UniversalFreeStreamingSection } from './universal-free-streaming-section';

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
  const [isCopied, setIsCopied] = useState(false);
  const [isCurrentlyWatching, setIsCurrentlyWatching] = useState(false);

  // Check if this content is being watched on mount
  useEffect(() => {
    setIsCurrentlyWatching(isWatching(recommendation.tmdbId));
  }, [recommendation.tmdbId]);

  const getYear = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  // Handle "I'm watching this" action
  const handleStartWatching = useCallback(() => {
    markAsWatching({
      tmdbId: recommendation.tmdbId,
      contentType: recommendation.contentType,
      title: recommendation.title,
      posterUrl: recommendation.posterUrl,
    });
    setIsCurrentlyWatching(true);
    toast.success(`Enjoy watching "${recommendation.title}"! 🎬`);
  }, [recommendation]);

  // Handle stopping watching (mark as watched)
  const handleStopWatching = useCallback(() => {
    clearWatching();
    setIsCurrentlyWatching(false);
    onRecordAction('WATCHED');
  }, [onRecordAction]);

  // Copy title to clipboard
  const handleCopyTitle = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recommendation.title);
      setIsCopied(true);
      toast.success('Title copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = recommendation.title;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        toast.success('Title copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        toast.error('Failed to copy title');
      }
      document.body.removeChild(textArea);
    }
  }, [recommendation.title]);

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
                <div className="flex items-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-bold leading-tight flex-1">
                    {recommendation.title}
                  </h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleCopyTitle}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0 mt-1"
                        aria-label="Copy title to clipboard"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isCopied ? 'Copied!' : 'Copy title'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                            className="relative block w-9 h-9 rounded-lg overflow-hidden bg-black/20 hover:scale-110 transition-transform ring-1 ring-white/10 hover:ring-primary/50"
                          >
                            <Image
                              src={provider.logoUrl}
                              alt={provider.name}
                              fill
                              className="object-cover"
                              unoptimized
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

              {/* Universal Free Streaming Section */}
              <UniversalFreeStreamingSection 
                title={recommendation.title}
                contentType={recommendation.contentType}
                maxServices={4}
              />

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
              {/* I'm Watching This Button */}
              {isCurrentlyWatching ? (
                <button
                  onClick={handleStopWatching}
                  disabled={isRecording}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-5 h-5" />
                  Done Watching - Mark as Watched
                </button>
              ) : (
                <button
                  onClick={handleStartWatching}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-lg shadow-violet-500/20"
                >
                  <Clapperboard className="w-5 h-5" />
                  I&apos;m Watching This Now
                </button>
              )}

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
