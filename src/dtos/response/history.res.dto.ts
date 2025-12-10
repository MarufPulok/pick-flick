/**
 * History Response DTO
 * Response structure for recommendation history
 */

import { z } from 'zod';
import { ContentTypeSchema, FeedbackTypeSchema } from '../common.dto';

/**
 * Single history item schema
 */
export const HistoryItemSchema = z.object({
  /**
   * History entry ID
   */
  id: z.string(),
  
  /**
   * TMDB ID
   */
  tmdbId: z.number(),
  
  /**
   * Content title
   */
  title: z.string(),
  
  /**
   * Poster URL
   */
  posterUrl: z.string().nullable(),
  
  /**
   * TMDB rating
   */
  rating: z.number().nullable(),
  
  /**
   * Content type
   */
  contentType: ContentTypeSchema,
  
  /**
   * Genre names
   */
  genres: z.array(z.string()).optional(),
  
  /**
   * User feedback (if any)
   */
  feedback: FeedbackTypeSchema.nullable(),
  
  /**
   * When this was generated
   */
  generatedAt: z.string().datetime(),
});

export type HistoryItem = z.infer<typeof HistoryItemSchema>;

/**
 * Paginated history response
 */
export const HistoryResSchema = z.object({
  /**
   * List of history items
   */
  items: z.array(HistoryItemSchema),
  
  /**
   * Total count of items
   */
  total: z.number(),
  
  /**
   * Current page
   */
  page: z.number(),
  
  /**
   * Items per page
   */
  limit: z.number(),
  
  /**
   * Whether there are more items
   */
  hasMore: z.boolean(),
});

export type HistoryResDto = z.infer<typeof HistoryResSchema>;
