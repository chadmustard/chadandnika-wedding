/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Every color is a CSS variable (RGB channels) defined per theme in
        // src/app/globals.css, so `bg-wedding-ink/10` etc. keep working and
        // `data-theme` / `data-mode` on <html> re-skin the whole site.
        wedding: {
          ink: 'rgb(var(--c-ink) / <alpha-value>)',
          charcoal: 'rgb(var(--c-charcoal) / <alpha-value>)',
          stone: 'rgb(var(--c-stone) / <alpha-value>)',
          mist: 'rgb(var(--c-mist) / <alpha-value>)',
          cream: 'rgb(var(--c-surface) / <alpha-value>)',
          paper: 'rgb(var(--c-paper) / <alpha-value>)',
          field: 'rgb(var(--c-field) / <alpha-value>)',
          sage: 'rgb(var(--c-accent) / <alpha-value>)',
          blush: 'rgb(var(--c-accent-2) / <alpha-value>)',
          gold: 'rgb(var(--c-gold) / <alpha-value>)',
          night: 'rgb(var(--c-night) / <alpha-value>)',
          onnight: 'rgb(var(--c-on-night) / <alpha-value>)',
        },
      },
      borderRadius: {
        theme: 'var(--radius)',
        btn: 'var(--radius-btn)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.06)' },
        },
        'draw-line': {
          '0%': { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s ease-out both',
        'ken-burns': 'ken-burns 18s ease-out forwards',
        'draw-line': 'draw-line 1.2s ease-out both',
      },
    },
  },
  plugins: [],
};
