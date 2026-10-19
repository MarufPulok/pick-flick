import { ADMIN_RANGES, type AdminRange } from '@/config/admin.config';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

export function RangeTabs({ range, path }: { range: AdminRange; path: string }) {
  return (
    <nav aria-label="Time range" className="flex gap-1">
      {(Object.keys(ADMIN_RANGES) as AdminRange[]).map((r) => (
        <Link
          key={r}
          href={`${path}?range=${r}`}
          aria-current={r === range ? 'true' : undefined}
          className={cn(
            'rounded-md border px-3.5 py-1.5 font-mono text-[13px] transition-colors',
            r === range ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          {r}
        </Link>
      ))}
    </nav>
  );
}

export function SectionTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="font-display text-lg font-semibold">{children}</h2>
      {note && <span className="font-mono text-xs text-muted-foreground/70">{note}</span>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-sm text-muted-foreground">{children}</p>;
}
