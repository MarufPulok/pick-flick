/**
 * Events API Route
 * POST - record an anonymous usage event (sent via sendBeacon)
 */

import { EventReqSchema } from '@/dtos/request/event.req.dto';
import { auth } from '@/lib/auth';
import { recordEvent } from '@/services/event.service';
import { NextRequest, NextResponse } from 'next/server';

const MAX_BYTES = 2048;

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Record a usage event (view, player, chip)
 *     responses:
 *       204: { description: Recorded or ignored }
 *       400: { description: Invalid event }
 *       413: { description: Body too large }
 */
export async function POST(req: NextRequest) {
  const text = await req.text().catch(() => '');
  if (text.length > MAX_BYTES) return new NextResponse(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }
  const parsed = EventReqSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });

  const event = parsed.data;
  if (event.type === 'view' && /^\/(admin|api)(\/|$)/.test(event.path)) return new NextResponse(null, { status: 204 });

  const session = await auth().catch(() => null);
  await recordEvent(event, { userId: session?.user?.id, userAgent: req.headers.get('user-agent') });
  return new NextResponse(null, { status: 204 });
}
