/**
 * Onboarding Request DTO
 * Validates user preferences during onboarding
 */

import { z } from 'zod';
import { ContentTypeSchema } from '../common.dto';

/**
 * Request schema for saving onboarding preferences
 */
export const OnboardingReqSchema = z.object({
  /**
   * Preferred content types
   * At least one must be selected
   */
  contentTypes: z.array(ContentTypeSchema).min(1, 'Select at least one content type'),
  
  /**
   * Preferred genre IDs
   * At least 3 must be selected
   */
  genres: z.array(z.string()).min(3, 'Select at least 3 genres'),
  
  /**
   * Preferred language codes (ISO 639-1)
   * At least 1 must be selected
   * Skipped if only 'ANIME' is selected as content type
   */
  languages: z.array(z.string()).min(1, 'Select at least 1 language'),
  
  /**
   * Whether to handle anime language automatically
   * If true, Japanese is auto-added for anime content
   */
  animeAutoLanguage: z.boolean().default(true),
});

export type OnboardingReqDto = z.infer<typeof OnboardingReqSchema>;

/**
 * Relaxed schema for anime-only users (no language requirement)
 */
export const OnboardingAnimeOnlyReqSchema = z.object({
  contentTypes: z.literal('ANIME').array().length(1),
  genres: z.array(z.string()).min(3, 'Select at least 3 genres'),
  languages: z.array(z.string()).optional().default(['ja']),
  animeAutoLanguage: z.literal(true).default(true),
});

export type OnboardingAnimeOnlyReqDto = z.infer<typeof OnboardingAnimeOnlyReqSchema>;
