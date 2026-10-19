/**
 * Admin access check. The only gate for /admin pages and admin-only API routes.
 */

import { ADMIN_EMAILS } from '@/config/admin.config';
import { auth } from '@/lib/auth';

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/** The session when the signed-in user is an admin, otherwise null. */
export async function getAdminSession() {
  const session = await auth();
  return isAdminEmail(session?.user?.email) ? session : null;
}
