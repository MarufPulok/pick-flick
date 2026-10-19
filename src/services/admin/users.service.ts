/**
 * Admin Users: list with signup funnel and filters, and the per-user dossier.
 */

import { GENRE_NAMES, getLanguageName } from '@/config/genre-names';
import { objectIdRegex, type ContentType } from '@/dtos/common.dto';
import {
  connectToDatabase,
  RecommendationHistoryModel,
  TasteProfileModel,
  UserModel,
  ViewingProgressModel,
  WatchlistModel,
} from '@/infrastructure/db';
import { PreferenceWeightsService } from '@/services/preference-weights.service';
import { Types } from 'mongoose';
import {
  actionText,
  activeDays,
  conversion,
  DAY,
  displayName,
  joinedAt,
  joinPicks,
  loadActivity,
  loadImpressions,
  loadPlays,
  safe,
  timeSeries,
  type HistoryAction,
  type UserLite,
} from './shared';
import type { SignupFunnel, UserDossier, UserFilter, UserRow, UsersData } from './types';

interface ProfileRow {
  userId: Types.ObjectId;
  contentTypes: ContentType[];
  genres: string[];
  languages: string[];
  minRating?: number;
  complete?: boolean;
}

type Weights = Awaited<ReturnType<typeof PreferenceWeightsService.getWeights>>;

const getWeights = (id: string) => safe('weights', () => PreferenceWeightsService.getWeights(id, { empirical: false }), null);

/** Strongest named genre above neutral. */
function topGenre(w: Weights): UserRow['topGenre'] {
  const [id, weight] =
    Object.entries(w?.genreWeights ?? {})
      .filter(([k, v]) => GENRE_NAMES[k] && v > 50)
      .sort((a, b) => b[1] - a[1])[0] ?? [];
  return id ? { name: GENRE_NAMES[id], weight: Math.round(weight) } : null;
}

interface Built {
  rows: UserRow[];
  profiles: Map<string, ProfileRow>;
  days: Map<string, Set<string>>;
}

/** Rows for the given users (all when `only` is omitted). */
async function buildRows(only?: Types.ObjectId): Promise<Built> {
  const now = Date.now();
  const last14 = timeSeries(14, false, now);
  const [users, profiles, acts, feelings] = await Promise.all([
    UserModel.find(only ? { _id: only } : {}).select('name email image createdAt').lean<UserLite[]>().exec(),
    safe('profiles', () => TasteProfileModel.find(only ? { userId: only } : {}).lean<ProfileRow[]>().exec(), []),
    safe('activity', () => loadActivity(new Date(0), only), []),
    safe(
      'feelings',
      () =>
        RecommendationHistoryModel.aggregate<{ _id: { u: Types.ObjectId; a: HistoryAction }; n: number }>([
          { $match: { action: { $in: ['LIKED', 'DISLIKED', 'BLACKLISTED'] }, ...(only && { userId: only }) } },
          { $group: { _id: { u: '$userId', a: '$action' }, n: { $sum: 1 } } },
        ]).exec(),
      []
    ),
  ]);
  const weights = await Promise.all(users.map((u) => getWeights(String(u._id))));

  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));
  const days = activeDays(acts);
  const per = new Map<string, { last: number; shown: number; plays: number; daily: Map<string, number> }>();
  for (const a of acts) {
    const s = per.get(a.userId) ?? { last: 0, shown: 0, plays: 0, daily: new Map() };
    s.last = Math.max(s.last, a.at.getTime());
    if (a.src === 'shown') {
      s.shown++;
      const k = last14.keyOf(a.at);
      s.daily.set(k, (s.daily.get(k) ?? 0) + 1);
    }
    if (a.src === 'play') s.plays++;
    per.set(a.userId, s);
  }
  const count = (u: string, ...actions: HistoryAction[]) =>
    feelings.filter((f) => String(f._id.u) === u && actions.includes(f._id.a)).reduce((n, f) => n + f.n, 0);

  const rows = users.map((u, i): UserRow => {
    const id = String(u._id);
    const s = per.get(id);
    return {
      id,
      name: displayName(u),
      email: u.email ?? '',
      image: u.image ?? null,
      joinedAt: joinedAt(u).toISOString(),
      lastActiveAt: s ? new Date(s.last).toISOString() : null,
      profileComplete: !!profileMap.get(id)?.complete,
      picksSeen: s?.shown ?? 0,
      plays: s?.plays ?? 0,
      likes: count(id, 'LIKED'),
      dislikes: count(id, 'DISLIKED', 'BLACKLISTED'),
      topGenre: topGenre(weights[i]),
      activity14d: last14.keys.map((k) => s?.daily.get(k) ?? 0),
    };
  });
  return { rows, profiles: profileMap, days };
}

