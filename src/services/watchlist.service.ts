/**
 * Watchlist Service
 * Manages user's saved content for later viewing
 */

import { ContentType } from '@/config/app.config';
import { WatchlistModel, type WatchlistDocument } from '@/infrastructure/db/models';

export interface WatchlistItem {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath?: string;
  rating?: number;
  releaseDate?: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  notes?: string;
}

export interface WatchlistFilters {
  contentType?: ContentType;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  limit?: number;
  skip?: number;
  sortBy?: 'createdAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class WatchlistService {
  /**
   * Add content to user's watchlist
   */
  static async add(userId: string, item: WatchlistItem): Promise<WatchlistDocument> {
    // Upsert to handle duplicates gracefully
    const watchlistItem = await WatchlistModel.findOneAndUpdate(
      { 
        userId, 
        tmdbId: item.tmdbId, 
        contentType: item.contentType 
      },
      {
        userId,
        ...item,
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return watchlistItem;
  }

  /**
   * Remove content from user's watchlist
   */
  static async remove(
    userId: string, 
    tmdbId: number, 
    contentType: ContentType
  ): Promise<boolean> {
    const result = await WatchlistModel.deleteOne({
      userId,
      tmdbId,
      contentType,
    });

    return result.deletedCount > 0;
  }

  /**
   * Get user's watchlist with filters
   */
  static async getList(userId: string, filters: WatchlistFilters = {}) {
    const {
      contentType,
      priority,
      limit = 20,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const query: Record<string, unknown> = { userId };
    
    if (contentType) {
      query.contentType = contentType;
    }
    
    if (priority) {
      query.priority = priority;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortDirection };

    // Secondary sort by createdAt if not primary
    if (sortBy !== 'createdAt') {
      sort.createdAt = -1;
    }

    const [items, total] = await Promise.all([
      WatchlistModel.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean(),
      WatchlistModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Check if content is in user's watchlist
   */
  static async isInWatchlist(
    userId: string, 
    tmdbId: number, 
    contentType: ContentType
  ): Promise<boolean> {
    const exists = await WatchlistModel.findOne({
      userId,
      tmdbId,
      contentType,
    }).select('_id');

    return !!exists;
  }

  /**
   * Get a random item from user's watchlist
   * Useful for "Pick one for me" feature
   */
  static async getRandomItem(
    userId: string, 
    contentType?: ContentType
  ): Promise<WatchlistDocument | null> {
    const query: Record<string, unknown> = { userId };
    if (contentType) {
      query.contentType = contentType;
    }

    // Count total items matching query
    const count = await WatchlistModel.countDocuments(query);
    if (count === 0) return null;

    // Get random item
    const randomSkip = Math.floor(Math.random() * count);
    const item = await WatchlistModel.findOne(query).skip(randomSkip);

    return item;
  }

  /**
   * Get watchlist count for a user
   */
  static async getCount(userId: string): Promise<number> {
    return WatchlistModel.countDocuments({ userId });
  }

  /**
   * Get watchlist count by content type
   */
  static async getCountByType(userId: string): Promise<{
    MOVIE: number;
    SERIES: number;
    ANIME: number;
  }> {
    const result = await WatchlistModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
    ]);

    const counts: { MOVIE: number; SERIES: number; ANIME: number } = {
      MOVIE: 0,
      SERIES: 0,
      ANIME: 0,
    };

    for (const item of result) {
      if (item._id in counts) {
        counts[item._id as keyof typeof counts] = item.count;
      }
    }

    return counts;
  }

  /**
   * Update watchlist item priority or notes
   */
  static async update(
    userId: string,
    tmdbId: number,
    contentType: ContentType,
    updates: { priority?: 'HIGH' | 'NORMAL' | 'LOW'; notes?: string }
  ): Promise<WatchlistDocument | null> {
    const item = await WatchlistModel.findOneAndUpdate(
      { userId, tmdbId, contentType },
      { $set: updates },
      { new: true }
    );

    return item;
  }

  /**
   * Clear entire watchlist for a user
   */
  static async clearAll(userId: string): Promise<number> {
    const result = await WatchlistModel.deleteMany({ userId });
    return result.deletedCount;
  }

  /**
   * Get all TMDB IDs in watchlist (for quick lookup)
   */
  static async getWatchlistIds(userId: string): Promise<Set<string>> {
    const items = await WatchlistModel.find({ userId })
      .select('tmdbId contentType')
      .lean();

    return new Set(
      items.map(item => `${item.tmdbId}:${item.contentType}`)
    );
  }
}
