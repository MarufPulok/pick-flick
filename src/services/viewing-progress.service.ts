/**
 * Viewing Progress Service
 * Manages continue watching functionality
 */

import { ContentType } from '@/dtos/common.dto';
import { ViewingProgressModel } from '@/infrastructure/db/models/viewing-progress.model';

interface RecordViewingRequest {
  userId: string;
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath?: string | null;
}

interface ContinueWatchingItem {
  _id: string;
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  lastWatchedAt: Date;
  watchCount: number;
}

export class ViewingProgressService {
  /**
   * Record or update a viewing session
   */
  static async recordViewing(request: RecordViewingRequest): Promise<ContinueWatchingItem> {
    const { userId, tmdbId, contentType, title, posterPath } = request;

    const progress = await ViewingProgressModel.findOneAndUpdate(
      { userId, tmdbId, contentType },
      {
        userId,
        tmdbId,
        contentType,
        title,
        posterPath: posterPath || null,
        lastWatchedAt: new Date(),
        $inc: { watchCount: 1 },
      },
      { upsert: true, new: true }
    );

    return {
      _id: progress._id.toString(),
      tmdbId: progress.tmdbId,
      contentType: progress.contentType,
      title: progress.title,
      posterPath: progress.posterPath,
      lastWatchedAt: progress.lastWatchedAt,
      watchCount: progress.watchCount,
    };
  }

  /**
   * Get user's continue watching list
   */
  static async getContinueWatching(
    userId: string,
    limit: number = 10
  ): Promise<ContinueWatchingItem[]> {
    const items = await ViewingProgressModel.find({ userId })
      .sort({ lastWatchedAt: -1 })
      .limit(limit)
      .lean();

    return items.map((item) => ({
      _id: item._id.toString(),
      tmdbId: item.tmdbId,
      contentType: item.contentType,
      title: item.title,
      posterPath: item.posterPath,
      lastWatchedAt: item.lastWatchedAt,
      watchCount: item.watchCount,
    }));
  }

  /**
   * Remove item from continue watching
   */
  static async removeFromContinue(
    userId: string,
    tmdbId: number,
    contentType: ContentType
  ): Promise<boolean> {
    const result = await ViewingProgressModel.deleteOne({
      userId,
      tmdbId,
      contentType,
    });

    return result.deletedCount > 0;
  }

  /**
   * Clear all continue watching for user
   */
  static async clearAll(userId: string): Promise<number> {
    const result = await ViewingProgressModel.deleteMany({ userId });
    return result.deletedCount;
  }
}
