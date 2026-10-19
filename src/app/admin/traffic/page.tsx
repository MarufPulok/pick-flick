import { BarList, Funnel } from '@/components/admin/charts-bars';
import { LineOverBars } from '@/components/admin/charts-line';
import { dur, num, pct, shortDate } from '@/components/admin/format';
import { Empty, PageHeader, RangeTabs, SectionTitle } from '@/components/admin/page-header';
import { parseRange } from '@/config/admin.config';
import { cn } from '@/lib/utils';
import { getTraffic } from '@/services/admin/traffic.service';

export default async function AdminTrafficPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const t = await getTraffic(range);
  const header = (
    <PageHeader title="Traffic" sub={t.trackingSince ? `Visits, pages, devices and player sources. Tracking since ${shortDate(t.trackingSince)}.` : 'Visits, pages, devices and player sources.'}>
      <RangeTabs range={range} path="/admin/traffic" />
    </PageHeader>
  );

  if (!t.trackingSince) {
    return (
      <>
        {header}
        <Empty>Tracking is live. Numbers appear after the first visits.</Empty>
      </>
    );
  }

  return (
    <>
      {header}
      <dl className="mt-10 grid grid-cols-3 border-b border-border pb-8">
        {[['Visitors', t.totals.visitors], ['Signed in', t.totals.signedInVisitors], ['Page views', t.totals.views]].map(([k, v], i) => (
          <div key={k} className={cn(i > 0 && 'border-l border-border pl-6')}>
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">{num(v as number)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="min-w-0 space-y-12">
          <section>
            <SectionTitle note="line: visitors, bars: page views">Visits</SectionTitle>
            <div className="pl-6">
              <LineOverBars label="Visitors per period" points={t.daily.map((d) => ({ label: d.date, line: d.signedIn + d.anonymous, bar: d.views }))} />
            </div>
          </section>
          <section>
            <SectionTitle note="opened / loaded / timed out / switched away">Player sources</SectionTitle>
            {t.providers.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-[13px]">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      {['Source', 'Opened', 'Loaded', 'Timed out', 'Switched away', 'Median load'].map((h) => (
                        <th key={h} className="pb-2 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {t.providers.map((p) => (
                      <tr key={p.id} className="border-b border-border/60">
                        <td className="py-2.5 font-sans">{p.name}</td>
                        <td>{p.attempts}</td>
                        <td>{pct(p.loadRate, 0)}</td>
                        <td className={cn((p.timeoutRate ?? 0) > 0.25 && 'text-destructive')}>{pct(p.timeoutRate, 0)}</td>
                        <td className={cn((p.switchRate ?? 0) > 0.25 && 'text-destructive')}>{pct(p.switchRate, 0)}</td>
                        <td className="text-muted-foreground">{p.medianLoadMs == null ? '-' : dur(p.medianLoadMs / 1000)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No player opened in this range.</Empty>
            )}
          </section>
          <section>
            <SectionTitle>Anonymous to signed in</SectionTitle>
            <Funnel
              steps={[
                { label: 'Visitors', value: t.anonFunnel.visitors },
                { label: 'Searched', value: t.anonFunnel.searched },
                { label: 'Opened player', value: t.anonFunnel.openedPlayer },
                { label: 'Signed in', value: t.anonFunnel.signedIn },
              ]}
            />
          </section>
        </div>

        <div className="space-y-12 lg:border-l lg:border-border lg:pl-8">
          <section>
            <SectionTitle>Top pages</SectionTitle>
            {t.routes.length ? <BarList mono rows={t.routes.slice(0, 8).map((r) => ({ label: r.path, value: r.views }))} format={(v) => num(v)} /> : <Empty>No page views.</Empty>}
          </section>
          <section>
            <SectionTitle note="share of visitors">Devices</SectionTitle>
            {t.devices.length ? <BarList rows={t.devices.map((d) => ({ label: d.device, value: d.share }))} max={1} /> : <Empty>No visitors.</Empty>}
          </section>
          <section>
            <SectionTitle note="external, first view of a visit">Referrers</SectionTitle>
            {t.referrers.length ? <BarList mono rows={t.referrers.slice(0, 8).map((r) => ({ label: r.host, value: r.share }))} max={1} /> : <Empty>Everyone arrived directly.</Empty>}
          </section>
        </div>
      </div>
    </>
  );
}
