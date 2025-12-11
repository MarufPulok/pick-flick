/**
 * RecommendationCard Component
 * Polished recommendation card with genre chips and additional info
 */

'use client';

import { GENRES } from '@/config/app.config';
import { ArrowLeft, Check, Clock, Loader2, RefreshCw, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import Image from 'next/image';

// Create a lookup map for genre ID to name
const GENRE_MAP: Record<number, { name: string; icon: string }> = {};
Object.values(GENRES).forEach((genre) => {
  GENRE_MAP[genre.id] = { name: genre.name, icon: genre.icon };
});

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
  runtime?: number; // in minutes
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  isLoading: boolean;
  isRecording: boolean;
  onRecordAction: (action: 'WATCHED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED') => void;
  onGetAnother: () => void;
  onBack: () => void;
}

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  variant: 'green' | 'red' | 'outline-green' | 'outline-red';
}

function ActionButton({ onClick, disabled, icon, label, variant }: ActionButtonProps) {
  const baseClass = "relative group p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    'green': 'bg-green-600 hover:bg-green-700 text-white',
    'red': 'bg-red-600 hover:bg-red-700 text-white',
    'outline-green': 'border-2 border-green-500 hover:bg-green-500/10 text-green-500',
    'outline-red': 'border-2 border-red-500 hover:bg-red-500/10 text-red-500',
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClass} ${variants[variant]}`}>
      {icon}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {label}
      </span>
    </button>
  );
}

function GenreChip({ genreId }: { genreId: number }) {
  const genre = GENRE_MAP[genreId];
  if (!genre) return null;
  
  return (
    <span className="px-2 py-0.5 rounded-full bg-secondary/80 text-xs font-medium text-muted-foreground">
      {genre.icon} {genre.name}
    </span>
  );
}

export function RecommendationCard({
  recommendation,
  isLoading,
  isRecording,
  onRecordAction,
  onGetAnother,
  onBack,
}: RecommendationCardProps) {
  const year = recommendation.releaseDate 
    ? new Date(recommendation.releaseDate).getFullYear() 
    : null;

  const typeEmoji = {
    'MOVIE': '🎬',
    'SERIES': '📺',
    'ANIME': '⚡',
  }[recommendation.contentType];

  const typeLabel = recommendation.contentType === 'ANIME' 
    ? 'Anime' 
    : recommendation.contentType === 'SERIES' 
    ? 'Series' 
    : 'Movie';

  // Get first 4 genres
  const displayGenres = (recommendation.genreIds || []).slice(0, 4);

  return (
    <div className="glass rounded-xl h-full flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <button
          onClick={onBack}
          className="p-2 -m-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {typeEmoji} {typeLabel}
          </span>
          {recommendation.originalLanguage && (
            <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium uppercase">
              {recommendation.originalLanguage}
            </span>
          )}
        </div>
        
        <button
          onClick={onGetAnother}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Next</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
        {/* Poster with proper 2:3 aspect ratio */}
        <div className="shrink-0">
          <div className="relative w-28 sm:w-36 aspect-[2/3] rounded-lg overflow-hidden bg-secondary shadow-lg">
            {recommendation.posterUrl ? (
              <Image
                src={recommendation.posterUrl}
                alt={recommendation.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">
                {typeEmoji}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Title */}
          <h2 className="text-lg sm:text-xl font-bold leading-tight mb-2 line-clamp-2">
            {recommendation.title}
          </h2>

          {/* Meta info row */}
          <div className="flex items-center gap-3 text-sm mb-2 flex-wrap">
            {year && (
              <span className="text-muted-foreground">{year}</span>
            )}
            {recommendation.rating && (
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-4 h-4 fill-amber-500" />
                {recommendation.rating.toFixed(1)}
              </span>
            )}
            {recommendation.voteCount && recommendation.voteCount > 1000 && (
              <span className="text-xs text-muted-foreground">
                {(recommendation.voteCount / 1000).toFixed(1)}k votes
              </span>
            )}
            {recommendation.runtime && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="w-3 h-3" />
                {recommendation.runtime}m
              </span>
            )}
          </div>

          {/* Genre Chips */}
          {displayGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayGenres.map((genreId) => (
                <GenreChip key={genreId} genreId={genreId} />
              ))}
            </div>
          )}

          {/* Overview */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {recommendation.overview || 'No overview available.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-center gap-3 p-3 border-t border-border/50 bg-secondary/30">
        <ActionButton
          onClick={() => onRecordAction('WATCHED')}
          disabled={isRecording}
          icon={<Check className="w-5 h-5" />}
          label="Watched"
          variant="green"
        />
        <ActionButton
          onClick={() => onRecordAction('LIKED')}
          disabled={isRecording}
          icon={<ThumbsUp className="w-5 h-5" />}
          label="Like"
          variant="outline-green"
        />
        <ActionButton
          onClick={() => onRecordAction('DISLIKED')}
          disabled={isRecording}
          icon={<ThumbsDown className="w-5 h-5" />}
          label="Dislike"
          variant="outline-red"
        />
        <ActionButton
          onClick={() => onRecordAction('BLACKLISTED')}
          disabled={isRecording}
          icon={<X className="w-5 h-5" />}
          label="Skip"
          variant="red"
        />
      </div>
    </div>
  );
}
