/**
 * Cache Stats API Route
 * GET - Get cache statistics for monitoring
 */

import {
    discoverCache,
    providersCache,
    videosCache,
} from '@/lib/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  const stats = {
    discover: discoverCache.getStats(),
    videos: videosCache.getStats(),
    providers: providersCache.getStats(),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(stats);
}
