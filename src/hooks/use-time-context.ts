/**
 * useTimeContext Hook
 * React hook for accessing time context with auto-refresh
 */

'use client';

import { getTimeContext, TimeContext } from '@/lib/time-context';
import { getTimeBasedPreset, TimeRecommendationPreset } from '@/lib/time-recommendation.config';
import { useEffect, useState } from 'react';

interface UseTimeContextResult {
  context: TimeContext;
  preset: TimeRecommendationPreset;
  refresh: () => void;
}

/**
 * Hook that provides current time context with auto-refresh
 * Refreshes every 5 minutes to update recommendations
 */
export function useTimeContext(): UseTimeContextResult {
  const [context, setContext] = useState<TimeContext>(() => getTimeContext());
  const [preset, setPreset] = useState<TimeRecommendationPreset>(() => 
    getTimeBasedPreset(context.timeOfDay, context.dayType)
  );

  const refresh = () => {
    const newContext = getTimeContext();
    setContext(newContext);
    setPreset(getTimeBasedPreset(newContext.timeOfDay, newContext.dayType));
  };

  useEffect(() => {
    // Refresh every 5 minutes
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { context, preset, refresh };
}
