'use client';

/**
 * Onboarding Page
 * Multi-step form for collecting user preferences
 */

import { ANIME_GENRES, CONTENT_TYPES, GENRES, LANGUAGES } from '@/config/app.config';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ContentType = 'MOVIE' | 'SERIES' | 'ANIME';

const CONTENT_TYPE_INFO = {
  MOVIE: { emoji: '🎬', label: 'Movies', description: 'Feature films' },
  SERIES: { emoji: '📺', label: 'TV Series', description: 'Shows & episodes' },
  ANIME: { emoji: '⚡', label: 'Anime', description: 'Japanese animation' },
} as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Load existing profile on mount
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
          // Pre-populate form with existing data
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

  // Redirect if not authenticated (using useEffect to avoid setState in render)
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  // Don't render form if unauthenticated
  if (status === 'unauthenticated') {
    return null;
  }

  const toggleContentType = (type: ContentType) => {
    setContentTypes((prev) => {
      const isAdding = !prev.includes(type);
      const newTypes = isAdding ? [...prev, type] : prev.filter((t) => t !== type);
      
      // Auto-add Japanese when anime is selected
      if (type === 'ANIME' && isAdding && !selectedLanguages.includes('ja')) {
        setSelectedLanguages((langs) => [...langs, 'ja']);
      }
      
      return newTypes;
    });
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((g) => g !== genreId)
        : [...prev, genreId]
    );
  };

  const toggleLanguage = (langCode: string) => {
    // Prevent removing Japanese if anime is selected
    if (langCode === 'ja' && contentTypes.includes('ANIME') && selectedLanguages.includes('ja')) {
      return;
    }
    
    setSelectedLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((l) => l !== langCode)
        : [...prev, langCode]
    );
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
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
        router.push('/dashboard');
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return contentTypes.length > 0;
    if (step === 2) return selectedGenres.length >= 3;
    if (step === 3) return selectedLanguages.length > 0;
    return false;
  };

  // Get relevant genres based on selected content types
  const hasAnime = contentTypes.includes('ANIME');
  const hasMovieOrSeries = contentTypes.includes('MOVIE') || contentTypes.includes('SERIES');
  
  const relevantGenres = 
    hasAnime && hasMovieOrSeries
      ? [...Object.values(GENRES), ...Object.values(ANIME_GENRES)]  // Show all if mixed
      : hasAnime
      ? Object.values(ANIME_GENRES)  // Only anime genres
      : Object.values(GENRES);  // Only regular genres

  return (
    <div className="min-h-screen bg-gradient-animated px-4 py-12 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            {isEditMode ? 'Update Your Preferences' : "Let's Get Started"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode 
              ? 'Adjust your preferences to get better recommendations'
              : "Tell us what you like, and we'll find your perfect picks"
            }
          </p>
          
          
          {/* Progress */}
          <div className="flex gap-2 justify-center mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="glass rounded-2xl p-8 mb-6">
          {/* Step 1: Content Types */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">What do you watch?</h2>
                <p className="text-muted-foreground">Select all that apply</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CONTENT_TYPES.map((type) => {
                  const info = CONTENT_TYPE_INFO[type];
                  return (
                    <button
                      key={type}
                      onClick={() => toggleContentType(type)}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        contentTypes.includes(type)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-4xl mb-3">{info.emoji}</div>
                      <div className="font-semibold mb-1">{info.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {info.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Genres */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Pick your favorites</h2>
                <p className="text-muted-foreground">
                  Choose at least 3 genres you love
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {relevantGenres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(String(genre.id))}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      selectedGenres.includes(String(genre.id))
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="mr-2">{genre.icon}</span>
                    {genre.name}
                  </button>
                ))}
              </div>

              {selectedGenres.length > 0 && selectedGenres.length < 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  {3 - selectedGenres.length} more to go!
                </p>
              )}
            </div>
          )}

          {/* Step 3: Languages */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Language preferences</h2>
                <p className="text-muted-foreground">
                  Which languages do you prefer?
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(LANGUAGES).map((lang) => {
                  const isJapaneseLocked = lang.code === 'ja' && contentTypes.includes('ANIME');
                  return (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      disabled={isJapaneseLocked}
                      className={`px-4 py-3 rounded-lg border transition-all text-left ${
                        selectedLanguages.includes(lang.code)
                          ? 'border-primary bg-primary/10 font-medium'
                          : 'border-border hover:border-primary/50'
                      } ${isJapaneseLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium">
                        {lang.flag} {lang.name}
                        {isJapaneseLocked && <span className="ml-2 text-xs">🔒</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {contentTypes.includes('ANIME') && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm">
                    💡 <strong>Pro tip:</strong> Japanese will be automatically
                    included for anime recommendations!
                  </p>
                </div>
              )}
              
              {/* Optional: Minimum Rating */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold mb-3">Minimum Rating (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Only recommend content rated this & above
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: null, label: 'Any' },
                    { value: 6, label: '6+' },
                    { value: 7, label: '7+' },
                    { value: 8, label: '8+' },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setMinRating(option.value === null ? undefined : option.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        (minRating === undefined && option.value === null) || minRating === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">⭐</div>
                      <div className="font-semibold">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 inline mr-2" />
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5 inline ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : "Let's Go!"}
              <Sparkles className="w-5 h-5 inline ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
