import type { Metadata } from 'next';
import {
  Instrument_Serif,
  Figtree,
  Cormorant_Garamond,
  Bodoni_Moda,
  Fraunces,
  Archivo,
} from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { copy } from '@/lib/copy';
import {
  DEFAULT_THEME,
  themeBootScript,
  themeSwitcherEnabled,
} from '@/lib/themes';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import './globals.css';

// Each font exposes its own variable; globals.css maps the active theme's
// picks onto --font-display / --font-sans. Only the classic pair preloads.
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--ff-instrument',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--ff-figtree',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--ff-cormorant',
  display: 'swap',
  preload: false,
});

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--ff-bodoni',
  display: 'swap',
  preload: false,
});

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--ff-fraunces',
  display: 'swap',
  preload: false,
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--ff-archivo',
  display: 'swap',
  preload: false,
});

const fontVars = [instrument, figtree, cormorant, bodoni, fraunces, archivo]
  .map((f) => f.variable)
  .join(' ');

export const metadata: Metadata = {
  title: {
    default: `${copy.brand} — Wedding`,
    template: `%s · ${copy.brand}`,
  },
  description: copy.heroLine,
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: `${copy.brand} — Wedding`,
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
    <html
      lang="en"
      className={fontVars}
      data-theme={DEFAULT_THEME}
      data-mode="light"
      suppressHydrationWarning
    >
      <head>
        {themeSwitcherEnabled ? (
          <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        ) : null}
      </head>
      <body className="font-sans antialiased">
        {children}
        {themeSwitcherEnabled ? <ThemeSwitcher /> : null}
        <Analytics />
      </body>
    </html>
  );
}
