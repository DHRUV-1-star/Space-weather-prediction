/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mission: {
          bg: '#060a14',
          panel: '#0b1220',
          panel2: '#101a2e',
          line: '#1c2a44',
          cyan: '#22d3ee',
          green: '#34d399',
          amber: '#fbbf24',
          red: '#f87171',
          text: '#c7d6ee',
          muted: '#6b7fa3',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 18px rgba(34, 211, 238, 0.35)',
        glowred: '0 0 22px rgba(248, 113, 113, 0.45)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.75' },
          '50%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 2.2s ease-in-out infinite',
        flicker: 'flicker 0.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
