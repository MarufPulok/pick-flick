/**
 * Profile/Onboarding Response DTO
 * Response structure for user taste profile
 */

import { z } from 'zod';
import { ContentTypeSchema } from '../common.dto';

/**
 * Taste profile schema
 */
export const TasteProfileSchema = z.object({
  /**
   * User ID
   */
  userId: z.string(),
  
  /**
   * Preferred content types
   */
  contentTypes: z.array(ContentTypeSchema),
  
  /**
   * Preferred genre IDs
   */
  genres: z.array(z.string()),
  
  /**
   * Preferred language codes
   */
  languages: z.array(z.string()),
  
  /**
   * Whether anime language is auto-handled
   */
  animeAutoLanguage: z.boolean(),
  
  /**
   * Minimum acceptable rating (optional)
   */
  minRating: z.number().min(0).max(10).optional(),
  
  /**
   * Whether onboarding is complete
   */
  onboardingComplete: z.boolean(),
  
  /**
   * When profile was created
   */
  createdAt: z.string().datetime(),
  
  /**
   * When profile was last updated
   */
  updatedAt: z.string().datetime(),
});

export type TasteProfile = z.infer<typeof TasteProfileSchema>;

/**
 * Onboarding status response
 */
export const OnboardingStatusResSchema = z.object({
  /**
   * Whether onboarding is complete
   */
  complete: z.boolean(),
  
  /**
   * Profile data if exists
   */
  profile: TasteProfileSchema.nullable(),
});

export type OnboardingStatusResDto = z.infer<typeof OnboardingStatusResSchema>;

/**
 * Profile save response
 */
export const ProfileSaveResSchema = z.object({
  /**
   * Success indicator
   */
  success: z.boolean(),
  
  /**
   * Saved profile data
   */
  profile: TasteProfileSchema,
  
  /**
   * Optional message
   */
  message: z.string().optional(),
});

export type ProfileSaveResDto = z.infer<typeof ProfileSaveResSchema>;
