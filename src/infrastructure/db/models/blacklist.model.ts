/**
 * Blacklist Model
 * Content that should never be recommended to a user
 */

import { Schema, Types, model, models, type HydratedDocument, type InferSchemaType } from 'mongoose';

const blacklistSchema = new Schema(
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
     * TMDB ID of the blacklisted content
     */
    tmdbId: {
      type: Number,
      required: true,
    },
    
    /**
     * Reason for blacklisting
     */
    reason: {
      type: String,
      enum: ['UNLIKE', 'EXPLICIT_BLOCK', 'ALREADY_WATCHED'],
      required: true,
    },
    
    /**
     * Content type
     */
    contentType: {
      type: String,
      enum: ['MOVIE', 'SERIES', 'ANIME'],
    },
    
    /**
     * Title (for display purposes)
     */
    title: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'blacklists',
  }
);

// Compound unique index
blacklistSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

// Types
export type Blacklist = InferSchemaType<typeof blacklistSchema> & {
  userId: Types.ObjectId;
};
export type BlacklistDocument = HydratedDocument<Blacklist>;

// Model
export const BlacklistModel = 
  models.Blacklist || model<Blacklist>('Blacklist', blacklistSchema);
