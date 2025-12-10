/**
 * Taste Profile Model
 * User preferences collected during onboarding
 */

import { Schema, Types, model, models, type HydratedDocument, type InferSchemaType } from 'mongoose';

const tasteProfileSchema = new Schema(
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
     * Preferred content types
     */
    contentTypes: {
      type: [String],
      enum: ['MOVIE', 'SERIES', 'ANIME'],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one content type is required',
      },
    },
    
    /**
     * Preferred genre IDs (TMDB genre IDs as strings)
     */
    genres: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 3,
        message: 'At least 3 genres are required',
      },
    },
    
    /**
     * Preferred language codes (ISO 639-1)
     */
    languages: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one language is required',
      },
    },
    
    /**
     * Auto-handle Japanese for anime
     * When true, Japanese is auto-added for anime content
     */
    animeAutoLanguage: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'taste_profiles',
  }
);

// Note: userId index is created by unique: true

// Types
export type TasteProfile = InferSchemaType<typeof tasteProfileSchema> & {
  userId: Types.ObjectId;
};
export type TasteProfileDocument = HydratedDocument<TasteProfile>;

// Model
export const TasteProfileModel = 
  models.TasteProfile || model<TasteProfile>('TasteProfile', tasteProfileSchema);
