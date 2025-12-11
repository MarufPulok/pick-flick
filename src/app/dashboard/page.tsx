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

import { GeneratorForm, Recommendation, RecommendationCard, StatsCards } from '@/components/dashboard';
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
  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const body = mode === 'SMART'
        ? { mode: 'SMART' }
        : {
            mode: 'FILTERED',
            contentType: filters.contentType,
            genres: filters.genre ? [filters.genre] : [],
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
    <div className="min-h-screen bg-gradient-animated px-4 py-12 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            Hey, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Ready for your perfect pick?
          </p>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Generator or Recommendation */}
        {!recommendation ? (
          <GeneratorForm
            mode={mode}
            onModeChange={setMode}
            filters={filters}
            onFilterChange={setFilters}
            isLoading={isLoading}
            error={error}
            onGenerate={handleGenerate}
          />
        ) : (
          <RecommendationCard
            recommendation={recommendation}
            isLoading={isLoading}
            isRecording={isRecording}
            onRecordAction={handleRecordAction}
            onGetAnother={handleGenerate}
            onBack={() => setRecommendation(null)}
          />
        )}
      </div>
    </div>
  );
}
