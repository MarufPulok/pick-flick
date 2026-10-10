/**
 * Feed API Route
 * GET - the "For you" rail: taste-ranked picks across every content type
 */

import { getGenreNames, getLanguageName } from '@/config/genre-names';
import { getTMDBImageUrl } from '@/config/url.config';
import { connectToDatabase } from '@/infrastructure/db';
import { UserModel } from '@/infrastructure/db/models';
import { auth } from '@/lib/auth';
import { recordFeed } from '@/lib/diversity-stats';
import { ImpressionService } from '@/services/impression.service';
import { RecommendationService } from '@/services/recommendation.service';
import { loadSmartContext } from '@/services/smart-context.service';
import { NextResponse } from 'next/server';

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

    const userId = user._id.toString();
    const ctx = await loadSmartContext(userId);
    const picks = await RecommendationService.generateSmartFeed(ctx.request, 12);
    void ImpressionService.record(userId, 'feed', picks);
    recordFeed(userId, picks);

    return NextResponse.json({
      profileComplete: ctx.profileComplete,
      items: picks.map((p) => ({
        tmdbId: p.tmdbId,
        contentType: p.contentType,
        title: p.title,
        posterPath: p.posterPath,
        posterUrl: p.posterPath ? getTMDBImageUrl(p.posterPath, 'MEDIUM') : null,
        rating: p.rating,
        releaseDate: p.releaseDate,
        why: p.seed
          ? `Because you watched ${p.seed.title}${p.seeds && p.seeds.length >= 2 ? ` and ${p.seeds[1].title}` : ''}`
          : [getGenreNames(p.strategyGenres).slice(0, 2).join(' · '), getLanguageName(p.originalLanguage)]
              .filter(Boolean)
              .join(' · '),
      })),
    });
  } catch (error) {
    console.error('Feed GET error:', error);
    return NextResponse.json({ error: 'Failed to build feed' }, { status: 500 });
  }
}
