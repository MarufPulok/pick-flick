'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Re-runs the server component every `seconds` while the tab is visible. */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
