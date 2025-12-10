/**
 * Common Zod Schemas
 * Shared schemas used across multiple DTOs
 */

import { z } from 'zod';

/**
 * Content Type Enum
 */
export const ContentTypeSchema = z.enum(['MOVIE', 'SERIES', 'ANIME']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

/**
 * Recommendation Mode Enum
 */
export const RecommendationModeSchema = z.enum(['FILTERED', 'SMART']);
export type RecommendationMode = z.infer<typeof RecommendationModeSchema>;

/**
 * Feedback Type Enum
 */
export const FeedbackTypeSchema = z.enum(['LIKE', 'UNLIKE']);
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;

/**
 * Pagination Schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});
export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * MongoDB ObjectId validation regex
 */
export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * MongoDB ObjectId Schema
 */
export const ObjectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');
