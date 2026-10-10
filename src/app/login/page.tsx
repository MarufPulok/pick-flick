'use client';

/**
 * Login Page
 * Authentication with Google OAuth
 */

import { Button } from '@/components/ui/button';
import { useTrending } from '@/hooks/use-trending';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" aria-busy="true" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { data } = useTrending({ type: 'ALL', timeWindow: 'week', limit: 1 });
  const backdrop = data?.items?.[0]?.backdropUrl ?? null;
  const [signingIn, setSigningIn] = useState(false);

  // Redirect if already authenticated (using useEffect to avoid setState in render)
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="min-h-dvh bg-background" aria-busy="true" />;
  }

  // Don't render login form if authenticated
  if (status === 'authenticated') {
    return null;
  }

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 transition-opacity duration-300 starting:opacity-0">
      <div className="absolute inset-0 -z-10">
        {backdrop && <Image src={backdrop} alt="" fill priority unoptimized sizes="100vw" className="lights-up object-cover object-[70%_center]" />}
        <div className="scrim absolute inset-0" />
      </div>
      <div className="w-full max-w-90">
        <h1 className="font-display text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Tonight&apos;s pick is waiting.</h1>
        <p className="mt-3 text-muted-foreground">Sign in and it picks from your taste, not a catalog.</p>
        <Button variant="play" className="mt-8 w-full" aria-busy={signingIn} onClick={() => { setSigningIn(true); signIn('google'); }}>
          Continue with Google
        </Button>
        {error && <p className="mt-4 text-sm text-destructive">Authentication failed. Please try again.</p>}
      </div>
    </main>
  );
}
