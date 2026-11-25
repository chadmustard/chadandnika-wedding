/**
 * Design-direction prototypes. `classic` is the current production look.
 * See src/app/globals.css for the tokens behind each theme.
 */
export const THEMES = [
  { id: 'classic', label: 'Classic', blurb: 'Current site. Beige. Tasteful. Vanilla.' },
  { id: 'velvet', label: 'Velvet Hour', blurb: 'Emerald, oxblood, champagne gold.' },
  { id: 'editorial', label: 'Front Page', blurb: 'Newsprint, black ink, one loud red.' },
  { id: 'spritz', label: 'Spritz', blurb: 'Aperol, raspberry, butter, plum.' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export type ThemeMode = 'light' | 'dark';

export const DEFAULT_THEME: ThemeId = 'classic';

export const THEME_STORAGE_KEY = 'wedding-theme';
export const MODE_STORAGE_KEY = 'wedding-mode';

/** Dev / preview only. Production keeps the default theme until one is picked. */
export const themeSwitcherEnabled =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_THEME_SWITCHER === '1';

/**
 * Runs before paint so a stored or `?theme=…&mode=…` choice doesn't flash.
 * Kept tiny and dependency-free because it's inlined into <head>.
 */
export const themeBootScript = `(function(){try{
var q=new URLSearchParams(location.search),d=document.documentElement;
var ids=${JSON.stringify(THEMES.map((t) => t.id))};
var t=q.get('theme')||localStorage.getItem('${THEME_STORAGE_KEY}');
var m=q.get('mode')||localStorage.getItem('${MODE_STORAGE_KEY}');
if(t&&ids.indexOf(t)>-1){d.dataset.theme=t;localStorage.setItem('${THEME_STORAGE_KEY}',t);}
if(m==='light'||m==='dark'){d.dataset.mode=m;localStorage.setItem('${MODE_STORAGE_KEY}',m);}
}catch(e){}})();`;
