'use client';

/**
 * Dashboard Page  
 * Main recommendation generator with Smart & Filtered modes
 */

import { ANIME_GENRES, CONTENT_TYPES, GENRES, LANGUAGES, RATING_TIERS } from '@/config/app.config';
import { useHistoryActions } from '@/hooks/use-history-actions';
import { useStats } from '@/hooks/use-stats';
import { Calendar, Check, Film, Loader2, Sliders, Sparkles, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Mode = 'SMART' | 'FILTERED';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { stats } = useStats();
  const { recordAction, isRecording } = useHistoryActions();
  
  const [mode, setMode] = useState<Mode>('SMART');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtered mode state
  const [selectedContentType, setSelectedContentType] = useState<string>('MOVIE');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedRating, setSelectedRating] = useState<string>('ANY');

  // Stats are now handled by useStats hook

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const body = mode === 'SMART' 
        ? { mode: 'SMART' }
        : {
            mode: 'FILTERED',
            contentType: selectedContentType,
            genres: selectedGenre ? [selectedGenre] : [],
            language: selectedLanguage,
            minRating: RATING_TIERS[selectedRating as keyof typeof RATING_TIERS].min,
          };

      const response = await fetch('/api/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate recommendation');
      }

      const data = await response.json();
      setRecommendation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordAction = (action: 'WATCHED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED') => {
    if (!recommendation || isRecording) return;

    recordAction({
      tmdbId: recommendation.tmdbId,
      contentType: recommendation.contentType,
      action,
      title: recommendation.title,
      posterPath: recommendation.posterPath,
      rating: recommendation.rating,
      releaseDate: recommendation.releaseDate,
      source: mode,
    });

    // Handle blacklist - generate new recommendation
    if (action === 'BLACKLISTED') {
      setRecommendation(null);
      handleGenerate();
    }
  };

  const getYear = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  const availableGenres = selectedContentType === 'ANIME' 
    ? Object.values(ANIME_GENRES)
    : Object.values(GENRES);

  return (
    <div className="min-h-screen bg-gradient-animated px-4 py-12 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            Hey, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Ready for your perfect pick?
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold mb-1">{stats.watchedCount}</div>
              <div className="text-sm text-muted-foreground">Watched</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold mb-1">{stats.likedCount}</div>
              <div className="text-sm text-muted-foreground">Liked</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold mb-1">{stats.dislikedCount}</div>
              <div className="text-sm text-muted-foreground">Disliked</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              </div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        )}

        {/* Generator */}
        {!recommendation && (
          <div className="glass rounded-2xl p-8">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-8 p-1 bg-secondary rounded-lg max-w-md mx-auto">
              <button
                onClick={() => setMode('SMART')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'SMART' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-secondary-foreground/10'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Smart Mode
              </button>
              <button
                onClick={() => setMode('FILTERED')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'FILTERED' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-secondary-foreground/10'
                }`}
              >
                <Sliders className="w-4 h-4 inline mr-2" />
                Filtered Mode
              </button>
            </div>

            {mode === 'SMART' ? (
              /* Smart Mode */
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Feeling Lucky?</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Get one perfect recommendation based on your taste profile
                </p>
              </div>
            ) : (
              /* Filtered Mode */
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Content Type</label>
                  <select
                    value={selectedContentType}
                    onChange={(e) => setSelectedContentType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CONTENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type === 'MOVIE' && '🎬 Movies'}
                        {type === 'SERIES' && '📺 TV Series'}
                        {type === 'ANIME' && '⚡ Anime'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Genre (Optional)</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Any Genre</option>
                    {availableGenres.map((genre) => (
                      <option key={genre.id} value={String(genre.id)}>
                        {genre.icon} {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.values(LANGUAGES).map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                  <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.entries(RATING_TIERS).map(([key, tier]) => (
                      <option key={key} value={key}>
                        ⭐ {tier.label} - {tier.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-destructive text-sm mb-3">{error}</p>
                {error.includes('onboarding') && (
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Complete Onboarding
                  </Link>
                )}
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg glow hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finding your pick...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {mode === 'SMART' ? 'Get My Pick' : 'Generate'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Recommendation Card */}
        {recommendation && (
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
                      onClick={() => handleRecordAction('WATCHED')}
                      disabled={isRecording}
                      className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Watched
                    </button>
                    <button
                      onClick={() => handleRecordAction('BLACKLISTED')}
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
                      onClick={() => handleRecordAction('LIKED')}
                      disabled={isRecording}
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-green-500 hover:bg-green-500/10 text-green-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Like
                    </button>
                    <button
                      onClick={() => handleRecordAction('DISLIKED')}
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
                      onClick={handleGenerate}
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
                      onClick={() => setRecommendation(null)}
                      className="px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
