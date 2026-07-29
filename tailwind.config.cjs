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
        wedding: {
          ink: '#141210',
          charcoal: '#2a2622',
          stone: '#8a7f72',
          mist: '#d8d0c4',
          cream: '#f2ebe1',
          sage: '#6b7a62',
          blush: '#c4786a',
          night: '#0c0b0a',
        },
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
