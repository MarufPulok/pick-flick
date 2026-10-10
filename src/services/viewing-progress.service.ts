/**
 * Viewing Progress Service
 * Manages continue watching functionality
 */

import { ContentType } from '@/dtos/common.dto';
import { ViewingProgressModel } from '@/infrastructure/db/models/viewing-progress.model';

/**
 * A play counts as really watched past 10 minutes or 20% of the runtime.
 * X drops video views under 10s; we want a sit-down, not a peek.
 */
export const QUALIFIED_PLAY_SECONDS = 600;
export const QUALIFIED_PLAY_FRACTION = 0.2;
export const isQualifiedPlay = (positionSeconds: number, durationSeconds: number) =>
  positionSeconds >= QUALIFIED_PLAY_SECONDS ||
  (durationSeconds > 0 && positionSeconds >= QUALIFIED_PLAY_FRACTION * durationSeconds);

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
   * `created` is true when this call inserted the record (first play of the title).
   */
  static async recordViewing(request: RecordViewingRequest): Promise<{ item: ContinueWatchingItem; created: boolean }> {
    const { userId, tmdbId, contentType, title, posterPath, season, episode, positionSeconds, durationSeconds } = request;
    const isProgressPing = positionSeconds !== undefined;

    const set: Record<string, unknown> = { title, posterPath: posterPath || null, lastWatchedAt: new Date() };
    if (season !== undefined) set.season = season;
    if (episode !== undefined) set.episode = episode;
    if (isProgressPing) {
      set.positionSeconds = positionSeconds;
      if (durationSeconds) set.durationSeconds = durationSeconds;
    }

    const res = await ViewingProgressModel.findOneAndUpdate(
      { userId, tmdbId, contentType },
      {
        $set: set,
        $setOnInsert: { userId, tmdbId, contentType },
        ...(isProgressPing ? {} : { $inc: { watchCount: 1 } }),
      },
      { upsert: true, new: true, includeResultMetadata: true }
    );

    return { item: toItem(res.value), created: !res.lastErrorObject?.updatedExisting };
  }

  /**
   * Flip learned false -> true once per title. The filter makes it atomic, so
   * concurrent progress pings can't both win. $ne covers rows from before the field.
   */
  static async claimLearned(userId: string, tmdbId: number, contentType: ContentType): Promise<boolean> {
    const res = await ViewingProgressModel.updateOne(
      { userId, tmdbId, contentType, learned: { $ne: true } },
      { $set: { learned: true } }
    );
    return res.modifiedCount === 1;
  }

  /** Backfill a poster for a record created from a link that carried none. */
  static async setPoster(userId: string, tmdbId: number, contentType: ContentType, posterPath: string): Promise<void> {
    await ViewingProgressModel.updateOne({ userId, tmdbId, contentType, posterPath: null }, { $set: { posterPath } });
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
