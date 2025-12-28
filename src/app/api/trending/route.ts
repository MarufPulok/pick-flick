/**
 * Trending Content API Route
 * GET /api/trending - Get trending movies and TV shows
 */

import { ContentTypeSchema } from '@/dtos/common.dto';
import { TrendingService } from '@/services/trending.service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  type: z.enum(['MOVIE', 'SERIES', 'ANIME', 'ALL']).optional().default('ALL'),
  timeWindow: z.enum(['day', 'week']).optional().default('day'),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
});

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, timeWindow, limit } = parsed.data;

    // Get trending content
    const trendingContent = await TrendingService.getTrendingByType(
      type as 'MOVIE' | 'SERIES' | 'ANIME' | 'ALL',
      { limit, timeWindow }
    );

    return NextResponse.json({
      items: trendingContent,
      contentType: type,
      timeWindow,
      count: trendingContent.length,
    });
  } catch (error) {
    console.error('Trending GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending content' },
      { status: 500 }
    );
  }
}
