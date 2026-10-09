'use client';

import { useTrending } from '@/hooks/use-trending';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

const cta = 'inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90 active:translate-y-px';

export default function LandingPage() {
  const { status } = useSession();
  const start = status === 'authenticated' ? '/dashboard' : '/login';
  const { data } = useTrending({ type: 'ALL', timeWindow: 'week', limit: 12 });
  const items = data?.items ?? [];
  const lead = items[0];
  const second = items[1];
  const year = lead?.releaseDate ? new Date(lead.releaseDate).getFullYear() : null;

  return (
    <main className="bg-background">
      {/* The pick, lit. The landing opens on the product doing its job with a real title. */}
      <section className="relative isolate min-h-dvh overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {lead?.backdropUrl && (
            <Image src={lead.backdropUrl} alt="" fill priority unoptimized sizes="100vw" className="object-cover object-[70%_center]" />
          )}
          <div className="scrim absolute inset-0" />
        </div>

        <div className="mx-auto grid max-w-330 gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16 lg:px-15 lg:pt-40">
          <div className="max-w-160">
            <h1 className="font-display text-balance text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.02em]">
              Stop scrolling. Press play.
            </h1>
            <p className="mt-6 max-w-130 text-pretty text-lg leading-relaxed text-foreground/85 sm:text-xl">
              One pick for tonight, chosen from your taste and your mood, then watched right here.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={start} className={cn(cta, 'w-full sm:w-auto')}>Get tonight&apos;s pick</Link>
              <Link href="/search" className="inline-flex h-12 w-full items-center justify-center rounded-md border border-border px-6 text-[15px] font-medium hover:bg-foreground/6 sm:w-auto">
                Search instead
              </Link>
            </div>

            {lead && (
              <p className="tabular mt-16 font-mono text-sm text-muted-foreground">
                On screen now: {lead.title}
                {year ? ` · ${year}` : ''} · {lead.rating.toFixed(1)} · trending this week
              </p>
            )}
          </div>

          <div className="order-first mx-auto w-[min(60vw,260px)] lg:order-0 lg:mx-0 lg:w-90">
            {lead?.posterUrl ? (
              <Image src={lead.posterUrl} alt={`${lead.title} poster`} width={360} height={540} unoptimized className="aspect-2/3 w-full rounded-md object-cover shadow-poster" />
            ) : (
              <div className="aspect-2/3 w-full rounded-md border border-border bg-surface/60" />
            )}
          </div>
        </div>
      </section>

      {/* How it picks: three sentences and the real catalog they draw from. */}
      <section className="mx-auto grid max-w-330 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-15 lg:py-32">
        <div className="max-w-130">
          <h2 className="font-display text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            It picks the way a friend would.
          </h2>
          <ol className="mt-10 space-y-8 border-t border-border">
            {[
              ['It knows what you like.', 'A short taste profile: movies, series or anime, the genres you reach for, the languages you actually watch.'],
              ['It asks how tonight feels.', 'Something light, a slow burn, edge of your seat. Or say nothing and let the hour decide.'],
              ['It learns from every answer.', 'A thumbs up or down quietly reweights the next pick. No ratings homework, no watchlist to maintain.'],
            ].map(([h, p]) => (
              <li key={h} className="border-b border-border pb-8">
                <h3 className="text-xl font-semibold">{h}</h3>
                <p className="mt-2 text-pretty text-muted-foreground">{p}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="self-center">
          {second ? (
            <div className="flex gap-6 sm:gap-8">
              {second.posterUrl ? (
                <Image src={second.posterUrl} alt={`${second.title} poster`} width={200} height={300} unoptimized className="aspect-2/3 w-40 shrink-0 rounded-md object-cover shadow-poster sm:w-50" />
              ) : (
                <div className="aspect-2/3 w-40 shrink-0 rounded-md bg-surface sm:w-50" />
              )}
              <div className="min-w-0">
                <p className="font-display text-balance text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">{second.title}</p>
                <p className="tabular mt-2 font-mono text-sm text-muted-foreground">
                  {second.releaseDate ? new Date(second.releaseDate).getFullYear() : ''}{second.rating > 0 ? ` · ${second.rating.toFixed(1)}` : ''}
                </p>
                <p className="mt-3 text-pretty text-muted-foreground">
                  Trending this week. An example of the one title you get; yours comes from your own taste.
                </p>
                <Link href={`/dashboard?watch=${second.tmdbId}&type=${second.contentType}&title=${encodeURIComponent(second.title)}`} className={cn(cta, 'mt-5 w-32')}>
                  Play
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-6 sm:gap-8" aria-busy="true">
              <div className="aspect-2/3 w-40 shrink-0 rounded-md bg-foreground/10 sm:w-50" />
              <div className="flex-1 space-y-3 pt-2"><div className="h-7 w-3/4 rounded-sm bg-foreground/10" /><div className="h-4 w-24 rounded-sm bg-foreground/10" /><div className="h-4 w-full rounded-sm bg-foreground/10" /></div>
            </div>
          )}
        </div>
      </section>

      {/* Then press play. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-330 px-4 py-24 sm:px-6 lg:px-15 lg:py-32">
          <h2 className="font-display max-w-180 text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Then press play. Right here, no tab-hopping.
          </h2>
          <p className="mt-6 max-w-140 text-pretty text-lg text-muted-foreground">
            Every pick opens in the app with a choice of sources, and it remembers where you stopped. Nothing to install, nothing to pay.
          </p>
          <Link href={start} className={cn(cta, 'mt-10')}>Get tonight&apos;s pick</Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-330 flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-15">
          <span className="font-display text-base font-bold text-foreground">Pick Flick</span>
          <p>Titles, artwork and ratings from TMDB. Pick Flick is not endorsed or certified by TMDB.</p>
        </div>
      </footer>
    </main>
  );
}
