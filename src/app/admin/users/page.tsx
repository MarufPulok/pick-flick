import { PageHeader } from '@/components/admin/page-header';
import { UserDossier } from '@/components/admin/user-dossier';
import { UserList } from '@/components/admin/user-list';
import { cn } from '@/lib/utils';
import { getUserDossier, listUsers } from '@/services/admin/users.service';
import type { UserFilter } from '@/services/admin/types';
import Link from 'next/link';

const FILTERS: UserFilter[] = ['all', 'active', 'dormant', 'unfinished'];

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ f?: string; q?: string; u?: string }> }) {
  const sp = await searchParams;
  const filter = FILTERS.includes(sp.f as UserFilter) ? (sp.f as UserFilter) : 'all';
  const q = sp.q?.trim().slice(0, 80) || undefined;

  const data = await listUsers({ filter, q });
  const selectedId = sp.u ?? data.users[0]?.id;
  const dossier = selectedId ? await getUserDossier(selectedId) : null;
  const f = data.funnel;
  const steps: [string, number][] = [
    ['Signed up', f.signedUp],
    ['Started profile', f.startedProfile],
    ['Finished profile', f.finishedProfile],
    ['Saw a pick', f.sawPick],
    ['Pressed play', f.pressedPlay],
    ['Came back another day', f.cameBack],
  ];

  return (
    <>
      <PageHeader title="Users" sub={`${f.signedUp} signed up, ${f.finishedProfile} finished onboarding.`} />

      <ol className="mt-8 grid grid-cols-2 gap-y-6 border-b border-border pb-8 sm:grid-cols-3 xl:grid-cols-6">
        {steps.map(([label, v], i) => (
          <li key={label} className="pr-4">
            <span className="font-mono text-3xl tabular-nums">{v}</span>
            {i > 0 && steps[i - 1][1] > 0 && (
              <span className="ml-2 font-mono text-xs text-muted-foreground/70">{Math.round((v / steps[i - 1][1]) * 100)}%</span>
            )}
            <span className="mt-1 block text-[13px] text-muted-foreground">{label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className={cn(sp.u && 'max-lg:hidden')}>
          <UserList users={data.users} counts={data.counts} filter={filter} q={q} selectedId={selectedId} />
        </div>
        <div className={cn('lg:border-l lg:border-border lg:pl-10', !sp.u && 'max-lg:hidden')}>
          <Link href="/admin/users" className="mb-6 inline-block text-sm text-primary lg:hidden">
            All users
          </Link>
          {dossier ? <UserDossier d={dossier} /> : <p className="text-sm text-muted-foreground">{selectedId ? 'User not found.' : 'No users yet.'}</p>}
        </div>
      </div>
    </>
  );
}
