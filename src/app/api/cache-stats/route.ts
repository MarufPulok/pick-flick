/**
 * Cache Stats API Route
 * GET - Get cache statistics for monitoring
 */

import { getAllCacheStats } from '@/lib/cache';
import { diversityAggregate } from '@/lib/diversity-stats';
import { NextResponse } from 'next/server';

export async function GET() {
  const { caches, totals } = getAllCacheStats();

  return NextResponse.json({
    caches,
    totals,
    diversity: diversityAggregate(),
    timestamp: new Date().toISOString(),
  });
}

