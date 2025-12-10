/**
 * Recommendation History Model
 * Stores generated recommendations for users
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
     * Genre names
     */
    genres: {
      type: [String],
      default: [],
    },
    
    /**
     * Original language code
     */
    language: {
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
     * Poster image path (TMDB path, not full URL)
     */
    posterPath: {
      type: String,
    },
    
    /**
     * How this recommendation was generated
     */
    source: {
      type: String,
      enum: ['FILTERED', 'SMART', 'REROLL'],
      required: true,
    },
    
    /**
     * User feedback
     */
    feedback: {
      type: String,
      enum: ['LIKE', 'UNLIKE', null],
      default: null,
    },
    
    /**
     * When feedback was given
     */
    feedbackAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'recommendation_histories',
  }
);

// Indexes for efficient queries
recommendationHistorySchema.index({ userId: 1, createdAt: -1 });
recommendationHistorySchema.index({ userId: 1, tmdbId: 1 });
recommendationHistorySchema.index({ userId: 1, feedback: 1 });

// Types
export type RecommendationHistory = InferSchemaType<typeof recommendationHistorySchema> & {
  userId: Types.ObjectId;
};
export type RecommendationHistoryDocument = HydratedDocument<RecommendationHistory>;

// Model
export const RecommendationHistoryModel = 
  models.RecommendationHistory || model<RecommendationHistory>('RecommendationHistory', recommendationHistorySchema);
