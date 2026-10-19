import { AutoRefresh } from '@/components/admin/auto-refresh';
import { Funnel } from '@/components/admin/charts-bars';
import { Heatmap, LineOverBars } from '@/components/admin/charts-line';
import { delta, dur, pct } from '@/components/admin/format';
import { KpiRow } from '@/components/admin/kpi-row';
import { LiveFeed } from '@/components/admin/live-feed';
import { PageHeader, RangeTabs, SectionTitle } from '@/components/admin/page-header';
import { parseRange } from '@/config/admin.config';
import { getOverview } from '@/services/admin/overview.service';

const RANGE_TEXT = { '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days' } as const;

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const o = await getOverview(range);

  return (
    <>
      <AutoRefresh />
      <PageHeader title="Overview" sub={`${RANGE_TEXT[range]}, signed-in users. Refreshes every minute.`}>
        <RangeTabs range={range} path="/admin" />
      </PageHeader>

      <div className="mt-10">
        <KpiRow
          items={[
            { label: 'Pick to play', value: pct(o.pickToPlay.value), delta: delta(o.pickToPlay.value, o.pickToPlay.prior, 'share'), trend: o.pickToPlay.trend },
            { label: 'Median time to play', value: dur(o.medianTimeToPlaySec.value), delta: delta(o.medianTimeToPlaySec.value, o.medianTimeToPlaySec.prior, 'seconds', true), trend: o.medianTimeToPlaySec.trend },
            { label: 'Active on 2+ days', value: pct(o.returningShare.value, 0), delta: delta(o.returningShare.value, o.returningShare.prior, 'share'), trend: o.returningShare.trend },
            { label: 'Active users (7d)', value: `${o.activeUsers7d} / ${o.totalUsers}`, trend: o.daily.map((d) => d.activeUsers) },
          ]}
        />
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="min-w-0 space-y-12">
          <section>
            <SectionTitle note="line: active users, bars: picks served">{range === '24h' ? 'Hourly active users' : 'Daily active users'}</SectionTitle>
            <div className="pl-6">
              <LineOverBars
                label={`Active users per ${range === '24h' ? 'hour' : 'day'}, peak ${Math.max(0, ...o.daily.map((d) => d.activeUsers))}`}
                points={o.daily.map((d) => ({ label: d.date, line: d.activeUsers, bar: d.picksServed }))}
              />
            </div>
          </section>

          <section>
            <SectionTitle note="step conversion">Where picks go</SectionTitle>
            <Funnel
              steps={[
                { label: 'Shown', value: o.funnel.shown },
                { label: 'Acted on', value: o.funnel.actedOn },
                { label: 'Played', value: o.funnel.played },
                { label: 'Qualified play', value: o.funnel.qualified },
                { label: 'Liked or loved', value: o.funnel.liked },
              ]}
            />
            <p className="mt-3 text-xs text-muted-foreground/70">Qualified play: past 10 minutes or 20% of runtime. Plays include ones started from search and trending.</p>
          </section>

          <section>
            <SectionTitle note="picks shown by hour, Dhaka time">When people pick</SectionTitle>
            <Heatmap grid={o.heatmap} />
          </section>
        </div>

        <section className="lg:border-l lg:border-border lg:pl-8">
          <SectionTitle note="newest first">Live</SectionTitle>
          <LiveFeed events={o.live} />
        </section>
      </div>
    </>
  );
}
