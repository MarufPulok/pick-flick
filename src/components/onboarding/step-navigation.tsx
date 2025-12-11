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
    <div className="flex justify-between gap-4">
      <button
        onClick={onBack}
        disabled={currentStep === 1}
        className="px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5 inline mr-2" />
        Back
      </button>

      {!isLastStep ? (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-5 h-5 inline ml-2" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : "Let's Go!"}
          <Sparkles className="w-5 h-5 inline ml-2" />
        </button>
      )}
    </div>
  );
}
