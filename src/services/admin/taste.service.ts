/**
 * Admin Taste: what users said in onboarding vs what got served and played,
 * plus learned mood chips and chip taps.
 */

import type { AdminRange } from '@/config/admin.config';
import { GENRE_NAMES, getLanguageName, LANGUAGE_NAMES } from '@/config/genre-names';
import type { ContentType } from '@/dtos/common.dto';
import { connectToDatabase, EventModel, PreferenceWeightsModel, TasteProfileModel } from '@/infrastructure/db';
import { BASE_CHIPS } from '@/lib/mood-chips';
import { PreferenceWeightsService } from '@/services/preference-weights.service';
import type { Types } from 'mongoose';
import { DAY, inRange, loadImpressions, loadPlays, pickKey, rangeWindow, ratio, safe, type ImpressionRow } from './shared';
import type { TasteData } from './types';

const TYPES: ContentType[] = ['MOVIE', 'SERIES', 'ANIME'];
const BASE_GENRES = new Set(BASE_CHIPS.flatMap((c) => c.genres));

function mix(types: ContentType[]): Record<ContentType, number> {
  return Object.fromEntries(TYPES.map((t) => [t, ratio(types.filter((x) => x === t).length, types.length) ?? 0])) as Record<
    ContentType,
    number
  >;
}

function tally<T>(xs: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

/** Mirrors buildMoodChips: weight >= 60, named, top 3; base-chip genres and English never become learned chips. */
function chipLabels(w: { genreWeights: Record<string, number>; languageWeights: Record<string, number> }): string[] {
  const top = (weights: Record<string, number>, names: Record<string, string>) =>
    Object.entries(weights)
      .filter(([k, v]) => v >= 60 && names[k])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
  return [
    ...top(w.genreWeights, GENRE_NAMES).filter((g) => !BASE_GENRES.has(g)).map((g) => `More ${GENRE_NAMES[g]}`),
    ...top(w.languageWeights, LANGUAGE_NAMES).filter((l) => l !== 'en').map((l) => `${LANGUAGE_NAMES[l]} night`),
  ];
}

async function loadLearnedChips(): Promise<TasteData['learnedChips']> {
  const ids = await PreferenceWeightsModel.find().select('userId').lean<{ userId: Types.ObjectId }[]>().exec();
  const all = await Promise.all(ids.map((d) => PreferenceWeightsService.getWeights(String(d.userId), { empirical: false })));
  const counts = tally(all.flatMap((w) => (w ? chipLabels(w) : [])));
  return [...counts].map(([label, users]) => ({ label, users })).sort((a, b) => b.users - a.users);
}

async function loadChipTaps(start: Date): Promise<TasteData['chipTaps']> {
  type Row = { label?: string; anonId: string; userId?: Types.ObjectId };
  const rows = await EventModel.find({ type: 'chip', createdAt: { $gte: start } }).select('label anonId userId').lean<Row[]>().exec();
  const by = new Map<string, { taps: number; users: Set<string> }>();
  for (const r of rows) {
    if (!r.label) continue;
    const s = by.get(r.label) ?? { taps: 0, users: new Set<string>() };
    s.taps++;
    s.users.add(r.userId ? String(r.userId) : r.anonId);
    by.set(r.label, s);
  }
  return [...by].map(([label, s]) => ({ label, taps: s.taps, users: s.users.size })).sort((a, b) => b.taps - a.taps);
}

export async function getTaste(range: AdminRange): Promise<TasteData> {
  await connectToDatabase();
  const { start, end } = rangeWindow(range);
  type Profile = { contentTypes: ContentType[]; genres: string[]; languages: string[]; minRating?: number };

  const [profiles, imps, plays, learnedChips, chipTaps] = await Promise.all([
    safe('taste profiles', () => TasteProfileModel.find({ complete: true }).lean<Profile[]>().exec(), []),
    // A play's genre comes from any impression of that title in the 120 days before it.
    safe('taste impressions', () => loadImpressions(new Date(start.getTime() - 120 * DAY)), []),
    safe('taste plays', () => loadPlays(start), []),
    safe('taste learned chips', loadLearnedChips, []),
    safe('taste chip taps', () => loadChipTaps(start), []),
  ]);

  // Latest impression per user×title, walked in time order so each play sees only what came before it.
  const latest = new Map<string, ImpressionRow>();
  const sortedPlays = [...plays].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const playGenres: string[] = [];
  let i = 0;
  for (const p of sortedPlays) {
    while (i < imps.length && imps[i].createdAt <= p.createdAt) {
      latest.set(pickKey(imps[i].userId, imps[i].tmdbId, imps[i].contentType), imps[i]);
      i++;
    }
    const imp = latest.get(pickKey(p.userId, p.tmdbId, p.contentType));
    const g = imp?.genreIds?.[0];
    if (g && p.createdAt.getTime() - imp.createdAt.getTime() <= 120 * DAY) playGenres.push(g);
  }

  const profileGenres = tally(profiles.flatMap((p) => [...new Set(p.genres)]));
  const playTally = tally(playGenres);
  const genres = [...new Set([...profileGenres.keys(), ...playTally.keys()])]
    .filter((id) => GENRE_NAMES[id])
    .map((id) => ({
      id,
      name: GENRE_NAMES[id],
      profileShare: ratio(profileGenres.get(id) ?? 0, profiles.length) ?? 0,
      playShare: ratio(playTally.get(id) ?? 0, playGenres.length) ?? 0,
    }))
    .sort((a, b) => b.profileShare - a.profileShare || b.playShare - a.playShare);

  const languages = [...tally(profiles.flatMap((p) => [...new Set(p.languages)]))]
    .map(([code, n]) => ({ code, name: getLanguageName(code), share: n / profiles.length }))
    .sort((a, b) => b.share - a.share);

  const minRating = [...tally(profiles.flatMap((p) => (typeof p.minRating === 'number' ? [p.minRating] : [])))]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value - b.value);

  return {
    range,
    genres,
    contentMix: {
      profiles: mix(profiles.flatMap((p) => p.contentTypes)),
      served: mix(imps.filter((x) => inRange(x.createdAt, start, end)).map((x) => x.contentType)),
      played: mix(plays.map((p) => p.contentType)),
    },
    languages,
    minRating,
    learnedChips,
    chipTaps,
    playsCounted: playGenres.length,
  };
}
