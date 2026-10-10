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

export async function loadSmartContext(userId: string) {
  // Without a finished profile, fall back to whatever onboarding captured so
  // far, then to broad well-rated defaults, so the page always has a pick.
  const [saved, excluded, recentTypes, weights, seeds] = await Promise.all([
    TasteProfileModel.findOne({ userId }),
    HistoryService.getExcluded(userId),
    HistoryService.getRecentContentTypes(userId, 3),
    PreferenceWeightsService.getWeights(userId),
    HistoryService.getSeeds(userId, 3),
  ]);
  const profileComplete = Boolean(saved?.complete);

  // Picks this server served in the last 6 hours, so a reload rotates.
  const served = servedCache.get(userId) ?? new Set<string>();
  served.forEach((k) => excluded.add(k));

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
      seeds,
      weights: weights
        ? { genres: weights.genreWeights, contentTypes: weights.contentTypeWeights, languages: weights.languageWeights }
        : undefined,
    },
  };
}

export function markServed(userId: string, served: Set<string>, key: string) {
  served.add(key);
  servedCache.set(userId, served, 6 * 60 * 60 * 1000);
}
