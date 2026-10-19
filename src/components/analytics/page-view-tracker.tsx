'use client';

import { track } from '@/lib/track';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const SESSION_KEY = 'pf_session_seen';

/** External referrer host on the first view of a browser session, else undefined. */
function firstViewRef(): string | undefined {
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return undefined;
    window.sessionStorage.setItem(SESSION_KEY, '1');
    const host = document.referrer ? new URL(document.referrer).host : '';
    return host && host !== window.location.host ? host.slice(0, 100) : undefined;
  } catch {
    return undefined;
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    track({ type: 'view', path: pathname.slice(0, 200), ref: firstViewRef() });
  }, [pathname]);
  return null;
}
