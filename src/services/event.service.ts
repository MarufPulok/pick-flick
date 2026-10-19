/**
 * Event Service
 * Stores anonymous usage events for the admin Traffic screen.
 */

import { connectToDatabase } from '@/infrastructure/db';
import { EventModel } from '@/infrastructure/db/models';
import type { EventReqDto } from '@/dtos/request/event.req.dto';
import { logger } from '@/lib/logger';

export function deviceFromUserAgent(ua: string | null): 'phone' | 'tablet' | 'desktop' {
  if (!ua) return 'desktop';
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'phone';
  return 'desktop';
}

/** Never throws. */
export async function recordEvent(
  input: EventReqDto,
  ctx: { userId?: string; userAgent: string | null }
): Promise<void> {
  try {
    await connectToDatabase();
    await EventModel.create({ ...input, userId: ctx.userId, device: deviceFromUserAgent(ctx.userAgent) });
  } catch (err) {
    logger.error('Failed to record event:', err);
  }
}
