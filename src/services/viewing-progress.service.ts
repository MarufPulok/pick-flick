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
  season?: number | null;
  episode?: number | null;
  positionSeconds?: number;
  durationSeconds?: number;
}

export interface ContinueWatchingItem {
  _id: string;
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  season: number | null;
  episode: number | null;
  positionSeconds: number;
  durationSeconds: number;
  lastWatchedAt: Date;
  watchCount: number;
}

function toItem(d: {
  _id: { toString(): string };
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  season?: number | null;
  episode?: number | null;
  positionSeconds?: number;
  durationSeconds?: number;
  lastWatchedAt: Date;
  watchCount: number;
}): ContinueWatchingItem {
  return {
    _id: d._id.toString(),
    tmdbId: d.tmdbId,
    contentType: d.contentType,
    title: d.title,
    posterPath: d.posterPath,
    season: d.season ?? null,
    episode: d.episode ?? null,
    positionSeconds: d.positionSeconds ?? 0,
    durationSeconds: d.durationSeconds ?? 0,
    lastWatchedAt: d.lastWatchedAt,
    watchCount: d.watchCount,
  };
}

export class ViewingProgressService {
  /**
   * Record or update a viewing session.
   * A call without positionSeconds is "player opened" and bumps watchCount;
   * calls with it are progress pings and only move the position.
   */
  static async recordViewing(request: RecordViewingRequest): Promise<ContinueWatchingItem> {
    const { userId, tmdbId, contentType, title, posterPath, season, episode, positionSeconds, durationSeconds } = request;
    const isProgressPing = positionSeconds !== undefined;

    const set: Record<string, unknown> = { title, posterPath: posterPath || null, lastWatchedAt: new Date() };
    if (season !== undefined) set.season = season;
    if (episode !== undefined) set.episode = episode;
    if (isProgressPing) {
      set.positionSeconds = positionSeconds;
      if (durationSeconds) set.durationSeconds = durationSeconds;
    }

    const progress = await ViewingProgressModel.findOneAndUpdate(
      { userId, tmdbId, contentType },
      {
        $set: set,
        $setOnInsert: { userId, tmdbId, contentType },
        ...(isProgressPing ? {} : { $inc: { watchCount: 1 } }),
      },
      { upsert: true, new: true }
    );

    return toItem(progress);
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

    return items.map((item) => toItem(item as Parameters<typeof toItem>[0]));
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
