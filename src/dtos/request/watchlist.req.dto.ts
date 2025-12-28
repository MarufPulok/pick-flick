/**
 * Watchlist Request DTO
 * Validation for watchlist operations
 */

import { z } from 'zod';
import { ContentTypeSchema } from '../common.dto';

/**
 * Priority levels for watchlist items
 */
export const WatchlistPrioritySchema = z.enum(['HIGH', 'NORMAL', 'LOW']);

export type WatchlistPriority = z.infer<typeof WatchlistPrioritySchema>;

/**
 * Request to add item to watchlist
 */
export const AddToWatchlistReqSchema = z.object({
  /**
   * TMDB content ID
   */
  tmdbId: z.number().int().positive(),
  
  /**
   * Content type
   */
  contentType: ContentTypeSchema,
  
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
   * Priority level (optional, defaults to NORMAL)
   */
  priority: WatchlistPrioritySchema.optional(),
  
  /**
   * User notes (optional)
   */
  notes: z.string().max(500).optional(),
});

export type AddToWatchlistReqDto = z.infer<typeof AddToWatchlistReqSchema>;

/**
 * Request to update watchlist item
 */
export const UpdateWatchlistReqSchema = z.object({
  tmdbId: z.number().int().positive(),
  contentType: ContentTypeSchema,
  priority: WatchlistPrioritySchema.optional(),
  notes: z.string().max(500).optional(),
});

export type UpdateWatchlistReqDto = z.infer<typeof UpdateWatchlistReqSchema>;
