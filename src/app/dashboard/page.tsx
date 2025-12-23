/**
 * Dashboard Page
 * Orchestrates recommendation generation with Smart & Filtered modes
 * 
 * SOLID Principles Applied:
 * - S: Page only orchestrates, components handle their own concerns
 * - O: New modes/features can be added via new components
 * - L: Components are interchangeable with proper interfaces
 * - I: Components receive only the props they need
 * - D: Components depend on abstractions (callbacks) not implementations
 */

'use client';

import {
    ActivityFeed,
    CurrentlyWatchingBanner,
    GeneratorForm,
    QuickMoods,
    Recommendation,
    RecommendationCard,
    StatsCards,
    WelcomeHeader,
} from '@/components/dashboard';
import { RATING_TIERS } from '@/config/app.config';
import { useHistoryActions } from '@/hooks/use-history-actions';
import { useStats } from '@/hooks/use-stats';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

type Mode = 'SMART' | 'FILTERED';

interface FilterState {
  contentType: string;
  genre: string;
  language: string;
  rating: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { stats } = useStats();
  const { recordAction, isRecording } = useHistoryActions();

  const [mode, setMode] = useState<Mode>('SMART');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    contentType: 'MOVIE',
    genre: '',
    language: 'en',
    rating: 'ANY',
  });

  // Generate recommendation
  const handleGenerate = useCallback(async (overrideGenres?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const genresToUse = overrideGenres || (filters.genre ? [filters.genre] : []);
      
      const body = mode === 'SMART' && !overrideGenres
        ? { mode: 'SMART' }
        : {
            mode: 'FILTERED',
            contentType: filters.contentType,
            genres: genresToUse,
            language: filters.language,
            minRating: RATING_TIERS[filters.rating as keyof typeof RATING_TIERS].min,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [mode, filters]);

  // Handle mood-based quick pick
  const handleMoodSelect = useCallback((genres: string[]) => {
    // Switch to filtered mode with selected genres
    if (genres.length > 0) {
      setFilters(prev => ({ ...prev, genre: genres[0] }));
    }
    handleGenerate(genres);
  }, [handleGenerate]);

  // Record user action on recommendation
  const handleRecordAction = useCallback((action: 'WATCHED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED') => {
    if (!recommendation || isRecording) return;

    recordAction({
      tmdbId: recommendation.tmdbId,
      contentType: recommendation.contentType,
      action,
      title: recommendation.title,
      posterPath: recommendation.posterUrl,
      rating: recommendation.rating,
      releaseDate: recommendation.releaseDate,
      source: mode,
      // For preference weight learning
      genreIds: recommendation.genreIds,
      originalLanguage: recommendation.originalLanguage,
    });

    // Blacklist: generate new recommendation
    if (action === 'BLACKLISTED') {
      setRecommendation(null);
      handleGenerate();
    }
  }, [recommendation, isRecording, recordAction, mode, handleGenerate]);

  // Auth loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-animated px-4 sm:px-6 py-8 sm:py-12 pt-20 sm:pt-24">
      <div className="max-w-5xl mx-auto">
        {/* Welcome Header */}
        <WelcomeHeader userName={session?.user?.name || undefined} />

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Quick Moods - only show when not viewing recommendation */}
        {!recommendation && (
          <QuickMoods onSelectMood={handleMoodSelect} />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Generator or Recommendation */}
          <div>
            {!recommendation ? (
              <GeneratorForm
                mode={mode}
                onModeChange={setMode}
                filters={filters}
                onFilterChange={setFilters}
                isLoading={isLoading}
                error={error}
                onGenerate={() => handleGenerate()}
              />
            ) : (
              <RecommendationCard
                recommendation={recommendation}
                isLoading={isLoading}
                isRecording={isRecording}
                onRecordAction={handleRecordAction}
                onGetAnother={() => handleGenerate()}
                onBack={() => setRecommendation(null)}
              />
            )}
          </div>

          {/* Right: Activity Feed */}
          <div className="hidden lg:block">
            <ActivityFeed limit={6} />
          </div>
        </div>

        {/* Mobile Activity Feed */}
        <div className="lg:hidden mt-6">
          <ActivityFeed limit={4} />
        </div>
      </div>

      {/* Currently Watching Banner - Fixed at bottom */}
      <CurrentlyWatchingBanner />
    </div>
  );
}
