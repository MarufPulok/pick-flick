/**
 * Recommendation Response DTO
 * Response structure for generated recommendations
 */

import { z } from 'zod';
import { ContentTypeSchema } from '../common.dto';

/**
 * Single recommendation item schema
 */
export const RecommendationItemSchema = z.object({
  /**
   * Internal database ID
   */
  id: z.string(),
  
  /**
   * TMDB ID for external reference
   */
  tmdbId: z.number(),
  
  /**
   * Title of the content
   */
  title: z.string(),
  
  /**
   * Original title (if different from title)
   */
  originalTitle: z.string().optional(),
  
  /**
   * Brief synopsis/overview
   */
  overview: z.string().nullable(),
  
  /**
   * Poster image URL (full URL)
   */
  posterUrl: z.string().nullable(),
  
  /**
   * Backdrop image URL (full URL)
   */
  backdropUrl: z.string().nullable(),
  
  /**
   * TMDB rating (0-10)
   */
  rating: z.number().min(0).max(10).nullable(),
  
  /**
   * Vote count for the rating
   */
  voteCount: z.number().optional(),
  
  /**
   * Content type
   */
  contentType: ContentTypeSchema,
  
  /**
   * Release year
   */
  releaseYear: z.number().optional(),
  
  /**
   * Genre names
   */
  genres: z.array(z.string()).optional(),
  
  /**
   * Original language code
   */
  language: z.string().optional(),
  
  /**
   * Runtime in minutes (for movies)
   */
  runtime: z.number().optional(),
  
  /**
   * Number of seasons (for series)
   */
  numberOfSeasons: z.number().optional(),
});

export type RecommendationItem = z.infer<typeof RecommendationItemSchema>;

/**
 * Full recommendation response schema
 */
export const GenerateRecommendationResSchema = z.object({
  /**
   * The single recommended item
   */
  item: RecommendationItemSchema,
  
  /**
   * Source/mode that generated this recommendation
   */
  source: z.enum(['FILTERED', 'SMART', 'REROLL']),
  
  /**
   * Timestamp when generated
   */
  generatedAt: z.string().datetime(),
  
  /**
   * History entry ID for feedback
   */
  historyId: z.string(),
});

export type GenerateRecommendationResDto = z.infer<typeof GenerateRecommendationResSchema>;
