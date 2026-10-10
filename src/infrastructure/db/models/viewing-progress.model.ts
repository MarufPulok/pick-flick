/**
 * Viewing Progress Model
 * Tracks user's in-app streaming sessions for "Continue Watching" feature
 */

import { ContentType } from '@/dtos/common.dto';
import mongoose, { Document, Schema } from 'mongoose';

export interface IViewingProgress extends Document {
  userId: mongoose.Types.ObjectId;
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
  learned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ViewingProgressSchema = new Schema<IViewingProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tmdbId: {
      type: Number,
      required: true,
    },
    contentType: {
      type: String,
      enum: ['MOVIE', 'SERIES', 'ANIME'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
      default: null,
    },
    season: { type: Number, default: null },
    episode: { type: Number, default: null },
    positionSeconds: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    watchCount: {
      type: Number,
      default: 1,
    },
    /** Set once when a play crosses the "really watched" bar; the +4 learn fires only on that flip. */
    learned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
ViewingProgressSchema.index({ userId: 1, tmdbId: 1, contentType: 1 }, { unique: true });

// Index for sorting by last watched
ViewingProgressSchema.index({ userId: 1, lastWatchedAt: -1 });

export const ViewingProgressModel =
  mongoose.models.ViewingProgress ||
  mongoose.model<IViewingProgress>('ViewingProgress', ViewingProgressSchema);
