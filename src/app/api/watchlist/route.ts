/**
 * Watchlist API Route
 * GET - Get user's watchlist
 * POST - Add item to watchlist
 * DELETE - Remove item from watchlist
 * PATCH - Update watchlist item (priority/notes)
 */

import { AddToWatchlistReqSchema, UpdateWatchlistReqSchema } from '@/dtos/request/watchlist.req.dto';
import { WatchlistListResSchema, WatchlistStatsResSchema } from '@/dtos/response/watchlist.res.dto';
import { connectToDatabase } from '@/infrastructure/db';
import { UserModel } from '@/infrastructure/db/models';
import { auth } from '@/lib/auth';
import { WatchlistService } from '@/services/watchlist.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/watchlist
 * Get user's watchlist with optional filters
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    
    // Check for stats query
    if (searchParams.get('stats') === 'true') {
      const [total, byType] = await Promise.all([
        WatchlistService.getCount(user._id.toString()),
        WatchlistService.getCountByType(user._id.toString()),
      ]);

      const stats = WatchlistStatsResSchema.parse({ total, byType });
      return NextResponse.json(stats);
    }

    // Check for random query
    if (searchParams.get('random') === 'true') {
      const contentType = searchParams.get('contentType') as 'MOVIE' | 'SERIES' | 'ANIME' | null;
      const randomItem = await WatchlistService.getRandomItem(
        user._id.toString(),
        contentType || undefined
      );

      if (!randomItem) {
        return NextResponse.json({ item: null });
      }

      return NextResponse.json({
        item: {
          id: randomItem._id.toString(),
          tmdbId: randomItem.tmdbId,
          contentType: randomItem.contentType,
          title: randomItem.title,
          posterPath: randomItem.posterPath,
          rating: randomItem.rating,
          releaseDate: randomItem.releaseDate,
          priority: randomItem.priority,
          notes: randomItem.notes,
          createdAt: randomItem.createdAt?.toISOString(),
        },
      });
    }

    // Get query params for list
    const contentType = searchParams.get('contentType') as 'MOVIE' | 'SERIES' | 'ANIME' | null;
    const priority = searchParams.get('priority') as 'HIGH' | 'NORMAL' | 'LOW' | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const sortBy = searchParams.get('sortBy') as 'createdAt' | 'priority' | 'title' | null;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;

    const result = await WatchlistService.getList(user._id.toString(), {
      contentType: contentType || undefined,
      priority: priority || undefined,
      limit,
      skip,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    });

    const response = WatchlistListResSchema.parse({
      items: result.items.map((item: any) => ({
        id: item._id.toString(),
        tmdbId: item.tmdbId,
        contentType: item.contentType,
        title: item.title,
        posterPath: item.posterPath,
        rating: item.rating,
        releaseDate: item.releaseDate,
        priority: item.priority || 'NORMAL',
        notes: item.notes,
        createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
      })),
      total: result.total,
      hasMore: result.hasMore,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Add item to watchlist
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = AddToWatchlistReqSchema.parse(body);

    await connectToDatabase();
    
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const item = await WatchlistService.add(user._id.toString(), validated);

    return NextResponse.json({
      success: true,
      id: item._id.toString(),
    });
  } catch (error) {
    console.error('Watchlist POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist
 * Remove item from watchlist
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tmdbId = searchParams.get('tmdbId');
    const contentType = searchParams.get('contentType') as 'MOVIE' | 'SERIES' | 'ANIME' | null;

    if (!tmdbId || !contentType) {
      return NextResponse.json(
        { error: 'tmdbId and contentType are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const removed = await WatchlistService.remove(
      user._id.toString(),
      parseInt(tmdbId),
      contentType
    );

    return NextResponse.json({ success: removed });
  } catch (error) {
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/watchlist
 * Update watchlist item priority or notes
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = UpdateWatchlistReqSchema.parse(body);

    await connectToDatabase();
    
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const item = await WatchlistService.update(
      user._id.toString(),
      validated.tmdbId,
      validated.contentType,
      {
        priority: validated.priority,
        notes: validated.notes,
      }
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id: item._id.toString(),
    });
  } catch (error) {
    console.error('Watchlist PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist item' },
      { status: 500 }
    );
  }
}
