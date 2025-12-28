/**
 * Watchlist Model
 * Stores user's saved content for later viewing
 */

import { Schema, Types, model, models, type HydratedDocument, type InferSchemaType } from 'mongoose';

const watchlistSchema = new Schema(
  {
    /**
     * Reference to user
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    /**
     * TMDB ID of the content
     */
    tmdbId: {
      type: Number,
      required: true,
    },
    
    /**
     * Content type
     */
    contentType: {
      type: String,
      enum: ['MOVIE', 'SERIES', 'ANIME'],
      required: true,
    },
    
    /**
     * Content title
     */
    title: {
      type: String,
      required: true,
    },
    
    /**
     * Poster image path (TMDB path, not full URL)
     */
    posterPath: {
      type: String,
    },
    
    /**
     * Priority level for user organization
     */
    priority: {
      type: String,
      enum: ['HIGH', 'NORMAL', 'LOW'],
      default: 'NORMAL',
    },
    
    /**
     * Optional user notes
     */
    notes: {
      type: String,
      maxlength: 500,
    },
    
    /**
     * TMDB rating (for display)
     */
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    
    /**
     * Release date (for display)
     */
    releaseDate: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'watchlist',
  }
);

// Indexes for efficient queries
watchlistSchema.index({ userId: 1, createdAt: -1 });
watchlistSchema.index({ userId: 1, tmdbId: 1, contentType: 1 }, { unique: true });
watchlistSchema.index({ userId: 1, priority: 1 });
watchlistSchema.index({ userId: 1, contentType: 1 });

// Types
export type Watchlist = InferSchemaType<typeof watchlistSchema> & {
  userId: Types.ObjectId;
};
export type WatchlistDocument = HydratedDocument<Watchlist>;

// Model
export const WatchlistModel = 
  models.Watchlist || model<Watchlist>('Watchlist', watchlistSchema);
