/**
 * Watch Page
 * Standalone streaming page for anonymous users
 * Reads TMDB ID and content type from URL params
 */

'use client';

import { StreamPlayer } from '@/components/dashboard/stream-player';
import { ContentType } from '@/dtos/common.dto';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

interface WatchContent {
  tmdbId: number;
  contentType: ContentType;
  title: string;
  posterPath?: string;
}

function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [content, setContent] = useState<WatchContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    const type = searchParams.get('type') as ContentType | null;
    const title = searchParams.get('title') || 'Now Playing';
    const posterPath = searchParams.get('poster') || undefined;

    if (!id || !type) {
      setError('Missing content information');
      return;
    }

    const tmdbId = parseInt(id, 10);
    if (isNaN(tmdbId)) {
      setError('Invalid content ID');
      return;
    }

    // Validate content type
    if (!['MOVIE', 'SERIES', 'ANIME'].includes(type)) {
      setError('Invalid content type');
      return;
    }

    setContent({
      tmdbId,
      contentType: type,
      title: decodeURIComponent(title),
      posterPath,
    });
  }, [searchParams]);

  const handleClose = useCallback(() => {
    router.push('/search');
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Cannot play this.</h1>
        <p className="mt-4 text-muted-foreground">{error}</p>
        <Link href="/search" className="mt-6 inline-flex h-12 items-center rounded-md border border-border px-5 text-[15px] font-medium hover:bg-foreground/[0.06]">
          Go to search
        </Link>
      </div>
    );
  }

  if (!content) {
    return <div className="min-h-dvh bg-background" aria-busy="true" />;
  }

  return (
    <StreamPlayer
      tmdbId={content.tmdbId}
      contentType={content.contentType}
      title={content.title}
      onClose={handleClose}
    />
  );
}

export default function WatchPage() {
  const router = useRouter();
  return (
    <div className="min-h-dvh bg-background">
      <Button variant="ghost" size="sm" className="fixed left-4 top-4 z-40" onClick={() => router.push('/search')}>
        Back
      </Button>
      <Suspense fallback={<div className="min-h-dvh bg-background" aria-busy="true" />}>
        <WatchContent />
      </Suspense>
    </div>
  );
}
