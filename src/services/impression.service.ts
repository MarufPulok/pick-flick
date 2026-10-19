/**
 * Impression Service
 * Logs what the user was shown so preference weights can use hit rates,
 * not just raw signal counts.
 */

import { ContentType } from '@/config/app.config';
import { ImpressionModel } from '@/infrastructure/db/models';
import { logger } from '@/lib/logger';

export class ImpressionService {
  /** Fire-and-forget from the serving routes: never throws. */
  static async record(
    userId: string,
    surface: 'hero' | 'feed',
    items: Array<{ tmdbId: number; contentType: ContentType; genreIds: number[]; originalLanguage: string; seed?: unknown; seeded?: boolean }>
  ): Promise<void> {
    if (items.length === 0) return;
    try {
      await ImpressionModel.insertMany(
        items.map((i) => ({
          userId,
          surface,
          tmdbId: i.tmdbId,
          contentType: i.contentType,
          genreIds: i.genreIds.map(String),
          originalLanguage: i.originalLanguage,
          // Served picks carry `seed`; a `shown` echo carries `seeded` (absent = unknown).
          seeded: 'seeded' in i ? i.seeded : !!i.seed,
        })),
        { ordered: false }
      );
    } catch (err) {
      logger.error('Failed to record impressions:', err);
    }
  }
}
