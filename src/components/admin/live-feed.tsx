import type { LiveEvent } from '@/services/admin/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ago } from './format';
import { UserAvatar } from './user-avatar';

export function LiveFeed({ events }: { events: LiveEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted-foreground">Nothing yet. Actions show up here as they happen.</p>;
  return (
    <ol className="space-y-4">
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className="flex gap-3">
          <UserAvatar name={e.name} image={e.image} size={28} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <Link href={`/admin/users?u=${e.userId}`} className="truncate text-sm hover:text-primary">
                {e.name}
              </Link>
              <time dateTime={e.at} className="shrink-0 font-mono text-xs text-muted-foreground/70">
                {ago(e.at).replace(' ago', '')}
              </time>
            </div>
            <p className={cn('truncate text-[13px]', e.negative ? 'text-destructive' : 'text-muted-foreground')}>{e.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
