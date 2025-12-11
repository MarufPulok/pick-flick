/**
 * History API Route
 * GET - Get user's history
 * POST - Record an action on a recommendation
 */

import { RecordActionReqSchema } from '@/dtos/request/history.req.dto';
import { HistoryListResSchema, UserStatsResSchema } from '@/dtos/response/history.res.dto';
import { connectToDatabase } from '@/infrastructure/db';
import { UserModel } from '@/infrastructure/db/models';
import { auth } from '@/lib/auth';
import { HistoryService } from '@/services/history.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Find user
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') as 'WATCHED' | 'LIKED' | 'DISLIKED' | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Get history
    const result = await HistoryService.getHistory(user._id.toString(), {
      action: action || undefined,
      limit,
      skip,
    });

    const response = HistoryListResSchema.parse({
      items: result.items.map((item: any) => ({
        id: item._id.toString(),
        tmdbId: item.tmdbId,
        contentType: item.contentType,
        action: item.action,
        title: item.title,
        posterPath: item.posterPath,
        rating: item.rating,
        releaseDate: item.releaseDate,
        source: item.source,
        createdAt: item.createdAt.toISOString(),
      })),
      total: result.total,
      hasMore: result.hasMore,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = RecordActionReqSchema.parse(body);

    await connectToDatabase();
    
    // Find user
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Record action
    const history = await HistoryService.recordAction({
      userId: user._id.toString(),
      ...validated,
    });

    // Update preference weights on likes/dislikes (async, don't block response)
    if (validated.action === 'LIKED' || validated.action === 'DISLIKED') {
      const { PreferenceWeightsService } = await import('@/services/preference-weights.service');
      PreferenceWeightsService.updateWeights({
        userId: user._id.toString(),
        action: validated.action,
        genreIds: validated.genreIds || [],
        contentType: validated.contentType,
        language: validated.originalLanguage || 'en',
      }).catch(err => {
        console.error('Failed to update preference weights:', err);
      });
    }

    return NextResponse.json({
      success: true,
      id: history._id.toString(),
    });
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record action' },
      { status: 500 }
    );
  }
}
