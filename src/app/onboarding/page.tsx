'use client';

import {
  ContentTypeStep,
  GenreStep,
  LanguageStep,
  ProgressIndicator,
  StepNavigation,
} from '@/components/onboarding';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type ContentType = 'MOVIE' | 'SERIES' | 'ANIME';

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Load existing profile
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.complete && data.profile) {
          setContentTypes(data.profile.contentTypes);
          setSelectedGenres(data.profile.genres);
          setSelectedLanguages(data.profile.languages);
          setMinRating(data.profile.minRating);
          setIsEditMode(true);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Toggle content type with auto-Japanese for anime
  const toggleContentType = useCallback((type: ContentType) => {
    setContentTypes((prev) => {
      const isAdding = !prev.includes(type);
      const newTypes = isAdding ? [...prev, type] : prev.filter((t) => t !== type);

      if (type === 'ANIME' && isAdding) {
        // Check inside the updater: the closed-over list can be stale and add 'ja' twice.
        setSelectedLanguages((langs) => (langs.includes('ja') ? langs : [...langs, 'ja']));
      }

      return newTypes;
    });
  }, [selectedLanguages]);

  // Toggle genre selection
  const toggleGenre = useCallback((genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((g) => g !== genreId)
        : [...prev, genreId]
    );
  }, []);

  // Toggle language (prevent removing Japanese if anime selected)
  const toggleLanguage = useCallback((langCode: string) => {
    if (langCode === 'ja' && contentTypes.includes('ANIME') && selectedLanguages.includes('ja')) {
      return;
    }
    setSelectedLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((l) => l !== langCode)
        : [...prev, langCode]
    );
  }, [contentTypes, selectedLanguages]);

  // Navigation
  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  // Submit preferences
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTypes,
          genres: selectedGenres,
          languages: selectedLanguages,
          animeAutoLanguage: true,
          minRating,
        }),
      });

      if (response.ok) {
        toast.success(isEditMode ? 'Preferences updated!' : 'Profile created!');
        router.push('/dashboard');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [contentTypes, selectedGenres, selectedLanguages, minRating, isEditMode, router]);

  // Validation
  const canProceed = useCallback(() => {
    if (step === 1) return contentTypes.length > 0;
    if (step === 2) return selectedGenres.length >= 3;
    if (step === 3) return selectedLanguages.length > 0;
    return false;
  }, [step, contentTypes, selectedGenres, selectedLanguages]);

  // Loading state
  if (status === 'loading' || isLoading) {
    return <div className="bg-background min-h-dvh" aria-busy="true" />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-dvh transition-opacity duration-300 starting:opacity-0">
      <div className="mx-auto max-w-[720px] px-4 sm:px-6 pt-24 pb-24">
        <ProgressIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        <div key={step} className="reel-swap mt-10">
          {step === 1 && <ContentTypeStep selected={contentTypes} onToggle={toggleContentType} />}

          {step === 2 && (
            <GenreStep contentTypes={contentTypes} selected={selectedGenres} onToggle={toggleGenre} />
          )}

          {step === 3 && (
            <LanguageStep
              contentTypes={contentTypes}
              selectedLanguages={selectedLanguages}
              minRating={minRating}
              onToggleLanguage={toggleLanguage}
              onSetMinRating={setMinRating}
            />
          )}
        </div>

        <StepNavigation
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          canProceed={canProceed()}
          isSubmitting={isSubmitting}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
