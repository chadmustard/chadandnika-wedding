'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  THEMES,
  THEME_STORAGE_KEY,
  type ThemeId,
  type ThemeMode,
} from '@/lib/themes';

/**
 * Dev-only floating control for flipping between design directions on the
 * real pages. Rendered by the root layout only when `themeSwitcherEnabled`.
 */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [mode, setMode] = useState<ThemeMode>('light');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const d = document.documentElement;
    setTheme((d.dataset.theme as ThemeId) ?? DEFAULT_THEME);
    setMode(d.dataset.mode === 'dark' ? 'dark' : 'light');
    if (new URLSearchParams(location.search).get('switcher') === '0') {
      setOpen(false);
    }
  }, []);

  function apply(nextTheme: ThemeId, nextMode: ThemeMode) {
    const d = document.documentElement;
    d.dataset.theme = nextTheme;
    d.dataset.mode = nextMode;
    setTheme(nextTheme);
    setMode(nextMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      localStorage.setItem(MODE_STORAGE_KEY, nextMode);
    } catch {
      /* private mode — fine, just won't persist */
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open theme switcher"
        className="fixed bottom-4 left-4 z-[60] h-9 w-9 rounded-full border border-black/10 bg-white text-sm shadow-lg"
      >
        🎨
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Design direction (dev only)"
      className="fixed bottom-4 left-4 z-[60] w-[13.5rem] rounded-xl border border-black/10 bg-white/95 p-2.5 font-sans text-[12px] text-neutral-900 shadow-2xl backdrop-blur"
    >
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Direction
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide theme switcher"
          className="text-neutral-400 hover:text-neutral-900"
        >
          ✕
        </button>
      </div>
      <div className="grid gap-1">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => apply(t.id, mode)}
            aria-pressed={theme === t.id}
            title={t.blurb}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
              theme === t.id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
            }`}
          >
            <span
              data-theme={t.id}
              data-mode={mode}
              className="flex h-4 w-8 shrink-0 overflow-hidden rounded-sm ring-1 ring-black/10"
            >
              <span className="flex-1 bg-wedding-cream" />
              <span className="flex-1 bg-wedding-sage" />
              <span className="flex-1 bg-wedding-blush" />
              <span className="flex-1 bg-wedding-gold" />
            </span>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-md bg-neutral-100 p-0.5">
        {(['light', 'dark'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => apply(theme, m)}
            aria-pressed={mode === m}
            className={`rounded px-2 py-1 capitalize transition ${
              mode === m ? 'bg-white shadow-sm' : 'text-neutral-500'
            }`}
          >
            {m === 'light' ? '☀︎ Light' : '☾ Dark'}
          </button>
        ))}
      </div>
    </div>
  );
}
