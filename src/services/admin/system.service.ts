/**
 * Admin System: process health and in-memory cache/diversity stats. No network calls.
 */

import { serverEnv } from '@/config/env.config';
import { connectToDatabase } from '@/infrastructure/db';
import { getAllCacheStats, servedCache } from '@/lib/cache';
import { diversityAggregate } from '@/lib/diversity-stats';
import mongoose from 'mongoose';
import { safe } from './shared';
import type { SystemData } from './types';

export async function getSystem(): Promise<SystemData> {
  await safe('system mongo', connectToDatabase, null);
  const state = mongoose.connection.readyState;

  return {
    uptimeSec: Math.round(process.uptime()),
    mongo: state === 1 ? 'connected' : state === 2 ? 'connecting' : 'disconnected',
    tmdbConfigured: !!(serverEnv.TMDB_API_KEY || serverEnv.TMDB_ACCESS_TOKEN),
    bytezConfigured: !!serverEnv.BYTEZ_API_KEY,
    // TTLCache reports hitRate as 0..100; the contract wants 0..1.
    caches: [...getAllCacheStats().caches, servedCache.getStats()].map((c) => ({
      name: c.name,
      size: c.size,
      hits: c.hits,
      misses: c.misses,
      hitRate: c.hits + c.misses > 0 ? c.hits / (c.hits + c.misses) : 0,
    })),
    diversity: diversityAggregate(),
  };
}
