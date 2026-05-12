import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1a6b3c', dark: '#134d2c', light: '#25a05a' },
        'brand-dark': '#134d2c',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
