/**
 * Recommendation API Route
 * POST - Generate a single recommendation
 */

import { buildExplanation } from "@/config/genre-names";
import { getTMDBImageUrl } from "@/config/url.config";
import { ContentType } from "@/dtos/common.dto";
import { GenerateRecommendationReqSchema } from "@/dtos/request/generate-recommendation.req.dto";
import { connectToDatabase } from "@/infrastructure/db";
import { TasteProfileModel, UserModel } from "@/infrastructure/db/models";
import { tmdbClient } from "@/infrastructure/external/tmdb.client";
import { auth } from "@/lib/auth";
import { CACHE_TTL, detailsCache, servedCache } from "@/lib/cache";
import { loggers } from "@/lib/logger";
import { HistoryService, seenKey } from "@/services/history.service";
import { PreferenceWeightsService } from "@/services/preference-weights.service";
import { RecommendationService } from "@/services/recommendation.service";
import { NextRequest, NextResponse } from "next/server";

const log = loggers.recommendation;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = GenerateRecommendationReqSchema.parse(body);

    await connectToDatabase();

    // Find user
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let recommendation;
    let profileComplete = true;

    const userId = user._id.toString();
    // Everything already seen, played, or saved: never shown again. Plus
    // whatever this server served in the last 6 hours, so a reload rotates.
    const excluded = await HistoryService.getExcluded(userId);
    const served = servedCache.get(userId) ?? new Set<string>();
    served.forEach((k) => excluded.add(k));

    if (validated.mode === "SMART") {
      // Load taste profile for smart mode. Without a finished one, fall back to
      // whatever onboarding captured so far, then to broad well-rated defaults,
      // so the page always opens on a pick instead of a dead end.
      const saved = await TasteProfileModel.findOne({ userId: user._id });
      profileComplete = Boolean(saved?.complete);
      const profile = {
        contentTypes: (saved?.contentTypes?.length ? saved.contentTypes : ["MOVIE", "SERIES"]) as ContentType[],
        genres: (saved?.genres ?? []) as string[],
        languages: (saved?.languages?.length ? saved.languages : ["en"]) as string[],
        minRating: saved?.minRating ?? (profileComplete ? undefined : 6.5),
      };

      const [recentTypes, weights, seeds] = await Promise.all([
        HistoryService.getRecentContentTypes(userId, 3),
        PreferenceWeightsService.getWeights(userId),
        HistoryService.getSeeds(userId, 3),
      ]);

      log.debug('Smart mode profile', { profileComplete, profile, recentTypes, seeds, moodGenres: validated.genres });

      recommendation = await RecommendationService.generateSmartRecommendation({
        ...profile,
        excluded,
        recentTypes,
        seeds,
        moodGenres: validated.genres,
        weights: weights
          ? { genres: weights.genreWeights, contentTypes: weights.contentTypeWeights, languages: weights.languageWeights }
          : undefined,
      });
    } else {
      // Filtered mode - use request filters
      recommendation = await RecommendationService.generateRecommendation({
        contentType: validated.contentType!,
        genres: validated.genres || [],
        languages: validated.language ? [validated.language] : ["en"],
        minRating: validated.minRating || 0,
        blacklist: excluded,
        genreWeights: (await PreferenceWeightsService.getWeights(userId))?.genreWeights,
      });
    }

    if (!recommendation) {
      return NextResponse.json(
        { error: "No recommendations found. Try different filters." },
        { status: 404 }
      );
    }

    const { tmdbId, contentType } = recommendation;
    served.add(seenKey(tmdbId, contentType));
    servedCache.set(userId, served, 6 * 60 * 60 * 1000);
    const isMovie = contentType === 'MOVIE';
    const detailsKey = `${contentType}:${tmdbId}`;

    // Trailer, runtime and providers are independent TMDB calls; none is critical.
    const [trailerUrl, runtime, providers] = await Promise.all([
      (isMovie ? tmdbClient.getMovieVideos(tmdbId) : tmdbClient.getTVVideos(tmdbId))
        .then((videos) => tmdbClient.getTrailerUrl(videos))
        .catch((error) => (console.error('Failed to fetch trailer:', error), null)),
      // Runtime: movies carry it directly, series expose a per-episode length.
      detailsCache
        .getOrSet(
          detailsKey,
          async () =>
            isMovie
              ? (await tmdbClient.getMovieDetails(tmdbId)).runtime || null
              : await tmdbClient
                  .getTVDetails(tmdbId)
                  .then((d) => d.episode_run_time?.[0] || d.last_episode_to_air?.runtime || null),
          CACHE_TTL.DETAILS
        )
        .then((r) => r as number | null)
        .catch((error) => (console.error('Failed to fetch runtime:', error), null)),
      (isMovie ? tmdbClient.getMovieWatchProviders(tmdbId) : tmdbClient.getTVWatchProviders(tmdbId)).catch(
        (error) => (console.error('Failed to fetch watch providers:', error), null)
      ),
    ]);

    // Streaming availability
    let watchProviders: {
      flatrate?: Array<{ name: string; logoUrl: string; providerId: number }>;
      link?: string;
    } | null = null;
    const allProviders = [...(providers?.flatrate || []), ...(providers?.free || []), ...(providers?.ads || [])];
    if (providers && allProviders.length > 0) {
      watchProviders = {
        flatrate: allProviders.slice(0, 5).map((p) => ({
          name: p.provider_name,
          logoUrl: tmdbClient.getProviderLogoUrl(p.logo_path),
          providerId: p.provider_id,
        })),
        link: providers.link,
      };
    }

    // Build "Why This Pick?" explanation. Strategy copy speaks of "your taste",
    // which is false until onboarding is done.
    const explanation = recommendation.seed
      ? {
          title: 'Because you watched',
          description: `People who watched ${recommendation.seed.title} also watched this.`,
        }
      : !profileComplete
      ? {
          title: 'Popular right now',
          description:
            'No taste profile yet, so this is a well-rated pick from what people are watching.',
        }
      : recommendation.strategyName
        ? buildExplanation({
            strategyName: recommendation.strategyName,
            genres: recommendation.strategyGenres || [],
            languages: recommendation.strategyLanguages || [],
            contentType: recommendation.contentType,
          })
        : null;

    // Format response with full image URLs
    const response = {
      tmdbId: recommendation.tmdbId,
      contentType: recommendation.contentType,
      title: recommendation.title,
      overview: recommendation.overview,
      posterPath: recommendation.posterPath,
      posterUrl: recommendation.posterPath
        ? getTMDBImageUrl(recommendation.posterPath, "LARGE")
        : null,
      backdropUrl: recommendation.backdropPath
        ? getTMDBImageUrl(recommendation.backdropPath, "ORIGINAL")
        : null,
      releaseDate: recommendation.releaseDate,
      rating: recommendation.rating,
      voteCount: recommendation.voteCount,
      genreIds: recommendation.genreIds,
      originalLanguage: recommendation.originalLanguage,
      runtime,
      trailerUrl,
      explanation,
      watchProviders,
      profileComplete,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Recommendation generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
