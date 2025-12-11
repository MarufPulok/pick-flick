/**
 * WelcomeHeader Component
 * Personalized greeting with time-based messages
 */

'use client';

import { Moon, Sparkles, Sun, Sunrise, Sunset } from 'lucide-react';

interface WelcomeHeaderProps {
  userName: string | undefined;
}

function getGreeting(): { text: string; icon: React.ReactNode; emoji: string } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return {
      text: 'Good morning',
      icon: <Sunrise className="w-6 h-6 text-amber-500" />,
      emoji: '☀️',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      text: 'Good afternoon',
      icon: <Sun className="w-6 h-6 text-yellow-500" />,
      emoji: '🌤️',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      text: 'Good evening',
      icon: <Sunset className="w-6 h-6 text-orange-500" />,
      emoji: '🌅',
    };
  } else {
    return {
      text: 'Night owl mode',
      icon: <Moon className="w-6 h-6 text-indigo-400" />,
      emoji: '🦉',
    };
  }
}

const TAGLINES = [
  "Ready for your perfect pick?",
  "Let's find something amazing!",
  "What are we watching today?",
  "Your next favorite awaits!",
  "Time to discover something new!",
];

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  const greeting = getGreeting();
  const firstName = userName?.split(' ')[0] || 'there';
  const tagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];

  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">PickFlick</span>
      </div>
      
      <div className="flex items-center justify-center gap-3 mb-3">
        {greeting.icon}
        <h1 className="text-4xl font-bold">
          {greeting.text}, <span className="text-primary">{firstName}</span>!
        </h1>
      </div>
      
      <p className="text-muted-foreground text-lg">
        {tagline}
      </p>
    </div>
  );
}
