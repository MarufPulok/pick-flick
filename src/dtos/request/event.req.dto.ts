/**
 * Event Request DTO
 * Usage events beaconed from the browser (page view, player outcome, chip tap)
 */

import { z } from 'zod';
import { PLAYER_STATUSES } from '@/infrastructure/db/models/event.model';

const anonId = z.string().min(8).max(64).regex(/^[A-Za-z0-9-]+$/);

export const EventReqSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('view'),
    anonId,
    path: z.string().max(200).startsWith('/'),
    ref: z.string().max(100).optional(),
  }),
  z.object({
    type: z.literal('player'),
    anonId,
    provider: z.string().max(40),
    status: z.enum(PLAYER_STATUSES),
    ms: z.number().int().min(0).max(120000).optional(),
  }),
  z.object({
    type: z.literal('chip'),
    anonId,
    label: z.string().max(60),
  }),
]);

export type EventReqDto = z.infer<typeof EventReqSchema>;
