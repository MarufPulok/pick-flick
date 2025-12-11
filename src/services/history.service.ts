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

  /**
   * Get last N content types that were recommended to user
   * Used for diversity tracking to avoid consecutive same-type recommendations
   */
  static async getRecentContentTypes(userId: string, limit: number = 3): Promise<string[]> {
    const items = await RecommendationHistoryModel.find({
      userId,
      action: { $in: ['WATCHED', 'LIKED', 'DISLIKED', 'BLACKLISTED'] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('contentType')
      .lean();

    return items.map(item => item.contentType);
  }

  /**
   * Get detailed user statistics including distributions
   */
  static async getDetailedStats(userId: string) {
    const [basic, contentTypeDistribution, likeRatio, streakInfo] = await Promise.all([
      this.getUserStats(userId),
      this.getContentTypeDistribution(userId),
      this.getLikeRatio(userId),
      this.getActivityStreak(userId),
    ]);

    return {
      ...basic,
      contentTypeDistribution,
      likeRatio,
      ...streakInfo,
    };
  }

  /**
   * Get content type distribution (how many movies vs series vs anime liked)
   */
  static async getContentTypeDistribution(userId: string): Promise<{
    MOVIE: number;
    SERIES: number;
    ANIME: number;
  }> {
    const result = await RecommendationHistoryModel.aggregate([
      { $match: { userId, action: { $in: ['WATCHED', 'LIKED'] } } },
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
    ]);

    const distribution: { MOVIE: number; SERIES: number; ANIME: number } = {
      MOVIE: 0,
      SERIES: 0,
      ANIME: 0,
    };

    for (const item of result) {
      if (item._id in distribution) {
        distribution[item._id as keyof typeof distribution] = item.count;
      }
    }

    return distribution;
  }

  /**
   * Get like ratio (likes / (likes + dislikes))
   */
  static async getLikeRatio(userId: string): Promise<number> {
    const [likedCount, dislikedCount] = await Promise.all([
      RecommendationHistoryModel.countDocuments({ userId, action: 'LIKED' }),
      RecommendationHistoryModel.countDocuments({ userId, action: 'DISLIKED' }),
    ]);

    const total = likedCount + dislikedCount;
    if (total === 0) return 0;

    return Math.round((likedCount / total) * 100);
  }

  /**
   * Get activity streak info
   */
  static async getActivityStreak(userId: string): Promise<{
    currentStreak: number;
    lastActiveDate: string | null;
  }> {
    const recentActivity = await RecommendationHistoryModel.find({
      userId,
      action: { $in: ['WATCHED', 'LIKED'] },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('createdAt')
      .lean();

    if (recentActivity.length === 0) {
      return { currentStreak: 0, lastActiveDate: null };
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeDays = new Set<string>();
    for (const item of recentActivity) {
      const date = new Date(item.createdAt);
      date.setHours(0, 0, 0, 0);
      activeDays.add(date.toISOString().split('T')[0]);
    }

    // Count consecutive days from today backwards
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (activeDays.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        // Allow skipping today if not yet active
        break;
      }
    }

    return {
      currentStreak: streak,
      lastActiveDate: recentActivity[0]?.createdAt?.toISOString() || null,
    };
  }

  /**
   * Get recommendation success rate (watched items that were liked)
   */
  static async getSuccessRate(userId: string): Promise<number> {
    const [watchedCount, likedCount] = await Promise.all([
      RecommendationHistoryModel.countDocuments({ userId, action: 'WATCHED' }),
      RecommendationHistoryModel.countDocuments({ userId, action: 'LIKED' }),
    ]);

    // Success = liked / (watched + liked) since a liked item counts as successful
    const total = watchedCount + likedCount;
    if (total === 0) return 0;

    return Math.round((likedCount / total) * 100);
  }
}
