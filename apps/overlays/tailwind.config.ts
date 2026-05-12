import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { broadcast: ['Rajdhani', 'Impact', 'sans-serif'] },
      colors: {
        'obs-green': '#00b140',
        'obs-red': '#e53e3e',
        'obs-yellow': '#f6e05e',
        brand: { DEFAULT: '#1a6b3c', dark: '#134d2c' },
      },
      animation: {
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'burst':      'burst 0.5s ease-out',
        'fade-out':   'fadeOut 0.5s ease-in forwards',
      },
      keyframes: {
        slideUp:   { '0%': { transform: 'translateY(100%)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-100%)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        burst:     { '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' }, '60%': { transform: 'scale(1.1) rotate(2deg)' }, '100%': { transform: 'scale(1) rotate(0)', opacity: '1' } },
        fadeOut:   { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
      },
    },
  },
};
export default config;
