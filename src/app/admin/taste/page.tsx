import { BarList, Dumbbell, StackedShare } from '@/components/admin/charts-bars';
import { Empty, PageHeader, RangeTabs, SectionTitle } from '@/components/admin/page-header';
import { parseRange } from '@/config/admin.config';
import { getTaste } from '@/services/admin/taste.service';

const TYPES = [
  { key: 'MOVIE', label: 'Movie' },
  { key: 'SERIES', label: 'Series' },
  { key: 'ANIME', label: 'Anime' },
];

export default async function AdminTastePage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const t = await getTaste(range);
  const ratingMax = Math.max(1, ...t.minRating.map((r) => r.count));

  return (
    <>
      <PageHeader title="Taste" sub="What people say in onboarding, against what they actually play.">
        <RangeTabs range={range} path="/admin/taste" />
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="min-w-0 space-y-12">
          <section>
            <SectionTitle note={`hollow: share of profiles, filled: share of ${t.playsCounted} plays`}>Genres, said vs played</SectionTitle>
            {t.genres.length ? <Dumbbell rows={t.genres.slice(0, 14).map((g) => ({ label: g.name, said: g.profileShare, did: g.playShare }))} /> : <Empty>No finished profiles yet.</Empty>}
            {t.playsCounted === 0 && t.genres.length > 0 && <p className="mt-3 text-xs text-muted-foreground/70">No plays in this range could be traced to a shown pick, so the filled dots sit at zero.</p>}
          </section>

          <section className="border-t border-border pt-10">
            <SectionTitle note="weights of 60 or more">Learned mood chips</SectionTitle>
            {t.learnedChips.length ? (
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {t.learnedChips.map((c) => (
                  <li key={c.label} className="flex items-center justify-between rounded-full border border-border px-4 py-2.5 text-sm">
                    {c.label}
                    <span className="font-mono text-xs text-muted-foreground">{c.users} {c.users === 1 ? 'user' : 'users'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No one has earned a learned chip yet.</Empty>
            )}
          </section>

          <section>
            <SectionTitle note="taps in range">Mood chips tapped</SectionTitle>
            {t.chipTaps.length ? (
              <BarList rows={t.chipTaps.map((c) => ({ label: c.label, value: c.taps }))} format={(v) => String(v)} />
            ) : (
              <Empty>No chip taps recorded in this range.</Empty>
            )}
          </section>
        </div>

        <div className="space-y-12 lg:border-l lg:border-border lg:pl-8">
          <section>
            <SectionTitle>Content type</SectionTitle>
            <StackedShare
              keys={TYPES}
              rows={[
                { label: 'Profiles say', parts: t.contentMix.profiles },
                { label: 'Served', parts: t.contentMix.served },
                { label: 'Played', parts: t.contentMix.played },
              ]}
            />
          </section>
          <section>
            <SectionTitle note="share of profiles">Languages</SectionTitle>
            {t.languages.length ? <BarList rows={t.languages.slice(0, 8).map((l) => ({ label: l.name, value: l.share }))} max={1} /> : <Empty>No profiles yet.</Empty>}
          </section>
          <section>
            <SectionTitle>Minimum rating set</SectionTitle>
            {t.minRating.length ? (
              <div role="img" aria-label={t.minRating.map((r) => `${r.value}: ${r.count}`).join(', ')}>
                <div className="flex h-24 items-end gap-1.5">
                  {t.minRating.map((r) => (
                    <span key={r.value} className="flex-1 rounded-t-[2px] bg-foreground/70" style={{ height: `${(r.count / ratingMax) * 100}%` }} />
                  ))}
                </div>
                <div className="mt-1.5 flex gap-1.5 font-mono text-[10px] text-muted-foreground/70">
                  {t.minRating.map((r) => (
                    <span key={r.value} className="flex-1 text-center">{r.value.toFixed(1)}</span>
                  ))}
                </div>
              </div>
            ) : (
              <Empty>No profile sets a minimum rating.</Empty>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
