/**
 * Admin Overview: pick→play KPIs, daily activity, funnel, heatmap, live feed.
 */

import { ADMIN_TIMEZONE, type AdminRange } from '@/config/admin.config';
import {
  connectToDatabase,
  EventModel,
  ImpressionModel,
  RecommendationHistoryModel,
  TasteProfileModel,
  UserModel,
  ViewingProgressModel,
  WatchlistModel,
} from '@/infrastructure/db';
import type { Types } from 'mongoose';
import {
  actionText,
  activeDays,
  conversion,
  DAY,
  displayName,
  inRange,
  joinedAt,
  joinPicks,
  loadActivity,
  loadImpressions,
  loadPlays,
  median,
  rangeSeries,
  rangeWindow,
  ratio,
  safe,
  type Activity,
  type HistoryAction,
  type PickOutcome,
  type UserLite,
} from './shared';
import type { LiveEvent, OverviewData } from './types';

/** Group items into the series buckets and reduce each bucket to a number (0 when empty). */
function trend<T>(keys: string[], items: T[], keyOf: (x: T) => string, reduce: (xs: T[]) => number | null): number[] {
  const groups = new Map<string, T[]>();
  for (const x of items) {
    const k = keyOf(x);
    groups.set(k, [...(groups.get(k) ?? []), x]);
  }
  return keys.map((k) => reduce(groups.get(k) ?? []) ?? 0);
}

const medianTtp = (picks: PickOutcome[]) => median(picks.flatMap((p) => (p.ttp === null ? [] : [p.ttp])));

/** Share of `users` active on 2+ distinct days within `acts`. */
function returning(users: Iterable<string>, days: Map<string, Set<string>>): number | null {
  const list = [...users];
  return ratio(list.filter((u) => (days.get(u)?.size ?? 0) >= 2).length, list.length);
}

async function loadHeatmap(start: Date): Promise<number[][]> {
  const grid = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const rows: { _id: { d: number; h: number }; n: number }[] = await ImpressionModel.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          d: { $isoDayOfWeek: { date: '$createdAt', timezone: ADMIN_TIMEZONE } },
          h: { $hour: { date: '$createdAt', timezone: ADMIN_TIMEZONE } },
        },
        n: { $sum: 1 },
      },
    },
  ]);
  for (const r of rows) grid[r._id.d - 1][r._id.h] = r.n;
  return grid;
}

async function loadLive(): Promise<LiveEvent[]> {
  type Row = { userId: Types.ObjectId; title?: string; action?: HistoryAction; label?: string; createdAt: Date; updatedAt?: Date };
  const newest = { sort: { createdAt: -1 as const }, limit: 15 };
  const [users, profiles, hist, plays, saves, chips] = await Promise.all([
    UserModel.find().sort({ _id: -1 }).limit(15).select('name email image createdAt').lean<UserLite[]>().exec(),
    TasteProfileModel.find({ complete: true }).sort({ updatedAt: -1 }).limit(15).select('userId updatedAt createdAt').lean<Row[]>().exec(),
    RecommendationHistoryModel.find({}, 'userId title action createdAt', newest).lean<Row[]>().exec(),
    ViewingProgressModel.find({}, 'userId title createdAt', newest).lean<Row[]>().exec(),
    WatchlistModel.find({}, 'userId title createdAt', newest).lean<Row[]>().exec(),
    EventModel.find({ type: 'chip', userId: { $exists: true } }, 'userId label createdAt', newest).lean<Row[]>().exec(),
  ]);

  type Draft = Omit<LiveEvent, 'name' | 'image'>;
  const ev = (userId: Types.ObjectId, at: Date, kind: LiveEvent['kind'], text: string, negative = false): Draft => ({
    at: at.toISOString(),
    userId: String(userId),
    kind,
    text,
    negative,
  });
  const drafts: Draft[] = [
    ...users.map((u) => ev(u._id, joinedAt(u), 'signup', 'signed up')),
    ...profiles.map((p) => ev(p.userId, p.updatedAt ?? p.createdAt, 'onboarded', 'finished their taste profile')),
    ...hist.map((h) => {
      const { text, negative } = actionText(h.action ?? 'WATCHED', h.title ?? 'a title');
      return ev(h.userId, h.createdAt, 'action', text, negative);
    }),
    ...plays.map((p) => ev(p.userId, p.createdAt, 'play', `played ${p.title}`)),
    ...saves.map((s) => ev(s.userId, s.createdAt, 'save', `saved ${s.title}`)),
    ...chips.map((c) => ev(c.userId, c.createdAt, 'chip', `tapped "${c.label}"`)),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 15);

  const people = await UserModel.find({ _id: { $in: [...new Set(drafts.map((d) => d.userId))] } })
    .select('name email image')
    .lean<UserLite[]>()
    .exec();
  const byId = new Map(people.map((u) => [String(u._id), u]));
  return drafts.map((d) => ({ ...d, name: displayName(byId.get(d.userId)), image: byId.get(d.userId)?.image ?? null }));
}

