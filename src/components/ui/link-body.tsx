'use client';

import { cn } from '@/lib/utils';
import { useLinkStatus } from 'next/link';

/**
 * Block inside a next/link. While the navigation is pending the contents
 * breathe (the lamp pulse), so a tap on a tile or nav link is acknowledged
 * before the route lands.
 */
export function LinkBody({ className, children }: { className?: string; children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span data-pending={pending} className={cn('block data-[pending=true]:animate-lamp', className)}>
      {children}
    </span>
  );
}
