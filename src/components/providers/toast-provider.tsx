/**
 * Toast Provider  
 * Wraps app with Sonner Toaster for notifications
 */

'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
        className: 'toast-mobile',
      }}
      className="!bottom-4 !right-4 sm:!bottom-6 sm:!right-6"
    />
  );
}
