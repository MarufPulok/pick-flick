/**
 * History Request DTO
 * Validation for history actions
 */

import { z } from 'zod';
import { ContentTypeSchema } from '../common.dto';

/**
 * Action types for recommendation history
 */
export const HistoryActionSchema = z.enum([
  'WATCHED',
  'SKIPPED',
  'LIKED',
  'DISLIKED',
  'BLACKLISTED',
]);

export type HistoryAction = z.infer<typeof HistoryActionSchema>;

/**
 * Request to record a user action
 */
export const RecordActionReqSchema = z.object({
  /**
   * TMDB content ID
   */
  tmdbId: z.number().int().positive(),
  
  /**
   * Content type
   */
  contentType: ContentTypeSchema,
  
  /**
   * Action type
   */
  action: HistoryActionSchema,
  
  /**
   * Content title
   */
  title: z.string().min(1),
  
  /**
   * Poster path (optional)
   */
  posterPath: z.string().optional(),
  
  /**
   * Rating (optional)
   */
  rating: z.number().min(0).max(10).optional(),
  
  /**
   * Release date (optional)
   */
  releaseDate: z.string().optional(),
  
  /**
   * Recommendation source
   */
  source: z.enum(['FILTERED', 'SMART']).default('SMART'),
});

export type RecordActionReqDto = z.infer<typeof RecordActionReqSchema>;
