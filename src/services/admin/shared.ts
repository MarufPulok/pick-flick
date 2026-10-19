/**
 * Admin shared helpers: time windows and buckets in ADMIN_TIMEZONE, the
 * pick→play join, activity loading, and small math.
 */

import { ADMIN_RANGES, ADMIN_TIMEZONE, type AdminRange } from '@/config/admin.config';
import type { ContentType } from '@/dtos/common.dto';
import {
  ImpressionModel,
  RecommendationHistoryModel,
  ViewingProgressModel,
  WatchlistModel,
} from '@/infrastructure/db';
import { logger } from '@/lib/logger';
import { seenKey } from '@/services/history.service';
import type { Types } from 'mongoose';

export const HOUR = 3_600_000;
export const DAY = 86_400_000;
const PLAY_WINDOW = 6 * HOUR;

export function rangeWindow(range: AdminRange, now = Date.now()) {
  const ms = ADMIN_RANGES[range] * DAY;
  return { start: new Date(now - ms), end: new Date(now), priorStart: new Date(now - 2 * ms) };
}

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: ADMIN_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
});
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(d: Date | number) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: p.year, m: p.month, d: p.day, h: p.hour };
}

/** 'YYYY-MM-DD' in ADMIN_TIMEZONE. */
export function dayKey(d: Date | number): string {
  const p = parts(d);
  return `${p.y}-${p.m}-${p.d}`;
}

/** 'YYYY-MM-DD HH' in ADMIN_TIMEZONE. */
export function hourKey(d: Date | number): string {
  const p = parts(d);
  return `${p.y}-${p.m}-${p.d} ${p.h}`;
}

export interface Series {
  keys: string[];
  labels: string[];
  keyOf: (d: Date | number) => string;
}

/** `count` consecutive day (or hour) buckets ending now, oldest first. */
export function timeSeries(count: number, hourly: boolean, now = Date.now()): Series {
  const step = hourly ? HOUR : DAY;
  const keyOf = hourly ? hourKey : dayKey;
  const keys: string[] = [];
  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const p = parts(now - i * step);
    keys.push(keyOf(now - i * step));
    labels.push(hourly ? `${p.h}:00` : `${MONTHS[Number(p.m) - 1]} ${Number(p.d)}`);
  }
  return { keys, labels, keyOf };
}

/** '24h' gets 24 hourly points; every other range one point per day. */
export function rangeSeries(range: AdminRange, now = Date.now()): Series {
  return range === '24h' ? timeSeries(24, true, now) : timeSeries(ADMIN_RANGES[range], false, now);
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function ratio(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

/** Run one dashboard section; on failure log and hand back the fallback so the page still renders. */
export async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logger.error(`[admin] ${label} failed:`, err);
    return fallback;
  }
}

export const inRange = (at: Date, from: Date, to: Date) => at >= from && at < to;

// ---------- pick → play join ----------

export interface ImpressionRow {
  userId: Types.ObjectId;
  tmdbId: number;
  contentType: ContentType;
  genreIds?: string[];
  originalLanguage?: string;
  surface: 'hero' | 'feed';
  seeded?: boolean;
  createdAt: Date;
}

export interface PlayRow {
  userId: Types.ObjectId;
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  learned?: boolean;
  createdAt: Date;
}

/** One user×title, keyed in the TMDB media namespace so SERIES/ANIME labels never split a title. */
export const pickKey = (userId: Types.ObjectId | string, tmdbId: number, contentType: string) =>
  `${String(userId)}:${seenKey(tmdbId, contentType)}`;

export function loadImpressions(from: Date, userId?: Types.ObjectId): Promise<ImpressionRow[]> {
  return ImpressionModel.find({ createdAt: { $gte: from }, ...(userId && { userId }) })
    .select('userId tmdbId contentType genreIds originalLanguage surface seeded createdAt')
    .sort({ createdAt: 1 })
    .lean<ImpressionRow[]>()
    .exec();
}

export function loadPlays(from: Date, userId?: Types.ObjectId): Promise<PlayRow[]> {
  return ViewingProgressModel.find({ createdAt: { $gte: from }, ...(userId && { userId }) })
    .select('userId tmdbId contentType title posterPath learned createdAt')
    .lean<PlayRow[]>()
    .exec();
}

export interface PickOutcome {
  first: ImpressionRow;
  /** Seconds from first shown to first play; null when not played within 6h. */
  ttp: number | null;
}

