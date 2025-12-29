/**
 * Search API Route
 * GET /api/search - Search for movies, TV shows, and people
 */

import { SearchService } from '@/services/search.service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  q: z.string().min(1, 'Query is required'),
  page: z.coerce.number().min(1).max(500).optional().default(1),
  types: z.string().optional(), // Comma-separated: movie,tv,person
  minRating: z.coerce.number().min(0).max(10).optional().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, page, types, minRating } = parsed.data;

    // Parse filter types
    const filterTypes = types
      ? (types.split(',').filter(t => ['movie', 'tv', 'person'].includes(t)) as ('movie' | 'tv' | 'person')[])
      : undefined;

    const response = await SearchService.search(q, {
      page,
      filterTypes,
      minRating,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search GET error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
