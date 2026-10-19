/**
 * Event Model
 * Lightweight usage events for the admin Traffic screen: page views, player
 * source outcomes, mood chip taps. Anonymous visitors are counted by a random
 * browser id; no IP or raw user agent is stored.
 */

import { Schema, Types, model, models, type InferSchemaType } from 'mongoose';

export const EVENT_TYPES = ['view', 'player', 'chip'] as const;
export const PLAYER_STATUSES = ['attempt', 'loaded', 'timeout', 'switched'] as const;
export const DEVICES = ['phone', 'tablet', 'desktop'] as const;

const eventSchema = new Schema(
  {
    type: { type: String, enum: EVENT_TYPES, required: true },
    /** Random id kept in the browser's localStorage. */
    anonId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    device: { type: String, enum: DEVICES, required: true },
    /** view: pathname without query. */
    path: { type: String },
    /** view: external referrer host, first view of a visit only. */
    ref: { type: String },
    /** player: embed provider id and what happened. */
    provider: { type: String },
    status: { type: String, enum: PLAYER_STATUSES },
    /** player: ms from frame mount to load. */
    ms: { type: Number },
    /** chip: the chip id tapped. */
    label: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'events', versionKey: false }
);

eventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 * 24 * 60 * 60 });
eventSchema.index({ type: 1, createdAt: -1 });
eventSchema.index({ userId: 1, createdAt: -1 });

export type AppEvent = InferSchemaType<typeof eventSchema> & { userId?: Types.ObjectId };

export const EventModel = models.Event || model<AppEvent>('Event', eventSchema);
