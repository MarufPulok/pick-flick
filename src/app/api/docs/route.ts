/**
 * API Docs JSON Endpoint
 * Returns OpenAPI spec for Swagger UI
 */

import { getApiDocs } from '@/lib/swagger';
import { NextResponse } from 'next/server';

export async function GET() {
  const spec = getApiDocs();
  return NextResponse.json(spec);
}
