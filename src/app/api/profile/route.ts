/**
 * Profile API Route
 * GET - Fetch user's taste profile
 * POST - Save/update taste profile (onboarding)
 */

import { OnboardingReqSchema, OnboardingStatusResSchema, ProfileSaveResSchema } from '@/dtos';
import { connectToDatabase } from '@/infrastructure/db';
import { TasteProfileModel, UserModel } from '@/infrastructure/db/models';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Find user by email
    const user = await UserModel.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find taste profile
    const profile = await TasteProfileModel.findOne({ userId: user._id });
    
    const response = OnboardingStatusResSchema.parse({
      complete: !!profile,
      profile: profile ? {
        userId: user._id.toString(),
        contentTypes: profile.contentTypes,
        genres: profile.genres,
        languages: profile.languages,
        animeAutoLanguage: profile.animeAutoLanguage,
        onboardingComplete: true,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      } : null,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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
    const validated = OnboardingReqSchema.parse(body);

    await connectToDatabase();
    
    // Find user by email
    const user = await UserModel.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert taste profile
    const savedProfile = await TasteProfileModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        contentTypes: validated.contentTypes,
        genres: validated.genres,
        languages: validated.languages,
        animeAutoLanguage: validated.animeAutoLanguage,
      },
      { upsert: true, new: true }
    );

    const response = ProfileSaveResSchema.parse({
      success: true,
      message: 'Profile saved successfully',
      profile: {
        userId: user._id.toString(),
        contentTypes: savedProfile.contentTypes,
        genres: savedProfile.genres,
        languages: savedProfile.languages,
        animeAutoLanguage: savedProfile.animeAutoLanguage,
        onboardingComplete: true,
        createdAt: savedProfile.createdAt.toISOString(),
        updatedAt: savedProfile.updatedAt.toISOString(),
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
