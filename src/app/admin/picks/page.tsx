import { hasRealTitle, pct } from '@/components/admin/format';
import { Empty, PageHeader, RangeTabs, SectionTitle } from '@/components/admin/page-header';
import { Poster } from '@/components/ui/poster';
import { parseRange } from '@/config/admin.config';
import { cn } from '@/lib/utils';
import { getPicks } from '@/services/admin/picks.service';
import type { TitleStat } from '@/services/admin/types';

function Pair({ title, unit, a, b, note }: { title: string; unit: string; a: [string, string]; b: [string, string]; note?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="mt-2 flex gap-10">
        {[a, b].map(([label, value], i) => (
          <div key={label}>
            <p className={cn('font-mono text-3xl tabular-nums', i && 'text-muted-foreground')}>{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">{note ?? unit}</p>
    </div>
  );
}

function Shelf({ title, items: all, meta, bad }: { title: string; items: TitleStat[]; meta: (t: TitleStat) => string; bad?: boolean }) {
  const items = all.filter(hasRealTitle);
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      {items.length ? (
        <ul className="rail flex gap-4 overflow-x-auto pb-2">
          {items.map((t) => (
            <li key={`${t.contentType}-${t.tmdbId}`} className="w-[110px] shrink-0">
              <Poster src={t.posterPath} alt="" sizes="110px" />
              <p className="mt-2 truncate text-[13px]">{t.title}</p>
              <p className={cn('font-mono text-[11px]', bad ? 'text-destructive' : 'text-muted-foreground')}>{meta(t)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Nothing in this range.</Empty>
      )}
    </section>
  );
}

export default async function AdminPicksPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const p = await getPicks(range);
  const sd = p.seededVsDiscover;

  return (
    <>
      <PageHeader title="Picks" sub="How the engine's choices land.">
        <RangeTabs range={range} path="/admin/picks" />
      </PageHeader>

      <div className="mt-10 grid gap-8 border-b border-border pb-8 md:grid-cols-3 md:gap-0 md:[&>*+*]:border-l md:[&>*+*]:border-border md:[&>*+*]:pl-8">
        <Pair title="Hero vs feed" unit="pick to play" a={['Hero', pct(p.heroVsFeed.hero, 0)]} b={['Feed', pct(p.heroVsFeed.feed, 0)]} />
        <Pair
          title="Seed pool vs discover"
          unit="pick to play"
          a={['Seeds', pct(sd.seeded, 0)]}
          b={['Discover', pct(sd.discover, 0)]}
          note={sd.seededShown === 0 ? 'Collecting: seeded picks are tagged from now on' : `pick to play, ${sd.seededShown} seeded shown`}
        />
        <Pair title="Smart vs Refine" unit="share of actions" a={['Smart', pct(p.smartVsRefine.smart, 0)]} b={['Refine', pct(p.smartVsRefine.refine, 0)]} />
      </div>

      <div className="mt-10 space-y-10">
        <Shelf title="Most played" items={p.mostPlayed} meta={(t) => `${t.count} ${t.count === 1 ? 'player' : 'players'}`} />
        <Shelf title="Most loved" items={p.mostLoved} meta={(t) => `${t.count} loved`} />
        <Shelf title="Misses: shown often, never played" items={p.misses} meta={(t) => `${t.shown ?? t.count} shown`} bad />
      </div>
    </>
  );
}
