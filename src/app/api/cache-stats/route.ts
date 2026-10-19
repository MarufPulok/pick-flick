/**
 * Cache Stats API Route
 * GET - Get cache statistics for monitoring
 */

import { getAllCacheStats } from '@/lib/cache';
import { diversityAggregate } from '@/lib/diversity-stats';
import { getAdminSession } from '@/lib/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { caches, totals } = getAllCacheStats();

  return NextResponse.json({
    caches,
    totals,
    diversity: diversityAggregate(),
    timestamp: new Date().toISOString(),
  });
}

