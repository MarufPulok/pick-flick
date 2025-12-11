/**
 * Recommendation API Route
 * POST - Generate a single recommendation
 */

import { getTMDBImageUrl } from "@/config/url.config";
import { GenerateRecommendationReqSchema } from "@/dtos/request/generate-recommendation.req.dto";
import { connectToDatabase } from "@/infrastructure/db";
import { TasteProfileModel, UserModel } from "@/infrastructure/db/models";
import { auth } from "@/lib/auth";
import { HistoryService } from "@/services/history.service";
import { RecommendationService } from "@/services/recommendation.service";
import { NextRequest, NextResponse } from "next/server";

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

      console.log("Smart mode - User ID:", user._id);
      console.log("Smart mode - Profile found:", !!profile);
      console.log("Smart mode - Profile complete:", profile?.complete);

      if (!profile || !profile.complete) {
        return NextResponse.json(
          { error: "Please complete onboarding first" },
          { status: 400 }
        );
      }

      recommendation = await RecommendationService.generateSmartRecommendation({
        contentTypes: profile.contentTypes,
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
