/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Wired to CSS custom properties — exact values land once the
        // HTML mockup arrives.
        bone:  'var(--bone)',
        paw:   'var(--paw)',
        grass: 'var(--grass)',
        mud:   'var(--mud)',
        sand:  'var(--sand)',
        rust:  'var(--rust)',
        sage:  'var(--sage)',
      },
    },
  },
  plugins: [],
};
