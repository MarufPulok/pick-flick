/**
 * Health Check API Route
 * Tests database and external API connectivity
 */

import { connectToDatabase, isConnected } from '@/infrastructure/db';
import { tmdbClient } from '@/infrastructure/external';
import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: { connected: false, error: null as string | null },
      tmdb: { connected: false, error: null as string | null },
    },
  };

  // Test MongoDB
  try {
    await connectToDatabase();
    status.services.mongodb.connected = isConnected();
  } catch (error) {
    status.services.mongodb.error = error instanceof Error ? error.message : 'Unknown error';
    status.status = 'degraded';
  }

  // Test TMDB API
  try {
    const genres = await tmdbClient.getMovieGenres();
    status.services.tmdb.connected = genres.length > 0;
  } catch (error) {
    status.services.tmdb.error = error instanceof Error ? error.message : 'Unknown error';
    status.status = 'degraded';
  }

  const httpStatus = status.status === 'ok' ? 200 : 503;
  return NextResponse.json(status, { status: httpStatus });
}
