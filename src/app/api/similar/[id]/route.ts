/**
 * Similar Content API Route
 * GET /api/similar/[id] - Get similar content for a movie/TV show
 */

import { ContentType, ContentTypeSchema } from '@/dtos/common.dto';
import { SimilarService } from '@/services/similar.service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  type: ContentTypeSchema,
  limit: z.coerce.number().min(1).max(20).optional().default(10),
  exclude: z.string().optional(), // Comma-separated IDs to exclude
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tmdbId = parseInt(id, 10);

    if (isNaN(tmdbId)) {
      return NextResponse.json(
        { error: 'Invalid ID parameter' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, limit, exclude } = parsed.data;

    // Parse exclude IDs
    const excludeIds = new Set<number>(
      exclude
        ? exclude.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
        : []
    );

    // Get similar content
    const similarContent = await SimilarService.getSimilarContent(
      tmdbId,
      type as ContentType,
      { limit, excludeIds }
    );

    return NextResponse.json({
      items: similarContent,
      tmdbId,
      contentType: type,
      count: similarContent.length,
    });
  } catch (error) {
    console.error('Similar content GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar content' },
      { status: 500 }
    );
  }
}
