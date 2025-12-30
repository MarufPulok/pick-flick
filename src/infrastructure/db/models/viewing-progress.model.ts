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
  lastWatchedAt: Date;
  watchCount: number;
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
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    watchCount: {
      type: Number,
      default: 1,
    },
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
