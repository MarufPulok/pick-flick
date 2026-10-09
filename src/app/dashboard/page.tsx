'use client';

import {
  ContinueWatchingSection,
  CurrentlyWatchingBanner,
  PickScreen,
  type Recommendation,
  SimilarContentSection,
  StreamPlayer,
  TrendingSection,
} from '@/components/dashboard';
import { ContentType } from '@/dtos/common.dto';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

interface WatchFromUrl {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  season?: number;
  episode?: number;
  startAt?: number;
}

function num(v: string | null): number | undefined {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Reads ?watch=&type=[&s=&e=&t=] and opens the player; kept separate for the Suspense boundary. */
function UrlStreamHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('watch');
  const type = searchParams.get('type') as ContentType | null;
  const watch: WatchFromUrl | null =
    id && type
      ? {
          tmdbId: parseInt(id, 10),
          contentType: type,
          title: searchParams.get('title') || 'Untitled',
          posterPath: searchParams.get('poster'),
          season: num(searchParams.get('s')),
          episode: num(searchParams.get('e')),
          startAt: num(searchParams.get('t')),
        }
      : null;

  const close = useCallback(() => router.replace('/dashboard', { scroll: false }), [router]);

  if (!watch) return null;
  return <StreamPlayer {...watch} onClose={close} />;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [current, setCurrent] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return <div className="min-h-dvh bg-background" aria-busy="true" />;
  }

  return (
    <main className="bg-background">
      <PickScreen onPick={setCurrent} />

      <div className="mx-auto max-w-330 space-y-14 px-4 pb-24 sm:px-6 lg:px-15">
        <ContinueWatchingSection />
        <TrendingSection limit={12} />
        {current && <SimilarContentSection tmdbId={current.tmdbId} contentType={current.contentType} currentTitle={current.title} />}
      </div>

      <CurrentlyWatchingBanner />

      <Suspense fallback={null}>
        <UrlStreamHandler />
      </Suspense>
    </main>
  );
}
