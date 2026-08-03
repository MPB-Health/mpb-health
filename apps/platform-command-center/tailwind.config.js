import sharedConfig from '@mpbhealth/tailwind-config';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [sharedConfig],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1220',
          muted: '#5A6577',
        },
        surface: {
          DEFAULT: '#F3F6FA',
          raised: '#FFFFFF',
          line: 'rgba(11, 18, 32, 0.08)',
        },
        accent: {
          DEFAULT: '#0F6E56',
          deep: '#0A4F3D',
          soft: '#D8F3E7',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
};
