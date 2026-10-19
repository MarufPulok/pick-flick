import { cn } from '@/lib/utils';
import { Sparkline } from './charts-line';

export interface KpiItem {
  label: string;
  value: string;
  delta?: { text: string; worse: boolean } | null;
  trend?: number[];
}

/** Big numbers separated by hairlines, no boxes. Two columns on phones. */
export function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-y-8 border-b border-border pb-8 lg:grid-cols-4">
      {items.map((k, i) => (
        <div key={k.label} className={cn('min-w-0 pr-6', i % 2 === 1 && 'border-l border-border pl-6', i === 2 && 'lg:border-l lg:border-border lg:pl-6')}>
          <dt className="text-sm text-muted-foreground">{k.label}</dt>
          <dd className="mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums">{k.value}</dd>
          <dd className={cn('mt-2 h-4 font-mono text-xs', k.delta?.worse ? 'text-destructive' : 'text-muted-foreground')}>{k.delta?.text ?? ''}</dd>
          {k.trend && <dd className="mt-3"><Sparkline data={k.trend} label={`${k.label} trend`} /></dd>}
        </div>
      ))}
    </dl>
  );
}
