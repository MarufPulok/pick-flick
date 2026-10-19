/** Display formatting for the admin screens. Null always renders as "-". */

export const pct = (v: number | null | undefined, digits = 1) =>
  v == null || !Number.isFinite(v) ? '-' : `${(v * 100).toFixed(digits).replace(/\.0$/, '')}%`;

export const num = (v: number | null | undefined) => (v == null ? '-' : v.toLocaleString('en-US'));

export function dur(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return '-';
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function ago(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return 'never';
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' });

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

/**
 * Change vs the prior range. `kind` decides the wording; `lowerIsBetter` flips
 * which direction counts as worse (rendered red).
 */
export function delta(
  value: number | null,
  prior: number | null,
  kind: 'share' | 'seconds' | 'count',
  lowerIsBetter = false
): { text: string; worse: boolean } | null {
  if (value == null || prior == null) return null;
  const d = value - prior;
  if (Math.abs(d) < 1e-9) return { text: 'no change', worse: false };
  const worse = lowerIsBetter ? d > 0 : d < 0;
  if (kind === 'share') return { text: `${d > 0 ? '+' : '-'}${Math.abs(d * 100).toFixed(1)} pts`, worse };
  if (kind === 'seconds') return { text: `${dur(Math.abs(d))} ${d < 0 ? 'faster' : 'slower'}`, worse };
  return { text: `${d > 0 ? '+' : '-'}${Math.abs(Math.round(d))}`, worse };
}

/** No activity for `days` or more (or never). */
export const isStale = (iso: string | null, days = 30, now = Date.now()) => !iso || now - new Date(iso).getTime() > days * 86_400_000;

/** Stored rows sometimes carry a placeholder title; hide them like Continue Watching does. */
export const hasRealTitle = (t: { title: string }) => !!t.title && !/^(unknown title|untitled)$/i.test(t.title.trim());
