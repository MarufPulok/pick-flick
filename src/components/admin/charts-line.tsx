/** Inline SVG charts: sparkline, line over bars, weekday x hour heatmap. Server-renderable. */

import { cn } from '@/lib/utils';

const path = (data: number[], w: number, h: number, max: number) =>
  data
    .map((v, i) => `${i ? 'L' : 'M'}${data.length === 1 ? w / 2 : (i / (data.length - 1)) * w},${h - (max ? (v / max) * h : 0)}`)
    .join(' ');

export function Sparkline({ data, label, className }: { data: number[]; label: string; className?: string }) {
  if (data.length < 2) return <div className={cn('h-7', className)} />;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = data.map((v) => v - min);
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" role="img" aria-label={label} className={cn('h-7 w-full text-muted-foreground', className)}>
      <path d={path(norm, 100, 26, max - min || 1)} transform="translate(0 1)" fill="none" stroke="currentColor" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Line (active users) over faint bars (picks served), each on its own scale. */
export function LineOverBars({
  points,
  label,
}: {
  points: { label: string; line: number; bar: number }[];
  label: string;
}) {
  const lineMax = Math.max(1, ...points.map((p) => p.line));
  const barMax = Math.max(1, ...points.map((p) => p.bar));
  const n = points.length;
  const ticks = n > 1 ? [0, Math.floor((n - 1) / 2), n - 1] : [0];
  return (
    <figure className="m-0">
      <div className="relative">
        <div className="absolute inset-y-0 -left-1 flex -translate-x-full flex-col justify-between font-mono text-[11px] text-muted-foreground/70">
          <span>{lineMax}</span>
          <span>0</span>
        </div>
        <svg viewBox={`0 0 ${n * 10} 160`} preserveAspectRatio="none" role="img" aria-label={label} className="h-44 w-full">
          {[0, 80, 160].map((y) => (
            <line key={y} x1={0} x2={n * 10} y1={y} y2={y} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
          ))}
          {points.map((p, i) => {
            const h = (p.bar / barMax) * 150;
            return <rect key={i} x={i * 10 + 1.5} y={160 - h} width={7} height={h} fill="var(--surface)" />;
          })}
          <path
            d={points.map((p, i) => `${i ? 'L' : 'M'}${i * 10 + 5},${160 - (p.line / lineMax) * 150}`).join(' ')}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <figcaption className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground/70">
        {ticks.map((i) => (
          <span key={i}>{points[i]?.label}</span>
        ))}
      </figcaption>
    </figure>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const busiest = grid.flatMap((row, d) => row.map((v, h) => ({ v, d, h }))).sort((a, b) => b.v - a.v)[0];
  return (
    <div
      role="img"
      aria-label={busiest?.v ? `Busiest slot: ${DAYS[busiest.d]} ${busiest.h}:00 with ${busiest.v} picks shown` : 'No picks shown in this range'}
      className="overflow-x-auto"
    >
      <div className="grid min-w-[560px] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[3px]">
        {grid.map((row, d) => [
          <span key={`l${d}`} className="font-mono text-[11px] leading-4 text-muted-foreground/70">
            {DAYS[d]}
          </span>,
          ...row.map((v, h) => (
            <span
              key={`${d}-${h}`}
              title={`${DAYS[d]} ${h}:00, ${v}`}
              className="h-4 rounded-[2px] bg-foreground"
              style={{ opacity: 0.06 + (v / max) * 0.88 }}
            />
          )),
        ])}
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="font-mono text-[10px] text-muted-foreground/70">
            {h % 6 === 0 ? `${h}h` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
