import type { UserFilter, UserRow } from '@/services/admin/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Sparkline } from './charts-line';
import { ago, isStale } from './format';
import { UserAvatar } from './user-avatar';

const FILTERS: { key: UserFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active 7d' },
  { key: 'dormant', label: 'Dormant 30d+' },
  { key: 'unfinished', label: 'Unfinished' },
];

const href = (p: { f: UserFilter; q?: string; u?: string }) => {
  const s = new URLSearchParams();
  if (p.f !== 'all') s.set('f', p.f);
  if (p.q) s.set('q', p.q);
  if (p.u) s.set('u', p.u);
  const qs = s.toString();
  return `/admin/users${qs ? `?${qs}` : ''}`;
};

export function UserList({ users, counts, filter, q, selectedId }: { users: UserRow[]; counts: Record<UserFilter, number>; filter: UserFilter; q?: string; selectedId?: string }) {
  return (
    <div>
      <form action="/admin/users" className="px-1">
        {filter !== 'all' && <input type="hidden" name="f" value={filter} />}
        <label htmlFor="user-search" className="sr-only">Search users</label>
        <input
          id="user-search"
          name="q"
          defaultValue={q}
          placeholder="Search name or email"
          className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none"
        />
      </form>
      <nav aria-label="Filter users" className="mt-3 flex flex-wrap gap-1.5 px-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href({ f: f.key, q })}
            aria-current={f.key === filter ? 'true' : undefined}
            className={cn('rounded-full border px-3 py-1 text-xs transition-colors', f.key === filter ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
          >
            {f.label} <span className="font-mono">{counts[f.key]}</span>
          </Link>
        ))}
      </nav>

      {users.length === 0 ? (
        <p className="px-1 py-8 text-sm text-muted-foreground">No users match.</p>
      ) : (
        <ul className="mt-4">
          {users.map((u) => {
            const selected = u.id === selectedId;
            const stale = isStale(u.lastActiveAt);
            return (
              <li key={u.id}>
                <Link
                  href={href({ f: filter, q, u: u.id })}
                  aria-current={selected ? 'true' : undefined}
                  className={cn('relative flex items-center gap-3 rounded-md px-3 py-3 transition-colors', selected ? 'bg-surface' : 'hover:bg-surface/60')}
                >
                  {selected && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary" />}
                  <UserAvatar name={u.name} image={u.image} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm', stale && 'text-muted-foreground')}>{u.name}</span>
                    <span className={cn('block truncate text-xs', u.profileComplete ? 'text-muted-foreground' : 'text-destructive')}>
                      {u.profileComplete ? `active ${ago(u.lastActiveAt)}` : 'onboarding unfinished'}
                    </span>
                  </span>
                  <Sparkline data={u.activity14d} label={`${u.name}, picks seen per day over 14 days`} className={cn('w-20', stale && 'opacity-50')} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
