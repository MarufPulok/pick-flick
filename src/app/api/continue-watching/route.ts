/**
 * Continue Watching API Route
 * GET - Get user's continue watching list
 * POST - Record a viewing session
 * DELETE - Remove item from continue watching
 */

import { connectToDatabase } from '@/infrastructure/db';
import { UserModel } from '@/infrastructure/db/models';
import { auth } from '@/lib/auth';
import { ViewingProgressService } from '@/services/viewing-progress.service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RecordViewingSchema = z.object({
  tmdbId: z.number(),
  contentType: z.enum(['MOVIE', 'SERIES', 'ANIME']),
  title: z.string(),
  posterPath: z.string().nullable().optional(),
});

const RemoveViewingSchema = z.object({
  tmdbId: z.number(),
  contentType: z.enum(['MOVIE', 'SERIES', 'ANIME']),
});

/**
 * GET /api/continue-watching
 * Get user's continue watching list
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const items = await ViewingProgressService.getContinueWatching(
      user._id.toString(),
      10
    );

    return NextResponse.json({
      items: items.map(item => ({
        id: item._id,
        tmdbId: item.tmdbId,
        contentType: item.contentType,
        title: item.title,
        posterPath: item.posterPath,
        lastWatchedAt: item.lastWatchedAt.toISOString(),
        watchCount: item.watchCount,
      })),
      total: items.length,
    });
  } catch (error) {
    console.error('Continue watching GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch continue watching' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/continue-watching
 * Record a viewing session
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = RecordViewingSchema.parse(body);

    await connectToDatabase();
    
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await ViewingProgressService.recordViewing({
      userId: user._id.toString(),
      ...validated,
    });

    return NextResponse.json({
      success: true,
      id: result._id,
    });
  } catch (error) {
    console.error('Continue watching POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record viewing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/continue-watching
 * Remove item from continue watching
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = RemoveViewingSchema.parse(body);

    await connectToDatabase();
    
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const removed = await ViewingProgressService.removeFromContinue(
      user._id.toString(),
      validated.tmdbId,
      validated.contentType
    );

    return NextResponse.json({
      success: removed,
    });
  } catch (error) {
    console.error('Continue watching DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from continue watching' },
      { status: 500 }
    );
  }
}
