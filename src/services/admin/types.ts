/**
 * Admin dashboard data contract.
 * Services in this folder return these shapes; pages in src/app/admin render them.
 * Shares are 0..1, times are ISO strings (server components pass them as-is).
 */

import type { AdminRange } from '@/config/admin.config';
import type { ContentType } from '@/dtos/common.dto';

/** A number for the selected range and the same measure for the range before it. */
export interface Kpi {
  value: number | null;
  prior: number | null;
  /** One point per day across the range (oldest first), for a sparkline. */
  trend: number[];
}

export interface LiveEvent {
  at: string;
  userId: string;
  name: string;
  image: string | null;
  kind: 'signup' | 'onboarded' | 'action' | 'play' | 'save' | 'chip';
  /** e.g. "played Past Lives", "said Not tonight to Jawan". */
  text: string;
  /** Dislike / never again: rendered in signal red. */
  negative: boolean;
}

export interface OverviewData {
  range: AdminRange;
  /** Distinct (user,title) picks shown that were played within 6h of first being shown. */
  pickToPlay: Kpi;
  /** Median seconds from first shown to first play, converted picks only. */
  medianTimeToPlaySec: Kpi;
  /** Of users active in the range, share active on 2 or more distinct days. */
  returningShare: Kpi;
  /** Distinct users with any activity in the last 7 days (independent of range). */
  activeUsers7d: number;
  totalUsers: number;
  daily: { date: string; activeUsers: number; picksServed: number }[];
  funnel: { shown: number; actedOn: number; played: number; qualified: number; liked: number };
  /** [7 rows Mon..Sun][24 hours] impression counts in ADMIN_TIMEZONE. */
  heatmap: number[][];
  /** Newest first, at most 15, not range-bound. */
  live: LiveEvent[];
}

export type UserFilter = 'all' | 'active' | 'dormant' | 'unfinished';

export interface SignupFunnel {
  signedUp: number;
  startedProfile: number;
  finishedProfile: number;
  sawPick: number;
  pressedPlay: number;
  /** Active on a second distinct day after their first. */
  cameBack: number;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  image: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
  profileComplete: boolean;
  picksSeen: number;
  plays: number;
  likes: number;
  dislikes: number;
  topGenre: { name: string; weight: number } | null;
  /** Impressions per day, last 14 days, oldest first. */
  activity14d: number[];
}

export interface UsersData {
  funnel: SignupFunnel;
  counts: Record<UserFilter, number>;
  /** Filtered and searched, sorted by lastActiveAt desc (never-active last). */
  users: UserRow[];
}

export interface UserDossier {
  user: UserRow;
  stats: { picksSeen: number; plays: number; pickToPlay: number | null; likes: number; dislikes: number; saved: number };
  profile: { contentTypes: ContentType[]; genres: string[]; languages: string[]; minRating: number | null; complete: boolean } | null;
  /** Union of profile genres and learned genre keys; weight 50 = neutral; sorted by weight desc. */
  saidVsDid: { genreId: string; name: string; weight: number; stated: boolean }[];
  languages: { code: string; name: string; weight: number; stated: boolean }[];
  /** Newest first, at most 20. */
  timeline: { at: string; text: string; detail: string | null; negative: boolean }[];
  /** Most recent first, at most 6. pct is 0..1 or null when duration unknown. */
  progress: { tmdbId: number; contentType: ContentType; title: string; posterPath: string | null; season: number | null; episode: number | null; pct: number | null; lastWatchedAt: string }[];
  watchlist: { tmdbId: number; contentType: ContentType; title: string; posterPath: string | null }[];
}

export interface TasteData {
  range: AdminRange;
  /** profileShare: share of complete profiles listing it. playShare: share of genre-known plays. Sorted by profileShare desc. */
  genres: { id: string; name: string; profileShare: number; playShare: number }[];
  contentMix: Record<'profiles' | 'served' | 'played', Record<ContentType, number>>;
  languages: { code: string; name: string; share: number }[];
  minRating: { value: number; count: number }[];
  /** Learned chips users currently qualify for (weights >= 60), across all users. */
  learnedChips: { label: string; users: number }[];
  /** From chip tap events in the range. */
  chipTaps: { label: string; taps: number; users: number }[];
  /** How many plays could be matched to a shown pick (genre known). */
  playsCounted: number;
}

export interface TitleStat {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  count: number;
  /** misses only: times shown. */
  shown?: number;
}

export interface PicksData {
  range: AdminRange;
  heroVsFeed: { hero: number | null; feed: number | null };
  /** Seeded = impression came from the "because you watched" pool. Only impressions recorded after the seeded flag shipped count. */
  seededVsDiscover: { seeded: number | null; discover: number | null; seededShown: number };
  /** Share of recorded actions by mode. */
  smartVsRefine: { smart: number; refine: number };
  mostPlayed: TitleStat[];
  mostLoved: TitleStat[];
  /** Shown to 3+ distinct users (or 3+ times), never played. */
  misses: TitleStat[];
}

export interface TrafficData {
  range: AdminRange;
  /** Earliest event on record; null means tracking has produced nothing yet. */
  trackingSince: string | null;
  totals: { visitors: number; signedInVisitors: number; views: number };
  /** Distinct anon ids per day, split by whether that visitor was signed in that day. */
  daily: { date: string; signedIn: number; anonymous: number; views: number }[];
  routes: { path: string; views: number }[];
  devices: { device: 'phone' | 'tablet' | 'desktop'; share: number }[];
  referrers: { host: string; visits: number; share: number }[];
  providers: { id: string; name: string; attempts: number; loadRate: number | null; timeoutRate: number | null; switchRate: number | null; medianLoadMs: number | null }[];
  anonFunnel: { visitors: number; searched: number; openedPlayer: number; signedIn: number };
}

export interface SystemData {
  uptimeSec: number;
  mongo: 'connected' | 'connecting' | 'disconnected';
  tmdbConfigured: boolean;
  bytezConfigured: boolean;
  caches: { name: string; size: number; hits: number; misses: number; hitRate: number }[];
  diversity: {
    users: number;
    hero: { avgDistinctTypes: number; avgDistinctGenres: number; typeShare: Record<string, number>; seededShare: number };
    feed: { avgDistinctTypes: number; avgDistinctGenres: number; avgDistinctSeeds: number; avgSeededItems: number };
  };
}
