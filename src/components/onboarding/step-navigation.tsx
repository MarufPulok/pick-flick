'use client';

import { Button } from '@/components/ui/button';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  canProceed,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
}: StepNavigationProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="mt-12 flex items-center justify-between gap-3">
      <Button variant="quiet" onClick={onBack} disabled={currentStep === 1}>
        Back
      </Button>
      <Button
        variant="play"
        className="min-w-32"
        onClick={isLastStep ? onSubmit : onNext}
        disabled={!canProceed || (isLastStep && isSubmitting)}
      >
        {isLastStep ? 'Finish' : 'Continue'}
      </Button>
    </div>
  );
}
