import { QueryProvider, SessionProvider, ThemeProvider } from '@/providers';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PickFlick | One Click. One Pick. No Paralysis.',
  description:
    'Stop scrolling, start watching. PickFlick gives you one perfect recommendation based on your taste. No more decision fatigue.',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider defaultTheme="dark">
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
