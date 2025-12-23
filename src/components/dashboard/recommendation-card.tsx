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
    markAsWatching,
    onWatchingStateChange,
} from '@/lib/watching-state';
import { ArrowLeft, Calendar, Check, Clapperboard, Copy, Film, Loader2, Play, PlayCircle, Sparkles, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StreamPlayer } from './stream-player';
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
  const [showStream, setShowStream] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCurrentlyWatching, setIsCurrentlyWatching] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Sync watching state from storage
  const syncWatchingState = useCallback(() => {
    const current = getCurrentlyWatching();
    setIsCurrentlyWatching(current?.tmdbId === recommendation.tmdbId);
    setHasActiveSession(current !== null);
  }, [recommendation.tmdbId]);

  // Check watching state on mount and subscribe to changes
  useEffect(() => {
    syncWatchingState();
    const unsubscribe = onWatchingStateChange(syncWatchingState);
    return unsubscribe;
  }, [syncWatchingState]);

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
        {/* Main Grid: Poster + Title/Actions on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 p-4 sm:p-6">
          {/* Left Column: Poster */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[2/3] bg-muted w-full max-w-[200px] mx-auto md:mx-0 rounded-xl overflow-hidden">
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
                  <Film className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
            </div>
            
            {/* Stats below poster on desktop */}
            <div className="hidden md:flex flex-col gap-2 text-sm">
              {recommendation.releaseDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{getYear(recommendation.releaseDate)}</span>
                </div>
              )}
              {recommendation.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{recommendation.rating.toFixed(1)}/10</span>
                  {recommendation.voteCount && (
                    <span className="text-xs text-muted-foreground">
                      ({recommendation.voteCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Trailer button on desktop */}
            {recommendation.trailerUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                className="hidden md:flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                Trailer
              </button>
            )}
            
            {/* Watch Now button on desktop */}
            <button
              onClick={() => setShowStream(true)}
              className="hidden md:flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              Watch Now
            </button>
          </div>

          {/* Right Column: Content */}
          <div className="flex flex-col">
            {/* Title Row */}
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {recommendation.contentType === 'MOVIE' && '🎬 Movie'}
                    {recommendation.contentType === 'SERIES' && '📺 Series'}
                    {recommendation.contentType === 'ANIME' && '⚡ Anime'}
                  </span>
                  {recommendation.originalLanguage && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs">
                      🌐 {recommendation.originalLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight">
                  {recommendation.title}
                </h2>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyTitle}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
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

            {/* Mobile: Stats Row */}
            <div className="flex md:hidden flex-wrap items-center gap-3 mb-3 text-sm">
              {recommendation.releaseDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{getYear(recommendation.releaseDate)}</span>
                </div>
              )}
              {recommendation.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{recommendation.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Streaming Providers (Paid) */}
            {recommendation.watchProviders?.flatrate && recommendation.watchProviders.flatrate.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Stream on:</span>
                <div className="flex items-center gap-1.5">
                  {recommendation.watchProviders.flatrate.slice(0, 4).map((provider, idx) => (
                    <Tooltip key={`${provider.providerId}-${idx}`}>
                      <TooltipTrigger asChild>
                        <a
                          href={recommendation.watchProviders?.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block w-7 h-7 rounded-md overflow-hidden bg-black/20 hover:scale-110 transition-transform ring-1 ring-white/10"
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
                        <p>{provider.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {/* Free Streaming Section */}
            <UniversalFreeStreamingSection 
              title={recommendation.title}
              contentType={recommendation.contentType}
              maxServices={4}
              tmdbId={recommendation.tmdbId}
            />

            {/* Overview - Collapsible on mobile */}
            <div className="mb-3">
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {recommendation.overview || 'No overview available.'}
              </p>
            </div>

            {/* Why This Pick? */}
            {recommendation.explanation && (
              <div className="mb-3 p-2.5 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
                <div className="flex items-start gap-2">
                  <span className="text-sm leading-none">{recommendation.explanation.title.split(' ')[0]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">
                      {recommendation.explanation.title.split(' ').slice(1).join(' ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {recommendation.explanation.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: Trailer Button */}
            {recommendation.trailerUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                className="md:hidden mb-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                Watch Trailer
              </button>
            )}

            {/* Mobile: Watch Now Button */}
            <button
              onClick={() => setShowStream(true)}
              className="md:hidden mb-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              Watch Now Free
            </button>

            {/* Feedback & Actions */}
            <div className="space-y-3 mt-4 pt-3 border-t border-border">
              {/* I'm Watching This + Quick Actions Row */}
              <div className="flex items-center gap-2">
                {/* I'm Watching Button */}
                {isCurrentlyWatching ? (
                  <button
                    onClick={handleStopWatching}
                    disabled={isRecording}
                    className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Done Watching
                  </button>
                ) : (
                  <button
                    onClick={handleStartWatching}
                    disabled={hasActiveSession}
                    className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:from-gray-500 disabled:to-gray-600"
                    title={hasActiveSession ? 'Finish current show first' : undefined}
                  >
                    <Clapperboard className="w-4 h-4" />
                    {hasActiveSession ? 'Watching...' : "I'm Watching"}
                  </button>
                )}

                {/* Quick Action Icons */}
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onRecordAction('WATCHED')}
                        disabled={isRecording}
                        className="w-10 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50 inline-flex items-center justify-center"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>Watched</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onRecordAction('LIKED')}
                        disabled={isRecording}
                        className="w-10 h-10 rounded-lg border border-green-500 hover:bg-green-500/20 text-green-500 transition-all disabled:opacity-50 inline-flex items-center justify-center"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>Like</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onRecordAction('DISLIKED')}
                        disabled={isRecording}
                        className="w-10 h-10 rounded-lg border border-red-500 hover:bg-red-500/20 text-red-500 transition-all disabled:opacity-50 inline-flex items-center justify-center"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>Dislike</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onRecordAction('BLACKLISTED')}
                        disabled={isRecording}
                        className="w-10 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 inline-flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>Not Interested</p></TooltipContent>
                  </Tooltip>
                </div>
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

      {/* Stream Player */}
      {showStream && (
        <StreamPlayer
          tmdbId={recommendation.tmdbId}
          contentType={recommendation.contentType}
          title={recommendation.title}
          onClose={() => setShowStream(false)}
        />
      )}
    </TooltipProvider>
  );
}
