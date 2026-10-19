/**
 * Admin Configuration
 * Who can open /admin, and the clock the dashboard reads in.
 * Server-only: never import from a client component (it would ship the list to the browser).
 */

export const ADMIN_EMAILS: readonly string[] = ['marufpulok98@gmail.com'];

/** Heatmaps and "today" boundaries are drawn in this zone. */
export const ADMIN_TIMEZONE = 'Asia/Dhaka';

export const ADMIN_RANGES = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 } as const;
export type AdminRange = keyof typeof ADMIN_RANGES;

export function parseRange(v: unknown): AdminRange {
  return typeof v === 'string' && v in ADMIN_RANGES ? (v as AdminRange) : '30d';
}
