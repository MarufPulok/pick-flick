/**
 * StepNavigation Component
 * Navigation controls for onboarding steps
 * Single Responsibility: Only handles step navigation UI
 */

'use client';

import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSubmitting: boolean;
  isEditMode: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  canProceed,
  isSubmitting,
  isEditMode,
  onBack,
  onNext,
  onSubmit,
}: StepNavigationProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
      <button
        onClick={onBack}
        disabled={currentStep === 1}
        className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
        Back
      </button>

      {!isLastStep ? (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
        >
          Next
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 inline ml-2" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting}
          className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : "Let's Go!"}
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 inline ml-2" />
        </button>
      )}
    </div>
  );
}