/**
 * Distinct user×title picks first shown in [from, to), each marked converted when that
 * user's first play landed within 6h of the first impression in the window.
 * `imps` must be sorted by createdAt ascending.
 */
// ponytail: JS join over all impressions in range; move to $lookup if impressions pass ~200k
export function joinPicks(imps: ImpressionRow[], plays: PlayRow[], from: Date, to: Date): PickOutcome[] {
  const playAt = new Map(plays.map((p) => [pickKey(p.userId, p.tmdbId, p.contentType), p.createdAt.getTime()]));
  const firsts = new Map<string, ImpressionRow>();
  for (const i of imps) {
    if (!inRange(i.createdAt, from, to)) continue;
    const k = pickKey(i.userId, i.tmdbId, i.contentType);
    if (!firsts.has(k)) firsts.set(k, i);
  }
  return [...firsts.entries()].map(([k, first]) => {
    const at = playAt.get(k);
    const shown = first.createdAt.getTime();
    const ok = at !== undefined && at >= shown && at <= shown + PLAY_WINDOW;
    return { first, ttp: ok ? (at - shown) / 1000 : null };
  });
}

export const conversion = (picks: PickOutcome[]) => ratio(picks.filter((p) => p.ttp !== null).length, picks.length);

// ---------- activity ----------

export type ActivitySource = 'shown' | 'action' | 'play' | 'resume' | 'save';
export interface Activity {
  userId: string;
  at: Date;
  src: ActivitySource;
}

/** Every timestamped thing a user did since `from`: impressions, history, play opens and resumes, saves. */
export async function loadActivity(from: Date, userId?: Types.ObjectId): Promise<Activity[]> {
  const q = { ...(userId && { userId }) };
  type Row = { userId: Types.ObjectId; createdAt: Date; lastWatchedAt?: Date };
  const [imps, hist, prog, saves] = await Promise.all([
    ImpressionModel.find({ ...q, createdAt: { $gte: from } }).select('userId createdAt').lean<Row[]>().exec(),
    RecommendationHistoryModel.find({ ...q, createdAt: { $gte: from } }).select('userId createdAt').lean<Row[]>().exec(),
    ViewingProgressModel.find({ ...q, $or: [{ createdAt: { $gte: from } }, { lastWatchedAt: { $gte: from } }] })
      .select('userId createdAt lastWatchedAt')
      .lean<Row[]>()
      .exec(),
    WatchlistModel.find({ ...q, createdAt: { $gte: from } }).select('userId createdAt').lean<Row[]>().exec(),
  ]);
  const rows = (xs: Row[], src: ActivitySource): Activity[] =>
    xs.map((x) => ({ userId: String(x.userId), at: x.createdAt, src }));
  return [
    ...rows(imps, 'shown'),
    ...rows(hist, 'action'),
    ...rows(prog.filter((p) => p.createdAt >= from), 'play'),
    ...prog
      .filter((p) => p.lastWatchedAt && p.lastWatchedAt >= from)
      .map((p) => ({ userId: String(p.userId), at: p.lastWatchedAt as Date, src: 'resume' as const })),
    ...rows(saves, 'save'),
  ];
}

/** Distinct ADMIN_TIMEZONE days each user was active on. */
export function activeDays(acts: Activity[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const a of acts) {
    const set = out.get(a.userId) ?? new Set<string>();
    set.add(dayKey(a.at));
    out.set(a.userId, set);
  }
  return out;
}

// ---------- labels ----------

export interface UserLite {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  image?: string;
  createdAt?: Date;
}

export const displayName = (u?: UserLite | null) => u?.name || u?.email?.split('@')[0] || 'Unknown user';
/** Adapter-created users have no createdAt; the ObjectId carries the insert time. */
export const joinedAt = (u: UserLite) => u.createdAt ?? u._id.getTimestamp();

export type HistoryAction = 'WATCHED' | 'SKIPPED' | 'LIKED' | 'DISLIKED' | 'BLACKLISTED';

export function actionText(action: HistoryAction, title: string): { text: string; negative: boolean } {
  switch (action) {
    case 'LIKED':
      return { text: `loved ${title}`, negative: false };
    case 'SKIPPED':
      return { text: `said Not tonight to ${title}`, negative: false };
    case 'DISLIKED':
      return { text: `disliked ${title}`, negative: true };
    case 'BLACKLISTED':
      return { text: `never again: ${title}`, negative: true };
    default:
      return { text: `marked ${title} as seen`, negative: false };
  }
}
