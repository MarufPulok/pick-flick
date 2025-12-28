/**
 * Cache Stats API Route
 * GET - Get cache statistics for monitoring
 */

import { getAllCacheStats } from '@/lib/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  const { caches, totals } = getAllCacheStats();

  return NextResponse.json({
    caches,
    totals,
    timestamp: new Date().toISOString(),
  });
}

