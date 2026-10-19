/** Bar-family charts: funnel, labelled bars, stacked share bar, dumbbell, diverging. Server-renderable. */

import { cn } from '@/lib/utils';
import { num, pct } from './format';

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, steps[0]?.value ?? 0);
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const conv = i > 0 && steps[i - 1].value ? s.value / steps[i - 1].value : null;
        return (
          <li key={s.label} className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="flex items-center gap-2">
              <span className="h-5 rounded-[3px] bg-foreground" style={{ width: `${Math.max(0.6, (s.value / max) * 85)}%`, opacity: 1 - i * 0.14 }} />
              <span className="font-mono text-[13px] tabular-nums">{num(s.value)}</span>
            </span>
            <span className="text-right font-mono text-[13px] text-muted-foreground tabular-nums">{conv == null ? '' : pct(conv)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Label, bar, value. `value` is 0..1 unless `format` says otherwise. */
export function BarList({
  rows,
  format = (v) => pct(v, 0),
  max,
  mono,
}: {
  rows: { label: string; value: number; tone?: 'bad' }[];
  format?: (v: number) => string;
  max?: number;
  mono?: boolean;
}) {
  const top = max ?? Math.max(1e-9, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(6rem,9rem)_1fr_3.5rem] items-center gap-3 text-[13px]">
          <span className={cn('truncate text-muted-foreground', mono && 'font-mono')}>{r.label}</span>
          <span className="h-3 rounded-[2px] bg-border/40">
            <span className={cn('block h-full rounded-[2px]', r.tone === 'bad' ? 'bg-destructive' : 'bg-foreground/85')} style={{ width: `${(r.value / top) * 100}%` }} />
          </span>
          <span className="text-right font-mono tabular-nums">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

const SHADES = ['bg-foreground', 'bg-foreground/60', 'bg-foreground/30'];

export function StackedShare({ rows, keys }: { rows: { label: string; parts: Record<string, number> }[]; keys: { key: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const total = keys.reduce((s, k) => s + (r.parts[k.key] ?? 0), 0) || 1;
        return (
          <div key={r.label} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
            <span className="text-[13px] text-muted-foreground">{r.label}</span>
            <div className="flex h-6 gap-0.5 overflow-hidden rounded-[3px]" role="img" aria-label={`${r.label}: ${keys.map((k) => `${k.label} ${pct((r.parts[k.key] ?? 0) / total, 0)}`).join(', ')}`}>
              {keys.map((k, i) => {
                const share = (r.parts[k.key] ?? 0) / total;
                return share > 0 ? (
                  <span key={k.key} className={cn('flex items-center px-1.5 font-mono text-[11px]', SHADES[i], i < 2 ? 'text-background' : 'text-foreground')} style={{ width: `${share * 100}%` }}>
                    {share >= 0.12 ? pct(share, 0) : ''}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        );
      })}
      <div className="flex gap-5 pl-[7.25rem] text-xs text-muted-foreground">
        {keys.map((k, i) => (
          <span key={k.key} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-[2px]', SHADES[i])} />
            {k.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Two shares per row: hollow = said, filled = did. */
export function Dumbbell({ rows }: { rows: { label: string; said: number; did: number }[] }) {
  const max = Math.max(0.25, ...rows.flatMap((r) => [r.said, r.did]));
  const x = (v: number) => `${(v / max) * 100}%`;
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[7rem_1fr_6.5rem] items-center gap-3 text-[13px]" aria-label={`${r.label}: ${pct(r.said, 0)} of profiles, ${pct(r.did, 0)} of plays`}>
          <span className="truncate text-muted-foreground">{r.label}</span>
          <span className="relative h-6">
            <span className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-muted-foreground/50" style={{ left: x(Math.min(r.said, r.did)), width: `${(Math.abs(r.said - r.did) / max) * 100}%` }} />
            <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-foreground bg-background" style={{ left: x(r.said) }} />
            <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" style={{ left: x(r.did) }} />
          </span>
          <span className="text-right font-mono text-xs text-muted-foreground tabular-nums">
            {pct(r.said, 0)} / {pct(r.did, 0)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Weights around a neutral 50: right in bone, left in red. */
export function Diverging({ rows }: { rows: { label: string; weight: number; stated: boolean }[] }) {
  return (
    <div>
      <div className="mb-1 grid grid-cols-[7rem_1fr_3.5rem] gap-3 font-mono text-[11px] text-muted-foreground/70">
        <span />
        <span className="text-center">50 = neutral</span>
        <span className="text-right">profile</span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => {
          const d = Math.max(-50, Math.min(50, r.weight - 50));
          return (
            <li key={r.label} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3 text-[13px]">
              <span className="truncate text-muted-foreground">{r.label}</span>
              <span className="relative h-4">
                <span className="absolute inset-y-[-3px] left-1/2 border-l border-dashed border-muted-foreground/50" />
                <span
                  className={cn('absolute inset-y-0 rounded-[2px]', d >= 0 ? 'left-1/2 bg-foreground/90' : 'right-1/2 bg-destructive/85')}
                  style={{ width: `${(Math.abs(d) / 50) * 50}%` }}
                />
                <span className="absolute top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground" style={d >= 0 ? { left: `calc(${50 + Math.abs(d)}% + 6px)` } : { right: `calc(${50 + Math.abs(d)}% + 6px)` }}>
                  {Math.round(r.weight)}
                </span>
              </span>
              <span className={cn('text-right font-mono text-[11px]', r.stated ? 'text-foreground' : 'text-muted-foreground/60')}>{r.stated ? 'yes' : '-'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
