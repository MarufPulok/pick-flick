/**
 * Preference Weights Model
 * Stores learned weights for "Smart" recommendations
 */

import { Schema, Types, model, models, type HydratedDocument, type InferSchemaType } from 'mongoose';

const preferenceWeightsSchema = new Schema(
  {
    /**
     * Reference to user
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    
    /**
     * Genre weights - higher = more likely to recommend
     * Key: genre ID, Value: weight (0-100)
     */
    genreWeights: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    
    /**
     * Content type weights
     */
    contentTypeWeights: {
      type: Map,
      of: Number,
      default: new Map([
        ['MOVIE', 50],
        ['SERIES', 50],
        ['ANIME', 50],
      ]),
    },
    
    /**
     * Language weights
     */
    languageWeights: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    
    /**
     * Total likes (used for weight calculations)
     */
    totalLikes: {
      type: Number,
      default: 0,
    },
    
    /**
     * Total dislikes
     */
    totalDislikes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'preference_weights',
  }
);

// Note: userId index is created by unique: true

// Types
export type PreferenceWeights = InferSchemaType<typeof preferenceWeightsSchema> & {
  userId: Types.ObjectId;
};
export type PreferenceWeightsDocument = HydratedDocument<PreferenceWeights>;

// Model
export const PreferenceWeightsModel = 
  models.PreferenceWeights || model<PreferenceWeights>('PreferenceWeights', preferenceWeightsSchema);
