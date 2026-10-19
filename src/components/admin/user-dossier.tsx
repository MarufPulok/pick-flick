import { Poster } from '@/components/ui/poster';
import type { UserDossier as Dossier } from '@/services/admin/types';
import { cn } from '@/lib/utils';
import { Diverging } from './charts-bars';
import { ago, hasRealTitle, pct, shortDate } from './format';
import { SectionTitle } from './page-header';
import { UserAvatar } from './user-avatar';

const TYPE_LABEL = { MOVIE: 'Movies', SERIES: 'Series', ANIME: 'Anime' } as const;

export function UserDossier({ d }: { d: Dossier }) {
  const { user, stats, profile } = d;
  const facts: [string, string][] = [
    ['Picks seen', String(stats.picksSeen)],
    ['Plays', String(stats.plays)],
    ['Pick to play', pct(stats.pickToPlay, 0)],
    ['Likes / dislikes', `${stats.likes} / ${stats.dislikes}`],
    ['Saved', String(stats.saved)],
  ];

  return (
    <article className="min-w-0">
      <header className="flex items-center gap-4">
        <UserAvatar name={user.name} image={user.image} size={56} />
        <div className="min-w-0">
          <h2 className="truncate font-display text-3xl font-semibold tracking-tight">{user.name}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {user.email} <span className="text-muted-foreground/50">|</span> joined {shortDate(user.joinedAt)} <span className="text-muted-foreground/50">|</span> active {ago(user.lastActiveAt)}
          </p>
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-y-5 border-b border-border pb-8 sm:grid-cols-5">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mt-1 font-mono text-2xl tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {profile && (
        <p className="mt-6 text-sm text-muted-foreground">
          Profile: {profile.contentTypes.map((t) => TYPE_LABEL[t]).join(', ')}
          {profile.minRating != null && <>, rating {profile.minRating}+</>}
          {!profile.complete && <span className="text-destructive">, unfinished</span>}
        </p>
      )}

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section>
          <SectionTitle>Said vs did</SectionTitle>
          {d.saidVsDid.length ? (
            <Diverging rows={d.saidVsDid.slice(0, 10).map((g) => ({ label: g.name, weight: g.weight, stated: g.stated }))} />
          ) : (
            <p className="text-sm text-muted-foreground">No genres yet.</p>
          )}
          {d.languages.length > 0 && (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {d.languages.map((l) => (
                <span key={l.code} className={cn('mr-3 inline-block', l.stated && 'text-foreground')}>
                  {l.code} {Math.round(l.weight)}
                </span>
              ))}
            </p>
          )}
        </section>

        <section>
          <SectionTitle>Recent</SectionTitle>
          {d.timeline.length ? (
            <ol className="space-y-3">
              {d.timeline.slice(0, 9).map((t, i) => (
                <li key={`${t.at}-${i}`} className="grid grid-cols-[4.5rem_1fr] gap-3">
                  <time dateTime={t.at} className="pt-0.5 font-mono text-[11px] text-muted-foreground/70">{ago(t.at).replace(' ago', '')}</time>
                  <span className="min-w-0">
                    <span className={cn('block truncate text-[13px]', t.negative ? 'text-destructive' : 'text-foreground')}>{t.text}</span>
                    {t.detail && <span className="block truncate text-[11px] text-muted-foreground/70">{t.detail}</span>}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </section>
      </div>

      <div className="mt-10 grid gap-10 border-t border-border pt-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section>
          <SectionTitle>Viewing progress</SectionTitle>
          {d.progress.some(hasRealTitle) ? (
            <ul className="space-y-3">
              {d.progress.filter(hasRealTitle).map((p) => (
                <li key={`${p.contentType}-${p.tmdbId}`} className="grid grid-cols-[minmax(0,9rem)_3.5rem_1fr_2.75rem] items-center gap-3 text-[13px]">
                  <span className="truncate">{p.title}</span>
                  <span className="font-mono text-[11px] text-muted-foreground/70">{p.season != null ? `S${p.season} E${p.episode ?? '?'}` : ''}</span>
                  <span className="h-1.5 rounded-full bg-border/60">
                    <span className="block h-full rounded-full bg-foreground" style={{ width: `${(p.pct ?? 0) * 100}%` }} />
                  </span>
                  <span className="text-right font-mono text-[11px] text-muted-foreground">{pct(p.pct, 0)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Has not played anything.</p>
          )}
        </section>
        <section>
          <SectionTitle>Watchlist</SectionTitle>
          {d.watchlist.length ? (
            <ul className="grid grid-cols-4 gap-3">
              {d.watchlist.slice(0, 8).map((w) => (
                <li key={`${w.contentType}-${w.tmdbId}`} className="min-w-0">
                  <Poster src={w.posterPath} alt="" sizes="80px" />
                  <p className="mt-1.5 truncate text-[11px]">{w.title}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing saved.</p>
          )}
        </section>
      </div>
    </article>
  );
}
