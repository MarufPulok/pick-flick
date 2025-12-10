'use client';

/**
 * Dashboard Page  
 * Main app page after onboarding (placeholder for Phase 5)
 */

import { Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-animated px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold text-gradient">PickFlick</span>
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {session?.user?.name || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            Your perfect picks are just a click away
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Dashboard Coming Soon</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            This is where you&apos;ll generate recommendations and view your history.
            We&apos;re building something amazing for Phase 5!
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/onboarding"
              className="px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              Update Preferences
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
