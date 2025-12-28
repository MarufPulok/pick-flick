/**
 * Watchlist Response DTO
 * Response structure for watchlist queries
 */

import { z } from 'zod';
import { ContentTypeSchema } from '../common.dto';

/**
 * Priority levels
 */
export const WatchlistPrioritySchema = z.enum(['HIGH', 'NORMAL', 'LOW']);

/**
 * Single watchlist item
 */
export const WatchlistItemSchema = z.object({
  id: z.string(),
  tmdbId: z.number(),
  contentType: ContentTypeSchema,
  title: z.string(),
  posterPath: z.string().optional(),
  rating: z.number().optional(),
  releaseDate: z.string().optional(),
  priority: WatchlistPrioritySchema,
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;

/**
 * Paginated watchlist response
 */
export const WatchlistListResSchema = z.object({
  items: z.array(WatchlistItemSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export type WatchlistListResDto = z.infer<typeof WatchlistListResSchema>;

/**
 * Watchlist stats response
 */
export const WatchlistStatsResSchema = z.object({
  total: z.number(),
  byType: z.object({
    MOVIE: z.number(),
    SERIES: z.number(),
    ANIME: z.number(),
  }),
});

export type WatchlistStatsResDto = z.infer<typeof WatchlistStatsResSchema>;
