/**
 * History Response DTO
 * Response structure for history queries
 */

import { z } from 'zod';
import { ContentTypeSchema } from '../common.dto';

/**
 * Action types
 */
export const HistoryActionSchema = z.enum([
  'WATCHED',
  'SKIPPED',
  'LIKED',
  'DISLIKED',
  'BLACKLISTED',
]);

/**
 * Single history item
 */
export const HistoryItemSchema = z.object({
  id: z.string(),
  tmdbId: z.number(),
  contentType: ContentTypeSchema,
  action: HistoryActionSchema,
  title: z.string(),
  posterPath: z.string().optional(),
  rating: z.number().optional(),
  releaseDate: z.string().optional(),
  source: z.enum(['FILTERED', 'SMART']),
  createdAt: z.string().datetime(),
});

export type HistoryItem = z.infer<typeof HistoryItemSchema>;

/**
 * Paginated history response
 */
export const HistoryListResSchema = z.object({
  items: z.array(HistoryItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export type HistoryListResDto = z.infer<typeof HistoryListResSchema>;

/**
 * User stats response
 */
export const UserStatsResSchema = z.object({
  watchedCount: z.number(),
  likedCount: z.number(),
  dislikedCount: z.number(),
  averageRating: z.number(),
});

export type UserStatsResDto = z.infer<typeof UserStatsResSchema>;
