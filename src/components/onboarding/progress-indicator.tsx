'use client';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep}
      className="h-0.5 w-full bg-border"
    >
      <div className="h-full bg-foreground transition-[width] duration-400 ease-expo" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
    </div>
  );
}
