/**
 * Recommendation API Route
 * POST - Generate a single recommendation
 */

import { buildExplanation } from "@/config/genre-names";
import { getTMDBImageUrl } from "@/config/url.config";
import { GenerateRecommendationReqSchema } from "@/dtos/request/generate-recommendation.req.dto";
import { connectToDatabase } from "@/infrastructure/db";
import { TasteProfileModel, UserModel } from "@/infrastructure/db/models";
import { tmdbClient } from "@/infrastructure/external/tmdb.client";
import { auth } from "@/lib/auth";
import { loggers } from "@/lib/logger";
import { HistoryService } from "@/services/history.service";
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

    // Load blacklist for user
    const blacklist = await HistoryService.getBlacklist(user._id.toString());

    if (validated.mode === "SMART") {
      // Load taste profile for smart mode
      const profile = await TasteProfileModel.findOne({ userId: user._id });

      if (!profile || !profile.complete) {
        return NextResponse.json(
          { error: "Please complete onboarding first" },
          { status: 400 }
        );
      }

      // Get recent content types for diversity tracking
      const recentContentTypes = await HistoryService.getRecentContentTypes(
        user._id.toString(),
        3
      );
      
      // Prioritize content types not recently recommended
      const prioritizedTypes = profile.contentTypes.filter(
        (type: string) => !recentContentTypes.includes(type)
      );
      const orderedContentTypes = prioritizedTypes.length > 0
        ? [...prioritizedTypes, ...profile.contentTypes.filter((type: string) => !prioritizedTypes.includes(type))]
        : profile.contentTypes;

      // Debug profile data (only shows in development)
      log.debug('Smart mode profile', {
        contentTypes: profile.contentTypes,
        languages: profile.languages,
        orderedContentTypes,
      });

      recommendation = await RecommendationService.generateSmartRecommendation({
        contentTypes: orderedContentTypes,
        genres: profile.genres,
        languages: profile.languages,
        minRating: profile.minRating,
        blacklist,
      });
    } else {
      // Filtered mode - use request filters
      recommendation = await RecommendationService.generateRecommendation({
        contentType: validated.contentType!,
        genres: validated.genres || [],
        languages: validated.language ? [validated.language] : ["en"],
        minRating: validated.minRating || 0,
        blacklist,
      });
    }

    if (!recommendation) {
      return NextResponse.json(
        { error: "No recommendations found. Try different filters." },
        { status: 404 }
      );
    }

    // Fetch trailer for the recommendation
    let trailerUrl: string | null = null;
    try {
      const videos = recommendation.contentType === 'MOVIE' 
        ? await tmdbClient.getMovieVideos(recommendation.tmdbId)
        : await tmdbClient.getTVVideos(recommendation.tmdbId);
      trailerUrl = tmdbClient.getTrailerUrl(videos);
    } catch (error) {
      console.error("Failed to fetch trailer:", error);
      // Continue without trailer - it's not critical
    }

    // Build "Why This Pick?" explanation
    const explanation = recommendation.strategyName 
      ? buildExplanation({
          strategyName: recommendation.strategyName,
          genres: recommendation.strategyGenres || [],
          languages: recommendation.strategyLanguages || [],
          contentType: recommendation.contentType,
        })
      : null;

    // Fetch watch providers (streaming availability)
    let watchProviders: {
      flatrate?: Array<{ name: string; logoUrl: string; providerId: number }>;
      link?: string;
    } | null = null;
    try {
      const providers = recommendation.contentType === 'MOVIE'
        ? await tmdbClient.getMovieWatchProviders(recommendation.tmdbId)
        : await tmdbClient.getTVWatchProviders(recommendation.tmdbId);
      
      if (providers) {
        const allProviders = [
          ...(providers.flatrate || []),
          ...(providers.free || []),
          ...(providers.ads || []),
        ];
        
        if (allProviders.length > 0) {
          watchProviders = {
            flatrate: allProviders.slice(0, 5).map(p => ({
              name: p.provider_name,
              logoUrl: tmdbClient.getProviderLogoUrl(p.logo_path),
              providerId: p.provider_id,
            })),
            link: providers.link,
          };
        }
      }
    } catch (error) {
      console.error("Failed to fetch watch providers:", error);
      // Continue without providers - it's not critical
    }

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
      trailerUrl,
      explanation,
      watchProviders,
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
