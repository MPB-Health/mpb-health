import sharedConfig from '@mpbhealth/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [sharedConfig],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A4E8E',
          50: '#E8F4FD',
          100: '#D1E9FB',
          200: '#A3D3F7',
          300: '#75BDF3',
          400: '#47A7EF',
          500: '#0C71C3',
          600: '#0A4E8E',
          700: '#0F65A1',
          800: '#0A4E8E',
          900: '#083D71',
          950: '#062C54',
          foreground: '#FFFFFF',
        },
        brand: {
          blue: '#0A4E8E',
          'blue-light': '#0C71C3',
          green: '#A4CC43',
          'gray-light': '#E2EAF0',
          navy: '#0E2D41',
        },
      },
    },
  },
};
