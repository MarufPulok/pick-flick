/**
 * NextAuth API Route Handler
 * Handles all auth routes: /api/auth/*
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
