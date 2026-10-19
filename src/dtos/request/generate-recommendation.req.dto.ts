/**
 * Generate Recommendation Request DTO
 * Validates input for the recommendation engine
 */

import { z } from 'zod';
import { ContentTypeSchema, RecommendationModeSchema } from '../common.dto';

/**
 * Request schema for generating a recommendation
 */
export const GenerateRecommendationReqSchema = z.object({
  /**
   * Type of content to recommend
   * Required for FILTERED mode, optional for SMART mode
   */
  contentType: ContentTypeSchema.optional(),
  
  /**
   * Preferred language code (ISO 639-1)
   * Hidden/ignored when contentType is 'ANIME' (auto-set to 'ja')
   */
  language: z.string().min(2).max(5).optional(),
  
  /**
   * List of preferred genre IDs
   * Optional for SMART mode, uses profile preferences
   */
  genres: z.array(z.string()).optional(),

  /**
   * SMART mode only: mood languages that replace the profile languages for this pick
   */
  languages: z.array(z.string().min(2).max(5)).optional(),
  
  /**
   * Minimum TMDB rating (0-10)
   */
  minRating: z.number().min(0).max(10).optional(),
  
  /**
   * Maximum release year
   * Useful for filtering out too-old content
   */
  maxYear: z.number().int().min(1900).optional(),
  
  /**
   * Minimum release year
   * Useful for filtering out older content
   */
  minYear: z.number().int().min(1900).optional(),
  
  /**
   * Recommendation mode
   * - FILTERED: Uses provided filters
   * - SMART: Uses user profile + history to auto-generate
   */
  mode: RecommendationModeSchema.default('FILTERED'),

  /**
   * SMART only: background prefetch for "Not tonight". Not an impression until shown.
   */
  prefetch: z.boolean().optional(),

  /**
   * SMART only: a prefetched pick the client has now displayed; recorded as an impression.
   */
  shown: z
    .object({
      tmdbId: z.number().int().positive(),
      contentType: ContentTypeSchema,
      genreIds: z.array(z.number().int()).max(20).default([]),
      originalLanguage: z.string().max(5).default(''),
      seeded: z.boolean().optional(),
    })
    .optional(),
});

export type GenerateRecommendationReqDto = z.infer<typeof GenerateRecommendationReqSchema>;

/**
 * Refinement for year range validation
 */
export const GenerateRecommendationReqSchemaRefined = GenerateRecommendationReqSchema.refine(
  (data) => {
    if (data.minYear && data.maxYear) {
      return data.minYear <= data.maxYear;
    }
    return true;
  },
  {
    message: 'minYear must be less than or equal to maxYear',
    path: ['minYear'],
  }
);
