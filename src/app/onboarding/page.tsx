/**
 * Onboarding Page
 * Multi-step form for collecting user preferences
 * 
 * SOLID Principles Applied:
 * - S: Page orchestrates, step components handle their own concerns
 * - O: New steps can be added without modifying existing ones
 * - L: Step components are interchangeable with proper interfaces
 * - I: Components receive only the props they need
 * - D: Components depend on callbacks (abstractions) not implementations
 */

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

      if (type === 'ANIME' && isAdding && !selectedLanguages.includes('ja')) {
        setSelectedLanguages((langs) => [...langs, 'ja']);
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
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-animated px-4 sm:px-6 py-8 sm:py-12 pt-20 sm:pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {isEditMode ? 'Update Your Preferences' : "Let's Get Started"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            {isEditMode
              ? 'Adjust your preferences to get better recommendations'
              : "Tell us what you like, and we'll find your perfect picks"}
          </p>
          <ProgressIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Step Content */}
        <div className="glass rounded-2xl p-5 sm:p-6 lg:p-8 mb-6">
          {step === 1 && (
            <ContentTypeStep
              selected={contentTypes}
              onToggle={toggleContentType}
            />
          )}

          {step === 2 && (
            <GenreStep
              contentTypes={contentTypes}
              selected={selectedGenres}
              onToggle={toggleGenre}
            />
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

        {/* Navigation */}
        <StepNavigation
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          canProceed={canProceed()}
          isSubmitting={isSubmitting}
          isEditMode={isEditMode}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
