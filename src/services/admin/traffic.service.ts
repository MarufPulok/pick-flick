/**
 * Admin Traffic: visitors, routes, devices, referrers, embed provider health,
 * all from the events collection. Empty until tracking has produced rows.
 */

import type { AdminRange } from '@/config/admin.config';
import { connectToDatabase, EventModel } from '@/infrastructure/db';
import { EMBED_PROVIDERS } from '@/lib/embed-providers';
import type { Types } from 'mongoose';
import { median, rangeSeries, rangeWindow, ratio, safe } from './shared';
import type { TrafficData } from './types';

interface EventRow {
  type: 'view' | 'player' | 'chip';
  anonId: string;
  userId?: Types.ObjectId;
  device: 'phone' | 'tablet' | 'desktop';
  path?: string;
  ref?: string;
  provider?: string;
  status?: 'attempt' | 'loaded' | 'timeout' | 'switched';
  ms?: number;
  createdAt: Date;
}

const DEVICES = ['phone', 'tablet', 'desktop'] as const;

function providerStats(rows: EventRow[]): TrafficData['providers'] {
  const by = new Map<string, EventRow[]>();
  for (const r of rows) if (r.provider) by.set(r.provider, [...(by.get(r.provider) ?? []), r]);
  return [...by]
    .map(([id, xs]) => {
      const n = (s: EventRow['status']) => xs.filter((x) => x.status === s).length;
      const attempts = n('attempt');
      return {
        id,
        name: EMBED_PROVIDERS.find((p) => p.id === id)?.name ?? id,
        attempts,
        loadRate: ratio(n('loaded'), attempts),
        timeoutRate: ratio(n('timeout'), attempts),
        switchRate: ratio(n('switched'), attempts),
        medianLoadMs: median(xs.filter((x) => x.status === 'loaded' && typeof x.ms === 'number').map((x) => x.ms as number)),
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
}

function emptyTraffic(range: AdminRange, trackingSince: string | null): TrafficData {
  return {
    range,
    trackingSince,
    totals: { visitors: 0, signedInVisitors: 0, views: 0 },
    daily: [],
    routes: [],
    devices: [],
    referrers: [],
    providers: [],
    anonFunnel: { visitors: 0, searched: 0, openedPlayer: 0, signedIn: 0 },
  };
}

export async function getTraffic(range: AdminRange): Promise<TrafficData> {
  await connectToDatabase();
  const now = Date.now();
  const { start } = rangeWindow(range, now);
  const series = rangeSeries(range, now);

  const [firstEvent, rows] = await Promise.all([
    safe('traffic first', () => EventModel.findOne().sort({ createdAt: 1 }).select('createdAt').lean<{ createdAt: Date }>().exec(), null),
    safe('traffic events', () => EventModel.find({ createdAt: { $gte: start } }).lean<EventRow[]>().exec(), []),
  ]);
  const trackingSince = firstEvent?.createdAt.toISOString() ?? null;
  if (!rows.length) return emptyTraffic(range, trackingSince);

  const views = rows.filter((r) => r.type === 'view');
  const visitors = new Set(rows.map((r) => r.anonId));
  const signedIn = new Set(rows.filter((r) => r.userId).map((r) => r.anonId));

  // Per bucket: who showed up, and who of them was signed in during that bucket.
  const buckets = new Map<string, { all: Set<string>; signed: Set<string>; views: number }>();
  for (const r of rows) {
    const k = series.keyOf(r.createdAt);
    const b = buckets.get(k) ?? { all: new Set<string>(), signed: new Set<string>(), views: 0 };
    b.all.add(r.anonId);
    if (r.userId) b.signed.add(r.anonId);
    if (r.type === 'view') b.views++;
    buckets.set(k, b);
  }

  const count = <T>(xs: T[]) => {
    const m = new Map<T, number>();
    for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
    return m;
  };

  const deviceOf = new Map(rows.map((r) => [r.anonId, r.device]));
  const deviceCounts = count([...deviceOf.values()]);
  const refs = views.flatMap((v) => (v.ref ? [v.ref] : []));

  // Visitors seen at least once without a session, and how far they got.
  const anon = new Set(rows.filter((r) => !r.userId).map((r) => r.anonId));
  const reached = (pred: (r: EventRow) => boolean) => new Set(rows.filter((r) => anon.has(r.anonId) && pred(r)).map((r) => r.anonId)).size;

  return {
    range,
    trackingSince,
    totals: { visitors: visitors.size, signedInVisitors: signedIn.size, views: views.length },
    daily: series.keys.map((k, i) => {
      const b = buckets.get(k);
      return {
        date: series.labels[i],
        signedIn: b?.signed.size ?? 0,
        anonymous: b ? b.all.size - b.signed.size : 0,
        views: b?.views ?? 0,
      };
    }),
    routes: [...count(views.flatMap((v) => (v.path ? [v.path] : [])))]
      .map(([path, n]) => ({ path, views: n }))
      .sort((a, b) => b.views - a.views),
    devices: DEVICES.map((device) => ({ device, share: ratio(deviceCounts.get(device) ?? 0, deviceOf.size) ?? 0 })),
    referrers: [...count(refs)]
      .map(([host, visits]) => ({ host, visits, share: visits / refs.length }))
      .sort((a, b) => b.visits - a.visits),
    providers: providerStats(rows.filter((r) => r.type === 'player')),
    anonFunnel: {
      visitors: anon.size,
      searched: reached((r) => r.type === 'view' && !!r.path?.startsWith('/search')),
      openedPlayer: reached((r) => r.type === 'player'),
      signedIn: reached((r) => !!r.userId),
    },
  };
}
