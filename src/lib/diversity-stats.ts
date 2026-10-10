/**
 * Diversity stats: in-memory ring buffers per user (no persistence, resets on restart).
 * Read via aggregate() only, which drops user ids.
 */

interface Hero { type: string; genre?: string; seeded: boolean; pool?: string }
interface Feed { types: number; genres: number; seeds: number; seeded: number }
const hero = new Map<string, Hero[]>();
const feed = new Map<string, Feed[]>();

function push<T>(m: Map<string, T[]>, userId: string, v: T) {
  m.set(userId, [...(m.get(userId) ?? []), v].slice(-20));
}

type P = { contentType: string; genreIds?: number[]; seed?: { tmdbId: number }; seeds?: { tmdbId: number }[]; pool?: string };
const genre = (p: P) => (p.genreIds?.length ? String(p.genreIds[0]) : undefined);

export function recordHero(userId: string, p: P) {
  push(hero, userId, { type: p.contentType, genre: genre(p), seeded: Boolean(p.seed), pool: p.pool });
}

export function recordFeed(userId: string, picks: P[]) {
  const seeds = new Set(picks.flatMap((p) => (p.seeds ?? (p.seed ? [p.seed] : [])).map((s) => s.tmdbId)));
  push(feed, userId, {
    types: new Set(picks.map((p) => p.contentType)).size,
    genres: new Set(picks.map(genre).filter(Boolean)).size,
    seeds: seeds.size,
    seeded: picks.filter((p) => p.seed).length,
  });
}

const avg = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : 0);

/** Aggregated across users; no ids in the output. */
export function diversityAggregate() {
  const h = [...hero.values()].map((v) => v.slice(-10));
  const f = [...feed.values()].flat();
  const heroes = h.flat();
  const typeShare: Record<string, number> = {};
  heroes.forEach((x) => (typeShare[x.type] = (typeShare[x.type] ?? 0) + 1));
  for (const k in typeShare) typeShare[k] = +(typeShare[k] / heroes.length).toFixed(2);
  return {
    users: h.length,
    hero: {
      avgDistinctTypes: avg(h.map((v) => new Set(v.map((x) => x.type)).size)),
      avgDistinctGenres: avg(h.map((v) => new Set(v.map((x) => x.genre).filter(Boolean)).size)),
      typeShare,
      seededShare: heroes.length ? +(heroes.filter((x) => x.seeded).length / heroes.length).toFixed(2) : 0,
    },
    feed: {
      avgDistinctTypes: avg(f.map((x) => x.types)),
      avgDistinctGenres: avg(f.map((x) => x.genres)),
      avgDistinctSeeds: avg(f.map((x) => x.seeds)),
      avgSeededItems: avg(f.map((x) => x.seeded)),
    },
  };
}
