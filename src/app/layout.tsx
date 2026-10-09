import { GlobalNav } from '@/components/layout/global-nav';
import { ToastProvider } from '@/components/providers/toast-provider';
import { QueryProvider, SessionProvider, ThemeProvider } from '@/providers';
import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  axes: ['opsz', 'wdth'],
});

export const metadata: Metadata = {
  title: 'Pick Flick',
  description:
    'One pick for tonight, chosen from your taste, then press play. No scrolling.',
  keywords: [
    'movie recommendations',
    'tv show finder',
    'anime suggestions',
    'what to watch',
    'movie picker',
    'streaming guide',
  ],
  authors: [{ name: 'PickFlick' }],
  openGraph: {
    title: 'PickFlick | One Click. One Pick. No Paralysis.',
    description:
      'Stop scrolling, start watching. Get one perfect recommendation based on your taste.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} antialiased`}
      >
        <ToastProvider />
        <SessionProvider>
          <ThemeProvider defaultTheme="dark">
            <QueryProvider>
              <GlobalNav />
              {children}
            </QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