export async function getOverview(range: AdminRange): Promise<OverviewData> {
  await connectToDatabase();
  const now = Date.now();
  const { start, end, priorStart } = rangeWindow(range, now);
  const weekAgo = new Date(now - 7 * DAY);
  const series = rangeSeries(range, now);

  const [imps, plays, acts, totalUsers, actedOn, liked, heatmap, live] = await Promise.all([
    safe('overview impressions', () => loadImpressions(priorStart), []),
    safe('overview plays', () => loadPlays(priorStart), []),
    safe('overview activity', () => loadActivity(priorStart < weekAgo ? priorStart : weekAgo), [] as Activity[]),
    safe('overview users', () => UserModel.countDocuments().exec(), 0),
    safe('overview actedOn', () => RecommendationHistoryModel.countDocuments({ createdAt: { $gte: start } }).exec(), 0),
    safe('overview liked', () => RecommendationHistoryModel.countDocuments({ action: 'LIKED', createdAt: { $gte: start } }).exec(), 0),
    safe('overview heatmap', () => loadHeatmap(start), Array.from({ length: 7 }, () => new Array<number>(24).fill(0))),
    safe('overview live', loadLive, []),
  ]);

  const cur = joinPicks(imps, plays, start, end);
  const prior = joinPicks(imps, plays, priorStart, start);
  const pickBucket = (p: PickOutcome) => series.keyOf(p.first.createdAt);

  const curActs = acts.filter((a) => inRange(a.at, start, end));
  const priorActs = acts.filter((a) => inRange(a.at, priorStart, start));
  const curDays = activeDays(curActs);
  const actBuckets = new Map<string, Set<string>>();
  for (const a of curActs) {
    const k = series.keyOf(a.at);
    actBuckets.set(k, (actBuckets.get(k) ?? new Set()).add(a.userId));
  }

  const shownNow = imps.filter((i) => inRange(i.createdAt, start, end));
  const playedNow = plays.filter((p) => inRange(p.createdAt, start, end));
  const servedPerBucket = new Map<string, number>();
  for (const i of shownNow) {
    const k = series.keyOf(i.createdAt);
    servedPerBucket.set(k, (servedPerBucket.get(k) ?? 0) + 1);
  }

  return {
    range,
    pickToPlay: {
      value: conversion(cur),
      prior: conversion(prior),
      trend: trend(series.keys, cur, pickBucket, conversion),
    },
    medianTimeToPlaySec: {
      value: medianTtp(cur),
      prior: medianTtp(prior),
      trend: trend(series.keys, cur, pickBucket, medianTtp),
    },
    returningShare: {
      value: returning(curDays.keys(), curDays),
      prior: (() => {
        const d = activeDays(priorActs);
        return returning(d.keys(), d);
      })(),
      trend: series.keys.map((k) => returning(actBuckets.get(k) ?? [], curDays) ?? 0),
    },
    activeUsers7d: new Set(acts.filter((a) => a.at >= weekAgo).map((a) => a.userId)).size,
    totalUsers,
    daily: series.keys.map((k, i) => ({
      date: series.labels[i],
      activeUsers: actBuckets.get(k)?.size ?? 0,
      picksServed: servedPerBucket.get(k) ?? 0,
    })),
    funnel: {
      shown: shownNow.length,
      actedOn,
      played: playedNow.length,
      qualified: playedNow.filter((p) => p.learned).length,
      liked,
    },
    heatmap,
    live,
  };
}
