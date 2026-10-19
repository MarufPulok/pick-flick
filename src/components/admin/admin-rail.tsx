'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/taste', label: 'Taste' },
  { href: '/admin/picks', label: 'Picks' },
  { href: '/admin/traffic', label: 'Traffic' },
  { href: '/admin/system', label: 'System' },
];

/** Left rail on md+, a scrolling top bar below that. Amber marks the current screen. */
export function AdminRail({ name }: { name: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 z-20 border-b border-border bg-[oklch(0.15_0.011_70)] md:fixed md:inset-y-0 md:left-0 md:flex md:w-[220px] md:flex-col md:border-r md:border-b-0">
      <div className="flex items-baseline gap-2 px-4 pt-4 md:block md:px-7 md:pt-8">
        <Link href="/dashboard" className="font-display text-xl font-semibold tracking-tight">
          Pick Flick
        </Link>
        <p className="font-mono text-xs text-muted-foreground md:mt-1">admin</p>
      </div>
      <nav aria-label="Admin" className="overflow-x-auto md:mt-10 md:overflow-visible">
        <ul className="flex gap-1 px-2 py-2 md:flex-col md:px-4 md:py-0">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative block whitespace-nowrap rounded-md px-3 py-2 text-[15px] transition-colors md:px-4',
                    active ? 'bg-surface text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {active && <span className="absolute top-1/2 left-0 hidden h-5 w-[3px] -translate-y-1/2 bg-primary md:block" />}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <p className="mt-auto hidden px-7 pb-8 text-sm md:block">
        {name}
        <span className="block font-mono text-[11px] text-muted-foreground/70">admin</span>
      </p>
    </aside>
  );
}
