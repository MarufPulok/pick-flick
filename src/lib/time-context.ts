/**
 * Time Context Utility
 * Provides time-of-day and day-of-week context for smart recommendations
 */

/**
 * Time periods throughout the day
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';

/**
 * Day types for recommendation context
 */
export type DayType = 'weekday' | 'weekend' | 'friday_night';

/**
 * Complete time context
 */
export interface TimeContext {
  timeOfDay: TimeOfDay;
  dayType: DayType;
  hour: number;
  isWeekend: boolean;
  isFridayNight: boolean;
  displayLabel: string;
  emoji: string;
}

/**
 * Get the current time of day
 */
export function getTimeOfDay(hour?: number): TimeOfDay {
  const h = hour ?? new Date().getHours();
  
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  if (h >= 21 && h < 24) return 'night';
  return 'late_night'; // 0-5
}

/**
 * Get the day type
 */
export function getDayType(date?: Date): DayType {
  const d = date ?? new Date();
  const dayOfWeek = d.getDay();
  const hour = d.getHours();
  
  // Friday evening onwards
  if (dayOfWeek === 5 && hour >= 17) return 'friday_night';
  
  // Saturday or Sunday
  if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
  
  return 'weekday';
}

/**
 * Check if it's the weekend
 */
export function isWeekend(date?: Date): boolean {
  const d = date ?? new Date();
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if it's Friday night (17:00+)
 */
export function isFridayNight(date?: Date): boolean {
  const d = date ?? new Date();
  return d.getDay() === 5 && d.getHours() >= 17;
}

/**
 * Get display label for time context
 */
function getDisplayLabel(timeOfDay: TimeOfDay, dayType: DayType): string {
  const timeLabels: Record<TimeOfDay, string> = {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    night: 'Late Night',
    late_night: 'Night Owl',
  };

  const dayPrefix = dayType === 'weekend' ? 'Weekend ' : 
                    dayType === 'friday_night' ? 'TGIF ' : '';
  
  return `${dayPrefix}${timeLabels[timeOfDay]}`;
}

/**
 * Get emoji for time context
 */
function getEmoji(timeOfDay: TimeOfDay, dayType: DayType): string {
  if (dayType === 'friday_night') return '🎉';
  if (dayType === 'weekend') {
    if (timeOfDay === 'morning') return '☕';
    if (timeOfDay === 'night' || timeOfDay === 'late_night') return '🍿';
    return '🌟';
  }
  
  const emojiMap: Record<TimeOfDay, string> = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    night: '🌙',
    late_night: '🦉',
  };
  
  return emojiMap[timeOfDay];
}

/**
 * Get the full time context
 */
export function getTimeContext(date?: Date): TimeContext {
  const d = date ?? new Date();
  const hour = d.getHours();
  const timeOfDay = getTimeOfDay(hour);
  const dayType = getDayType(d);
  
  return {
    timeOfDay,
    dayType,
    hour,
    isWeekend: isWeekend(d),
    isFridayNight: isFridayNight(d),
    displayLabel: getDisplayLabel(timeOfDay, dayType),
    emoji: getEmoji(timeOfDay, dayType),
  };
}

/**
 * Get a streaming duration suggestion based on time
 */
export function getSuggestedDuration(timeContext: TimeContext): 'short' | 'medium' | 'long' | 'binge' {
  const { timeOfDay, dayType, hour } = timeContext;
  
  // Weekend or friday night = longer viewing sessions
  if (dayType === 'weekend' || dayType === 'friday_night') {
    if (timeOfDay === 'night' || timeOfDay === 'late_night') return 'binge';
    if (timeOfDay === 'evening') return 'long';
    return 'medium';
  }
  
  // Weekday
  if (timeOfDay === 'morning') return 'short';
  if (timeOfDay === 'afternoon') return 'short';
  if (timeOfDay === 'evening') return 'medium';
  if (timeOfDay === 'night') return 'long';
  
  return 'medium';
}
