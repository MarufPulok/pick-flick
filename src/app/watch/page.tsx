/**
 * Watch Page
 * Standalone streaming page for anonymous users
 * Reads TMDB ID and content type from URL params
 */

'use client';

import { StreamPlayer } from '@/components/dashboard/stream-player';
import { ContentType } from '@/dtos/common.dto';
import { ArrowLeft, Play, Search } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Cannot Play Content</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            <Search className="w-4 h-4" />
            Go to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
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
  return (
    <>
      {/* Back button overlay - shown when not in fullscreen player */}
      <div className="fixed top-4 left-4 z-40">
        <Link
          href="/search"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Search</span>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
          </div>
        }
      >
        <WatchContent />
      </Suspense>
    </>
  );
}
