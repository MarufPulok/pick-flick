/**
 * Admin Picks: which surfaces and pools convert, what gets played and loved,
 * and what keeps getting shown without a single play.
 */

import type { AdminRange } from '@/config/admin.config';
import { getTMDBImageUrl } from '@/config/url.config';
import type { ContentType } from '@/dtos/common.dto';
import { connectToDatabase, RecommendationHistoryModel, ViewingProgressModel } from '@/infrastructure/db';
import { tmdbClient } from '@/infrastructure/external/tmdb.client';
import { seenKey } from '@/services/history.service';
import type { Types } from 'mongoose';
import { conversion, joinPicks, loadImpressions, loadPlays, rangeWindow, ratio, safe, type ImpressionRow } from './shared';
import type { PicksData, TitleStat } from './types';

interface TitleRow {
  userId: Types.ObjectId;
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath?: string | null;
}

/** Group rows by title (TMDB namespace), count distinct users, top 7. */
function topTitles(rows: TitleRow[]): TitleStat[] {
  const by = new Map<string, { row: TitleRow; users: Set<string> }>();
  for (const r of rows) {
    const k = seenKey(r.tmdbId, r.contentType);
    const s = by.get(k) ?? { row: r, users: new Set<string>() };
    s.users.add(String(r.userId));
    by.set(k, s);
  }
  return [...by.values()]
    .map(({ row, users }) => ({
      tmdbId: row.tmdbId,
      contentType: row.contentType,
      title: row.title,
      posterPath: row.posterPath ?? null,
      count: users.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}

async function loadMisses(imps: ImpressionRow[]): Promise<TitleStat[]> {
  const by = new Map<string, { imp: ImpressionRow; shown: number; users: Set<string> }>();
  for (const i of imps) {
    const k = seenKey(i.tmdbId, i.contentType);
    const s = by.get(k) ?? { imp: i, shown: 0, users: new Set<string>() };
    s.shown++;
    s.users.add(String(i.userId));
    by.set(k, s);
  }
  const candidates = [...by].filter(([, s]) => s.users.size >= 3 || s.shown >= 3);
  const played = await ViewingProgressModel.find({ tmdbId: { $in: candidates.map(([, s]) => s.imp.tmdbId) } })
    .select('tmdbId contentType')
    .lean<{ tmdbId: number; contentType: ContentType }[]>()
    .exec();
  const playedKeys = new Set(played.map((p) => seenKey(p.tmdbId, p.contentType)));
  const top = candidates
    .filter(([k]) => !playedKeys.has(k))
    .map(([, s]) => s)
    .sort((a, b) => b.shown - a.shown || b.users.size - a.users.size)
    .slice(0, 7);

  // Impressions carry no title or poster; ask TMDB for the final few only. Stored rows hold full poster URLs, so match that.
  const details = await Promise.allSettled(
    top.map(({ imp }) =>
      imp.contentType === 'MOVIE'
        ? tmdbClient.getMovieDetails(imp.tmdbId).then((d) => ({ title: d.title, posterPath: d.poster_path }))
        : tmdbClient.getTVDetails(imp.tmdbId).then((d) => ({ title: d.name, posterPath: d.poster_path }))
    )
  );
  return top.flatMap(({ imp, shown, users }, i) => {
    const d = details[i];
    return d.status === 'fulfilled'
      ? [{ tmdbId: imp.tmdbId, contentType: imp.contentType, title: d.value.title, posterPath: getTMDBImageUrl(d.value.posterPath, 'LARGE'), count: users.size, shown }]
      : [];
  });
}

export async function getPicks(range: AdminRange): Promise<PicksData> {
  await connectToDatabase();
  const { start, end } = rangeWindow(range);
  type Hist = TitleRow & { action: string; source?: 'SMART' | 'FILTERED' };

  const [imps, plays, hist] = await Promise.all([
    safe('picks impressions', () => loadImpressions(start), []),
    safe('picks plays', () => loadPlays(start), []),
    safe('picks history', () => RecommendationHistoryModel.find({ createdAt: { $gte: start } }).lean<Hist[]>().exec(), []),
  ]);
  const misses = await safe('picks misses', () => loadMisses(imps), []);

  const picks = joinPicks(imps, plays, start, end);
  const known = picks.filter((p) => p.first.seeded !== undefined);
  const refine = hist.filter((h) => h.source === 'FILTERED').length;

  return {
    range,
    heroVsFeed: {
      hero: conversion(picks.filter((p) => p.first.surface === 'hero')),
      feed: conversion(picks.filter((p) => p.first.surface === 'feed')),
    },
    seededVsDiscover: {
      seeded: conversion(known.filter((p) => p.first.seeded)),
      discover: conversion(known.filter((p) => !p.first.seeded)),
      seededShown: known.filter((p) => p.first.seeded).length,
    },
    smartVsRefine: {
      smart: ratio(hist.length - refine, hist.length) ?? 0,
      refine: ratio(refine, hist.length) ?? 0,
    },
    mostPlayed: topTitles(plays),
    mostLoved: topTitles(hist.filter((h) => h.action === 'LIKED')),
    misses,
  };
}
