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
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        className: 'toast-mobile',
      }}
      className="!bottom-4 !right-4 sm:!bottom-6 sm:!right-6"
    />
  );
}
