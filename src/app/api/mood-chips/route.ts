/**
 * Mood Chips API Route
 * GET ?hour=&day= - the chip row for this user at this local hour
 */

import { connectToDatabase } from '@/infrastructure/db';
import { UserModel } from '@/infrastructure/db/models';
import { auth } from '@/lib/auth';
import { buildMoodChips } from '@/lib/mood-chips';
import { PreferenceWeightsService } from '@/services/preference-weights.service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  hour: z.coerce.number().int().min(0).max(23).default(20),
  day: z.coerce.number().int().min(0).max(6).default(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const weights = await PreferenceWeightsService.getWeights(user._id.toString());
    const chips = buildMoodChips({
      ...parsed.data,
      genreWeights: weights?.genreWeights,
      languageWeights: weights?.languageWeights,
    });

    return NextResponse.json({ chips });
  } catch (error) {
    console.error('Mood chips GET error:', error);
    return NextResponse.json({ error: 'Failed to build mood chips' }, { status: 500 });
  }
}
