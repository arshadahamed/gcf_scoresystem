import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1a6b3c', dark: '#134d2c', light: '#25a05a' },
      },
      animation: { 'ball-in': 'ballIn 0.3s ease-out' },
      keyframes: {
        ballIn: { '0%': { transform: 'scale(0)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
};
export default config;
