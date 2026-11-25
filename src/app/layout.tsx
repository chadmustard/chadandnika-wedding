import type { Metadata } from 'next';
import { Instrument_Serif, Figtree } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { copy } from '@/lib/copy';
import './globals.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const sans = Figtree({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: copy.brand,
    template: `%s · ${copy.brand}`,
  },
  description: copy.heroLine,
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: copy.brand,
    description: copy.heroLine,
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
