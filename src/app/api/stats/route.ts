/**
 * Stats API Route
 * GET - Get user's statistics
 */

import { UserStatsResSchema } from '@/dtos/response/history.res.dto';
import { connectToDatabase } from '@/infrastructure/db';
import { UserModel } from '@/infrastructure/db/models';
import { auth } from '@/lib/auth';
import { HistoryService } from '@/services/history.service';
import { NextResponse } from 'next/server';

export async function GET() {
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

    // Get detailed stats (includes basic + enhanced stats)
    const stats = await HistoryService.getDetailedStats(user._id.toString());

    const response = UserStatsResSchema.parse(stats);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
