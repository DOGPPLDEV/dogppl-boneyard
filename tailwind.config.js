/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
        sans:    ['var(--font-body)', '"Inter Tight"', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bone:           'var(--bone)',
        'bone-dim':     'var(--bone-dim)',
        paw:            'var(--paw)',
        'paw-deep':     'var(--paw-deep)',
        'paw-card':     'var(--paw-card)',
        'paw-elev':     'var(--paw-elev)',
        grass:          'var(--grass)',
        'grass-bright': 'var(--grass-bright)',
        mud:            'var(--mud)',
        sand:           'var(--sand)',
        'dry-sage':     'var(--dry-sage)',
        rust:           'var(--rust)',
      },
      borderColor: {
        DEFAULT:     'var(--border)',
        subtle:      'var(--border)',
        strong:      'var(--border-strong)',
      },
    },
  },
  plugins: [],
};
