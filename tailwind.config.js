/** @type {import('tailwindcss').Config} */
// Cadenzia. Colours and fonts resolve to the CSS custom properties defined in
// src/styles/global.css — that file is the single token source of truth. Colours
// use rgb(var(--rgb-x) / <alpha-value>) so Tailwind opacity modifiers work
// (bg-ink/5, border-accent/40…) while staying CSS custom properties.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'rgb(var(--rgb-paper) / <alpha-value>)',
          raised: 'rgb(var(--rgb-paper-raised) / <alpha-value>)',
          wash: 'rgb(var(--rgb-paper-wash) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--rgb-ink) / <alpha-value>)',
          soft: 'rgb(var(--rgb-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--rgb-ink-faint) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--rgb-accent) / <alpha-value>)',
          bright: 'rgb(var(--rgb-accent-bright) / <alpha-value>)',
        },
        warm: 'rgb(var(--rgb-warm) / <alpha-value>)',
        line: 'rgb(var(--rgb-line) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.12em',
      },
      maxWidth: {
        content: '1180px',
      },
      borderColor: {
        DEFAULT: 'rgb(var(--rgb-line) / <alpha-value>)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
