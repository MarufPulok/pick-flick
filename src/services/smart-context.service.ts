/**
 * Smart Context
 * Everything the SMART pipeline needs about a user, loaded once per request.
 * Shared by the hero pick (/api/recommendation) and the For-you rail (/api/feed).
 */

import { ContentType } from '@/config/app.config';
import { TasteProfileModel } from '@/infrastructure/db/models';
import { servedCache } from '@/lib/cache';
import { HistoryService } from '@/services/history.service';
import { PreferenceWeightsService } from '@/services/preference-weights.service';

const SERVED_TTL = 6 * 60 * 60 * 1000;
const SERVED_MAX = 100; // X caps served ids by count and age; so do we

type ServedMap = Map<string, { at: number; type: string; genre?: string }>;

/** Drops entries older than 6h and keeps the newest 100. Map order is insertion order, oldest first. */
function pruneServed(m: ServedMap): ServedMap {
  const cutoff = Date.now() - SERVED_TTL;
  const kept = [...m].filter(([, v]) => v.at >= cutoff).slice(-SERVED_MAX);
  return new Map(kept);
}

export async function loadSmartContext(userId: string) {
  // One failing query degrades that signal instead of 500ing the pick.
  const [savedR, excludedR, recentR, weightsR, seedsR] = await Promise.allSettled([
    TasteProfileModel.findOne({ userId }),
    HistoryService.getExcluded(userId),
    HistoryService.getRecentContentTypes(userId, 5),
    PreferenceWeightsService.getWeights(userId),
    HistoryService.getSeeds(userId),
  ]);
  const ok = <T,>(r: PromiseSettledResult<T>, name: string, fallback: T): T => {
    if (r.status === 'fulfilled') return r.value;
    console.error(`loadSmartContext: ${name} failed`, r.reason);
    return fallback;
  };
  // Without a finished profile, fall back to whatever onboarding captured so
  // far, then to broad well-rated defaults, so the page always has a pick.
  const saved = ok(savedR, 'profile', null);
  const excluded = ok(excludedR, 'excluded', new Set<string>());
  const historyTypes = ok(recentR, 'recentTypes', [] as string[]);
  const weights = ok(weightsR, 'weights', undefined);
  const seeds = ok(seedsR, 'seeds', []);
  const profileComplete = Boolean(saved?.complete);

  // Picks this server served in the last 6 hours, so a reload rotates.
  const served = pruneServed(servedCache.get(userId) ?? new Map());
  served.forEach((_, k) => excluded.add(k));

  // Newest first. Empty after a server restart: fall back to history for types.
  const recent = [...served.values()].reverse();
  const recentTypes = recent.length ? recent.slice(0, 5).map((v) => v.type) : historyTypes;
  const recentGenres = recent.slice(0, 10).flatMap((v) => (v.genre ? [v.genre] : []));

  return {
    profileComplete,
    served,
    request: {
      contentTypes: (saved?.contentTypes?.length ? saved.contentTypes : ['MOVIE', 'SERIES']) as ContentType[],
      genres: (saved?.genres ?? []) as string[],
      languages: (saved?.languages?.length ? saved.languages : ['en']) as string[],
      minRating: (saved?.minRating as number | undefined) ?? (profileComplete ? undefined : 6.5),
      excluded,
      recentTypes,
      recentGenres,
      seeds,
      weights: weights
        ? { genres: weights.genreWeights, contentTypes: weights.contentTypeWeights, languages: weights.languageWeights }
        : undefined,
    },
  };
}

export function markServed(userId: string, served: ServedMap, key: string, meta: { type: string; genre?: string }) {
  served.delete(key); // re-insert so Map order stays oldest-first
  served.set(key, { at: Date.now(), ...meta });
  servedCache.set(userId, pruneServed(served), SERVED_TTL);
}
