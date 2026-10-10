/**
 * Impression Model
 * One row per title shown to a user (hero pick or feed card). Joined with
 * positive outcomes to get per-genre/language/type hit rates.
 */

import { Schema, Types, model, models, type InferSchemaType } from 'mongoose';

const impressionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tmdbId: { type: Number, required: true },
    contentType: { type: String, enum: ['MOVIE', 'SERIES', 'ANIME'], required: true },
    /** TMDB genre ids as strings, like the rest of the DB. */
    genreIds: { type: [String], default: [] },
    originalLanguage: { type: String },
    surface: { type: String, enum: ['hero', 'feed'], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'impressions', versionKey: false }
);

// Rates only look back this far; older rows expire on their own.
impressionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 * 24 * 60 * 60 });
impressionSchema.index({ userId: 1, createdAt: -1 });

export type Impression = InferSchemaType<typeof impressionSchema> & { userId: Types.ObjectId };

export const ImpressionModel = models.Impression || model<Impression>('Impression', impressionSchema);
