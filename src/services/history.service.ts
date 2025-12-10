/**
 * History Service
 * Manages recommendation history and user actions
 */

import { ContentType } from '@/config/app.config';
import { RecommendationHistoryModel } from '@/infrastructure/db/models';

interface RecordActionRequest {
  userId: string;
  tmdbId: number;
  contentType: ContentType;
  action: 'WATCHED' | 'SKIPPED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED';
  title: string;
  posterPath?: string;
  rating?: number;
  releaseDate?: string;
  source?: 'FILTERED' | 'SMART';
}

export class HistoryService {
  /**
   * Record a user action on a recommendation
   */
  static async recordAction(request: RecordActionRequest) {
    const {
      userId,
      tmdbId,
      contentType,
      action,
      title,
      posterPath,
      rating,
      releaseDate,
      source = 'SMART',
    } = request;

    // Create or update history entry
    const history = await RecommendationHistoryModel.findOneAndUpdate(
      { userId, tmdbId, contentType },
      {
        userId,
        tmdbId,
        contentType,
        action,
        title,
        posterPath,
        rating,
        releaseDate,
        source,
      },
      { upsert: true, new: true }
    );

    return history;
  }

  /**
   * Get user's recommendation history
   */
  static async getHistory(userId: string, options: {
    action?: 'WATCHED' | 'LIKED' | 'DISLIKED';
    limit?: number;
    skip?: number;
  } = {}) {
    const { action, limit = 20, skip = 0 } = options;

    const query: any = { userId };
    if (action) {
      query.action = action;
    }

    const [items, total] = await Promise.all([
      RecommendationHistoryModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      RecommendationHistoryModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Get list of blacklisted TMDB IDs for a user
   */
  static async getBlacklist(userId: string): Promise<Set<string>> {
    const blacklisted = await RecommendationHistoryModel.find({
      userId,
      action: 'BLACKLISTED',
    })
      .select('tmdbId contentType')
      .lean();

    // Return set of "tmdbId:contentType" strings for quick lookup
    return new Set(
      blacklisted.map((item) => `${item.tmdbId}:${item.contentType}`)
    );
  }

  /**
   * Check if content is blacklisted
   */
  static async isBlacklisted(
    userId: string,
    tmdbId: number,
    contentType: ContentType
  ): Promise<boolean> {
    const exists = await RecommendationHistoryModel.findOne({
      userId,
      tmdbId,
      contentType,
      action: 'BLACKLISTED',
    });

    return !!exists;
  }

  /**
   * Get user stats
   */
  static async getUserStats(userId: string) {
    const [watchedCount, likedCount, dislikedCount] = await Promise.all([
      RecommendationHistoryModel.countDocuments({ userId, action: 'WATCHED' }),
      RecommendationHistoryModel.countDocuments({ userId, action: 'LIKED' }),
      RecommendationHistoryModel.countDocuments({ userId, action: 'DISLIKED' }),
    ]);

    // Get average rating of watched content
    const watchedItems = await RecommendationHistoryModel.find({
      userId,
      action: 'WATCHED',
      rating: { $exists: true, $ne: null },
    })
      .select('rating')
      .lean();

    const averageRating =
      watchedItems.length > 0
        ? watchedItems.reduce((sum, item) => sum + (item.rating || 0), 0) /
          watchedItems.length
        : 0;

    return {
      watchedCount,
      likedCount,
      dislikedCount,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  /**
   * Get recent activity (last N items)
   */
  static async getRecentActivity(userId: string, limit: number = 5) {
    const items = await RecommendationHistoryModel.find({
      userId,
      action: { $in: ['WATCHED', 'LIKED'] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return items;
  }
}
