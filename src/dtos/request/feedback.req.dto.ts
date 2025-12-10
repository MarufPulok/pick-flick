/**
 * Feedback Request DTO
 * Validates Like/Unlike actions on recommendations
 */

import { z } from 'zod';
import { FeedbackTypeSchema, ObjectIdSchema } from '../common.dto';

/**
 * Request schema for submitting feedback on a recommendation
 */
export const FeedbackReqSchema = z.object({
  /**
   * The recommendation history item ID
   */
  recommendationId: ObjectIdSchema,
  
  /**
   * The feedback type
   * - LIKE: Add weight to similar content
   * - UNLIKE: Blacklist this content
   */
  feedback: FeedbackTypeSchema,
});

export type FeedbackReqDto = z.infer<typeof FeedbackReqSchema>;
