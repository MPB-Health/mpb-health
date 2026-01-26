/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('@mpbhealth/config/tailwind')],
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
          500: '#1991EB',
          600: '#147BC6',
          700: '#0F65A1',
          800: '#0A4E8E',
          900: '#083D71',
          950: '#062C54',
          foreground: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};
