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
          DEFAULT: '#4A7C8A',
          50: '#EEF4F6',
          100: '#D8E8EC',
          200: '#B1D0D9',
          300: '#8AB9C6',
          400: '#63A1B3',
          500: '#4A7C8A',
          600: '#3D6773',
          700: '#2F4F59',
          800: '#233B43',
          900: '#1A2C32',
          950: '#0F1A1E',
          foreground: '#FFFFFF',
        },
        brand: {
          forest: '#2F3E2F',
          teal: '#4A7C8A',
          olive: '#5B6B2E',
          chartreuse: '#8B9B3A',
          sage: '#A8B8AC',
          navy: '#2F3E2F',
        },
      },
    },
  },
};
