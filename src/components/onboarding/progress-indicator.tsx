/**
 * ProgressIndicator Component
 * Shows current step progress
 * Single Responsibility: Only displays progress
 */

'use client';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex gap-2 justify-center mt-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`h-2 w-16 rounded-full transition-colors ${
            step <= currentStep ? 'bg-primary' : 'bg-border'
          }`}
        />
      ))}
    </div>
  );
}
