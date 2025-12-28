/**
 * Mood Analyze API Route
 * POST /api/mood-analyze - Analyze user's mood and get smart recommendations
 */

import { analyzeMood } from '@/lib/mood-analysis';
import { getTimeContext } from '@/lib/time-context';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  recentTitles: z.array(z.string()).optional().default([]),
  recentGenres: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { recentTitles, recentGenres } = parsed.data;
    const timeContext = getTimeContext();

    // Analyze mood
    const analysis = await analyzeMood(recentTitles, recentGenres, timeContext);

    return NextResponse.json({
      analysis,
      timeContext: {
        timeOfDay: timeContext.timeOfDay,
        dayType: timeContext.dayType,
        displayLabel: timeContext.displayLabel,
        emoji: timeContext.emoji,
      },
    });
  } catch (error) {
    console.error('Mood analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze mood' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for simple mood info without analysis
 */
export async function GET() {
  const timeContext = getTimeContext();
  
  // Use time-based default mood
  const analysis = await analyzeMood([], [], timeContext);

  return NextResponse.json({
    analysis,
    timeContext: {
      timeOfDay: timeContext.timeOfDay,
      dayType: timeContext.dayType,
      displayLabel: timeContext.displayLabel,
      emoji: timeContext.emoji,
    },
  });
}
