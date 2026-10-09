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
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/search', label: 'Search' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/history', label: 'History' },
];

export function GlobalNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading' || pathname === '/watch') return null;

  const authed = status === 'authenticated';
  const initials = (session?.user?.name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-linear-to-b from-background/85 to-transparent">
      <div className="mx-auto flex h-16 max-w-330 items-center justify-between px-4 sm:px-6 lg:px-15">
        <Link href={authed ? '/dashboard' : '/'} className="font-display text-xl font-bold tracking-[-0.01em]">
          Pick Flick
        </Link>

        <nav className="flex items-center gap-5 text-[15px] sm:gap-8">
          {(authed ? LINKS : LINKS.slice(0, 1)).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn('transition-opacity hover:opacity-100', pathname === l.href ? 'opacity-100' : 'opacity-75')}
            >
              {l.label}
            </Link>
          ))}

          {authed ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Account">
                <Avatar className="size-8 border border-border">
                  <AvatarImage src={session?.user?.image || undefined} alt="" />
                  <AvatarFallback className="bg-surface text-xs font-medium">{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/onboarding">Taste profile</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : pathname === '/login' ? null : (
            <Link href="/login" className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
