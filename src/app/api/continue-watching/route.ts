/**
 * Continue Watching API Route
 * GET - Get user's continue watching list
 * POST - Record a viewing session
 * DELETE - Remove item from continue watching
 */

import { connectToDatabase } from '@/infrastructure/db';
import { UserModel } from '@/infrastructure/db/models';
import { auth } from '@/lib/auth';
import { PreferenceWeightsService } from '@/services/preference-weights.service';
import { tmdbClient } from '@/infrastructure/external/tmdb.client';
import { isQualifiedPlay, ViewingProgressService } from '@/services/viewing-progress.service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RecordViewingSchema = z.object({
  tmdbId: z.number(),
  contentType: z.enum(['MOVIE', 'SERIES', 'ANIME']),
  title: z.string(),
  posterPath: z.string().nullable().optional(),
  season: z.number().int().positive().nullable().optional(),
  episode: z.number().int().positive().nullable().optional(),
  positionSeconds: z.number().min(0).optional(),
  durationSeconds: z.number().min(0).optional(),
});

/**
 * Learn from watching, not opening (X weighs video_open ~0.07 against like 0.5):
 * the first open of a title is +1, and +4 lands once, when a progress ping
 * crosses the qualified-play bar. Also backfills the poster when the link that
 * opened the player had none.
 */
async function learnFromViewing(userId: string, v: z.infer<typeof RecordViewingSchema>, created: boolean) {
  const isOpen = v.positionSeconds === undefined;
  let action: 'PLAYED' | 'WATCHED' | null = null;
  if (
    !isOpen &&
    isQualifiedPlay(v.positionSeconds!, v.durationSeconds ?? 0) &&
    (await ViewingProgressService.claimLearned(userId, v.tmdbId, v.contentType))
  ) {
    action = 'WATCHED';
  } else if (created) {
    // First record for this title, whether from the open call or a ping that won the race.
    action = 'PLAYED';
  }

  const needPoster = isOpen && !v.posterPath;
  if (!action && !needPoster) return;
  const details = action
    ? await PreferenceWeightsService.learnFromPlay(userId, v.tmdbId, v.contentType, action)
    : v.contentType === 'MOVIE'
      ? await tmdbClient.getMovieDetails(v.tmdbId)
      : await tmdbClient.getTVDetails(v.tmdbId);
  if (!v.posterPath && details.poster_path) {
    await ViewingProgressService.setPoster(userId, v.tmdbId, v.contentType, details.poster_path);
  }
}

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
        season: item.season,
        episode: item.episode,
        positionSeconds: item.positionSeconds,
        durationSeconds: item.durationSeconds,
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

    const userId = user._id.toString();
    const { item, created } = await ViewingProgressService.recordViewing({ userId, ...validated });

    learnFromViewing(userId, validated, created).catch((err) => console.error('Failed to learn from play:', err));

    return NextResponse.json({
      success: true,
      id: item._id,
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
