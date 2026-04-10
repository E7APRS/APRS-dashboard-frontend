import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          orange:      '#FF6600',
          'dark-orange': '#B84B00', // accessible on white: 5.19:1
          blue:        '#0085CA',
          silver:      '#C0C0C0',
          onyx:        '#1A1A1A',
          earth:       '#003366',
        },
      },
      fontFamily: {
        rajdhani: ['var(--font-rajdhani)', 'sans-serif'],
        roboto:   ['var(--font-roboto)',   'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
