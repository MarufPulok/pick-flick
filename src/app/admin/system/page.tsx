import { BarList } from '@/components/admin/charts-bars';
import { dur, num, pct } from '@/components/admin/format';
import { PageHeader, SectionTitle } from '@/components/admin/page-header';
import { cn } from '@/lib/utils';
import { getSystem } from '@/services/admin/system.service';

export default async function AdminSystemPage() {
  const s = await getSystem();
  const health: [string, string, boolean][] = [
    ['MongoDB', s.mongo, s.mongo !== 'connected'],
    ['TMDB', s.tmdbConfigured ? 'key set' : 'key missing', !s.tmdbConfigured],
    ['Bytez mood AI', s.bytezConfigured ? 'key set' : 'key missing, off', !s.bytezConfigured],
  ];
  const share = s.diversity.hero.typeShare;

  return (
    <>
      <PageHeader title="System" sub={`In-memory numbers reset on restart. Up ${dur(s.uptimeSec)}.`} />

      <dl className="mt-10 grid gap-6 border-b border-border pb-8 sm:grid-cols-3">
        {health.map(([k, v, bad]) => (
          <div key={k}>
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className={cn('mt-1 text-xl', bad && 'text-destructive')}>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <section className="min-w-0">
          <SectionTitle>Caches</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  {['Name', 'Entries', 'Hits', 'Misses', 'Hit rate'].map((h) => (
                    <th key={h} className="pb-2 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {s.caches.map((c) => (
                  <tr key={c.name} className="border-b border-border/60">
                    <td className="py-2.5">{c.name}</td>
                    <td className="text-muted-foreground">{num(c.size)}</td>
                    <td className="text-muted-foreground">{num(c.hits)}</td>
                    <td className="text-muted-foreground">{num(c.misses)}</td>
                    <td className="w-48">
                      <span className="flex items-center gap-3">
                        <span className="h-2.5 flex-1 rounded-[2px] bg-border/40">
                          <span className={cn('block h-full rounded-[2px]', c.hits + c.misses > 20 && c.hitRate < 0.5 ? 'bg-destructive' : 'bg-foreground/80')} style={{ width: `${c.hitRate * 100}%` }} />
                        </span>
                        <span className="w-10 text-right">{c.hits + c.misses ? pct(c.hitRate, 0) : "-"}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:border-l lg:border-border lg:pl-8">
          <SectionTitle note={`${s.diversity.users} users since restart`}>Diversity guard</SectionTitle>
          <p className="mb-4 text-xs text-muted-foreground">Hero content type share, last 10 picks per user. Target is an equal third each.</p>
          {Object.keys(share).length ? (
            <BarList rows={['MOVIE', 'SERIES', 'ANIME'].map((k) => ({ label: k[0] + k.slice(1).toLowerCase(), value: share[k] ?? 0 }))} max={0.6} />
          ) : (
            <p className="text-sm text-muted-foreground">No picks served since restart.</p>
          )}
          <dl className="mt-8 space-y-4">
            {[
              ['Distinct genres per 10 heroes', String(s.diversity.hero.avgDistinctGenres)],
              ['Heroes from seed pool', pct(s.diversity.hero.seededShare, 0)],
              ['Distinct seeds per feed', String(s.diversity.feed.avgDistinctSeeds)],
              ['Seeded items per feed', `${s.diversity.feed.avgSeededItems} / 12`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[13px] text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-mono text-xl">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
