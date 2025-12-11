/**
 * WelcomeHeader Component
 * Compact personalized greeting
 */

'use client';

import { Sparkles } from 'lucide-react';

interface WelcomeHeaderProps {
  userName: string | undefined;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold">
          Hey, <span className="text-primary">{firstName}</span>!
        </h1>
        <p className="text-muted-foreground text-sm">Ready for your perfect pick?</p>
      </div>
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">PickFlick</span>
      </div>
    </div>
  );
}
