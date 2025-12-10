'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Film, History, LayoutDashboard, LogOut, Settings, Sparkles, ThumbsUp, Tv, Zap } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return 'U';
    const names = session.user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-animated">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient">PickFlick</span>
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || 'User'} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline">
                      {session?.user?.name?.split(' ')[0] || 'Account'}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session?.user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/onboarding" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Preferences
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/onboarding"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-float">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">
              Powered by intelligent recommendations
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-gradient">One Click.</span>
            <br />
            <span className="text-foreground">One Pick.</span>
            <br />
            <span className="text-muted-foreground">No Paralysis.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Stop wasting time scrolling through endless options. Tell us what
            you&apos;re in the mood for, and we&apos;ll give you{' '}
            <span className="text-foreground font-medium">
              exactly one perfect pick
            </span>
            .
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/onboarding"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg glow hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {isAuthenticated ? 'Go to Dashboard' : 'Start Picking'}
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border text-foreground font-semibold text-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2"
            >
              Learn More
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-muted-foreground">
            Free forever • No credit card required • Works with Movies, Series &amp;
            Anime
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to end your decision paralysis forever
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl glass card-hover">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Film className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Set Your Mood</h3>
              <p className="text-muted-foreground">
                Tell us what you&apos;re craving — a thrilling Korean drama, a
                cozy anime, or a mind-bending sci-fi movie.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl glass card-hover">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get One Pick</h3>
              <p className="text-muted-foreground">
                Our algorithm analyzes your preferences and returns exactly{' '}
                <span className="font-medium text-foreground">
                  one recommendation
                </span>
                . No lists. No overwhelm.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl glass card-hover">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Tv className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Watching</h3>
              <p className="text-muted-foreground">
                See where it&apos;s streaming, save it to your history, and let
                us know if you loved it for even better future picks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              All Your Content, One Place
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you&apos;re into Hollywood blockbusters, K-dramas, or
              anime, we&apos;ve got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Movies */}
            <div className="relative group p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Film className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Movies</h3>
              <p className="text-muted-foreground">
                From indie gems to blockbusters, in every language you love.
              </p>
            </div>

            {/* Series */}
            <div className="relative group p-8 rounded-2xl border border-border hover:border-accent/50 transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Tv className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-2xl font-bold mb-2">TV Series</h3>
              <p className="text-muted-foreground">
                Find your next binge-worthy show without the endless scrolling.
              </p>
            </div>

            {/* Anime */}
            <div className="relative group p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Anime</h3>
              <p className="text-muted-foreground">
                Shōnen, Seinen, Isekai — whatever your style, we know the
                perfect one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                It Gets{' '}
                <span className="text-gradient">Smarter</span> Over Time
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                The more you use PickFlick, the better it understands your
                taste. Rate your picks and watch the magic happen.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <ThumbsUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Learning</h4>
                    <p className="text-sm text-muted-foreground">
                      Like a pick? We&apos;ll find more like it. Didn&apos;t love it?
                      We&apos;ll never suggest it again.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">History Dashboard</h4>
                    <p className="text-sm text-muted-foreground">
                      Keep track of all your picks. See what you loved and
                      revisit old favorites.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      &quot;Feeling Lucky&quot; Mode
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Can&apos;t decide on filters? Let us pick based on your taste
                      profile. Zero effort required.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl glass p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-2xl font-bold mb-2">Your Perfect Pick</p>
                  <p className="text-muted-foreground">
                    One recommendation, tailored just for you
                  </p>
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to End Decision Fatigue?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of viewers who&apos;ve stopped scrolling and started
            watching.
          </p>
          <Link
            href={isAuthenticated ? "/dashboard" : "/onboarding"}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg glow hover:scale-105 transition-transform"
          >
            <Sparkles className="w-5 h-5" />
            {isAuthenticated ? 'Go to Dashboard' : 'Get Your First Pick'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">PickFlick</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PickFlick. Made with ❤️ for
            entertainment lovers.
          </p>
        </div>
      </footer>
    </div>
  );
}
