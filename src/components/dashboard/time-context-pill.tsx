/**
 * TimeContextPill Component
 * Displays the current time-based recommendation context
 * Shows what type of content is being suggested based on time
 */

'use client';

import { useTimeContext } from '@/hooks/use-time-context';
import { Clock, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface TimeContextPillProps {
  onOverride?: (enabled: boolean) => void;
  showToggle?: boolean;
}

export function TimeContextPill({ 
  onOverride, 
  showToggle = false 
}: TimeContextPillProps) {
  const { context, preset, refresh } = useTimeContext();
  const [isTimeBasedEnabled, setIsTimeBasedEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleToggle = () => {
    const newValue = !isTimeBasedEnabled;
    setIsTimeBasedEnabled(newValue);
    onOverride?.(newValue);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {/* Main Pill */}
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
        ${isTimeBasedEnabled 
          ? 'bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/30' 
          : 'bg-secondary/50 border border-border opacity-60'
        }
        transition-all duration-200
      `}>
        <span className="text-base">{context.emoji}</span>
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-xs">
            {preset.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {preset.mood} vibes
          </span>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="p-1 rounded-full hover:bg-white/10 transition-colors ml-1"
          title="Refresh time context"
        >
          <RefreshCw className={`w-3 h-3 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Toggle Switch */}
      {showToggle && (
        <button
          onClick={handleToggle}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            transition-all duration-200
            ${isTimeBasedEnabled 
              ? 'bg-primary/20 text-primary hover:bg-primary/30' 
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }
          `}
          title={isTimeBasedEnabled ? 'Disable time-based suggestions' : 'Enable time-based suggestions'}
        >
          <Clock className="w-3 h-3" />
          {isTimeBasedEnabled ? 'Smart' : 'Off'}
        </button>
      )}
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function TimeContextBadge() {
  const { context, preset } = useTimeContext();

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/50 text-xs">
      <span>{context.emoji}</span>
      <span className="font-medium">{preset.name}</span>
    </div>
  );
}
