'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface PosterProps {
  /** Full TMDB image URL, or a bare TMDB path (`/abc.jpg`) resolved at w342. */
  src?: string | null;
  alt?: string;
  /** Rendered width hint for next/image, e.g. "130px". */
  sizes: string;
  priority?: boolean;
  /** Shown over the 10% bone block when there is no image. */
  fallback?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A 2:3 poster tile. The 10% bone skeleton is the surface; the image fades in
 * over it once decoded, so rails never flash white or jump. Gated by
 * prefers-reduced-motion in globals.css.
 */
export function Poster({ src, alt = '', sizes, priority, fallback, className, children }: PosterProps) {
  const [loaded, setLoaded] = useState(false);
  const url = src ? (src.startsWith('/') ? `https://image.tmdb.org/t/p/w342${src}` : src) : null;

  return (
    <div className={cn('relative aspect-2/3 overflow-hidden rounded-md border border-border bg-foreground/10', className)}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          className={cn('poster-img object-cover', loaded && 'is-loaded')}
        />
      ) : (
        fallback
      )}
      {children}
    </div>
  );
}