export async function listUsers(opts: { filter: UserFilter; q?: string }): Promise<UsersData> {
  await connectToDatabase();
  const { rows, profiles, days } = await buildRows();
  const now = Date.now();

  const is: Record<UserFilter, (r: UserRow) => boolean> = {
    all: () => true,
    active: (r) => !!r.lastActiveAt && now - Date.parse(r.lastActiveAt) < 7 * DAY,
    dormant: (r) => r.profileComplete && now - Math.max(Date.parse(r.lastActiveAt ?? r.joinedAt), Date.parse(r.joinedAt)) >= 30 * DAY,
    unfinished: (r) => !r.profileComplete,
  };
  const funnel: SignupFunnel = {
    signedUp: rows.length,
    startedProfile: rows.filter((r) => profiles.has(r.id)).length,
    finishedProfile: rows.filter((r) => r.profileComplete).length,
    sawPick: rows.filter((r) => r.picksSeen > 0).length,
    pressedPlay: rows.filter((r) => r.plays > 0).length,
    cameBack: rows.filter((r) => (days.get(r.id)?.size ?? 0) >= 2).length,
  };
  const q = opts.q?.trim().toLowerCase();
  const users = rows
    .filter(is[opts.filter] ?? is.all)
    .filter((r) => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    .sort((a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? '') || b.joinedAt.localeCompare(a.joinedAt));

  return {
    funnel,
    counts: {
      all: rows.length,
      active: rows.filter(is.active).length,
      dormant: rows.filter(is.dormant).length,
      unfinished: rows.filter(is.unfinished).length,
    },
    users,
  };
}

export async function getUserDossier(userId: string): Promise<UserDossier | null> {
  if (!objectIdRegex.test(userId)) return null;
  await connectToDatabase();
  const oid = new Types.ObjectId(userId);
  type Item = { tmdbId: number; contentType: ContentType; title: string; posterPath?: string | null; createdAt: Date };
  type Hist = Item & { action: HistoryAction; source?: 'SMART' | 'FILTERED' };
  type Prog = Item & { season?: number | null; episode?: number | null; positionSeconds?: number; durationSeconds?: number; lastWatchedAt: Date };

  const [{ rows, profiles }, weights, hist, prog, saves, imps, plays] = await Promise.all([
    buildRows(oid),
    getWeights(userId),
    safe('dossier history', () => RecommendationHistoryModel.find({ userId: oid }).sort({ createdAt: -1 }).limit(20).lean<Hist[]>().exec(), []),
    safe('dossier progress', () => ViewingProgressModel.find({ userId: oid }).sort({ lastWatchedAt: -1 }).lean<Prog[]>().exec(), []),
    safe('dossier watchlist', () => WatchlistModel.find({ userId: oid }).sort({ createdAt: -1 }).lean<Item[]>().exec(), []),
    safe('dossier impressions', () => loadImpressions(new Date(0), oid), []),
    safe('dossier plays', () => loadPlays(new Date(0), oid), []),
  ]);
  const user = rows[0];
  if (!user) return null;
  const p = profiles.get(userId);

  const merge = (stated: string[], learned: Record<string, number> | undefined, name: (k: string) => string | undefined) =>
    [...new Set([...stated, ...Object.keys(learned ?? {})])]
      .flatMap((k) => {
        const n = name(k);
        return n ? [{ key: k, name: n, weight: Math.round(learned?.[k] ?? 50), stated: stated.includes(k) }] : [];
      })
      .sort((a, b) => b.weight - a.weight);

  const timeline: UserDossier['timeline'] = [
    { at: user.joinedAt, text: 'signed up', detail: null, negative: false },
    ...hist.map((h) => ({ at: h.createdAt.toISOString(), ...actionText(h.action, h.title), detail: h.source === 'FILTERED' ? 'from Refine' : null })),
    ...prog.map((x) => ({
      at: x.createdAt.toISOString(),
      text: `played ${x.title}`,
      detail: x.season ? `S${x.season} E${x.episode ?? 1}` : null,
      negative: false,
    })),
    ...saves.map((s) => ({ at: s.createdAt.toISOString(), text: `saved ${s.title}`, detail: null, negative: false })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20);

  return {
    user,
    stats: {
      picksSeen: user.picksSeen,
      plays: user.plays,
      pickToPlay: conversion(joinPicks(imps, plays, new Date(0), new Date())),
      likes: user.likes,
      dislikes: user.dislikes,
      saved: saves.length,
    },
    profile: p
      ? { contentTypes: p.contentTypes, genres: p.genres, languages: p.languages, minRating: p.minRating ?? null, complete: !!p.complete }
      : null,
    saidVsDid: merge(p?.genres ?? [], weights?.genreWeights, (k) => GENRE_NAMES[k]).map(({ key, ...r }) => ({ genreId: key, ...r })),
    languages: merge(p?.languages ?? [], weights?.languageWeights, getLanguageName).map(({ key, ...r }) => ({ code: key, ...r })),
    timeline,
    progress: prog.slice(0, 6).map((x) => ({
      tmdbId: x.tmdbId,
      contentType: x.contentType,
      title: x.title,
      posterPath: x.posterPath ?? null,
      season: x.season ?? null,
      episode: x.episode ?? null,
      pct: x.durationSeconds ? Math.min(1, (x.positionSeconds ?? 0) / x.durationSeconds) : null,
      lastWatchedAt: x.lastWatchedAt.toISOString(),
    })),
    watchlist: saves.map((s) => ({ tmdbId: s.tmdbId, contentType: s.contentType, title: s.title, posterPath: s.posterPath ?? null })),
  };
}
