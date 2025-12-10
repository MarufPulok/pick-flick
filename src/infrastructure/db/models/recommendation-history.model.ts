/**
 * Recommendation History Model
 * Tracks user actions on recommendations (watched, liked, disliked, blacklisted)
 */

import { Schema, Types, model, models, type HydratedDocument, type InferSchemaType } from 'mongoose';

const recommendationHistorySchema = new Schema(
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
     * Content title
     */
    title: {
      type: String,
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
     * User action type
     */
    action: {
      type: String,
      enum: ['WATCHED', 'SKIPPED', 'LIKED', 'DISLIKED', 'BLACKLISTED'],
      required: true,
      index: true,
    },
    
    /**
     * Poster image path (TMDB path, not full URL)
     */
    posterPath: {
      type: String,
    },
    
    /**
     * TMDB rating
     */
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    
    /**
     * Release date
     */
    releaseDate: {
      type: String,
    },
    
    /**
     * How this recommendation was generated
     */
    source: {
      type: String,
      enum: ['FILTERED', 'SMART'],
      default: 'SMART',
    },
  },
  {
    timestamps: true,
    collection: 'recommendation_history',
  }
);

// Indexes for efficient queries
recommendationHistorySchema.index({ userId: 1, createdAt: -1 });
recommendationHistorySchema.index({ userId: 1, tmdbId: 1, contentType: 1 });
recommendationHistorySchema.index({ userId: 1, action: 1, createdAt: -1 });

// Types
export type RecommendationHistory = InferSchemaType<typeof recommendationHistorySchema> & {
  userId: Types.ObjectId;
};
export type RecommendationHistoryDocument = HydratedDocument<RecommendationHistory>;

// Model
export const RecommendationHistoryModel = 
  models.RecommendationHistory || model<RecommendationHistory>('RecommendationHistory', recommendationHistorySchema);
