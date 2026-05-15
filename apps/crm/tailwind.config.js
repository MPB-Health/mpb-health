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
      // CRM peacock palette (2026-05-15) — see apps/crm/src/index.css for
      // the matching CSS custom properties (`--accent-*`, `--sidebar-*`).
      // Hex values mirror the RGB tokens there so utilities like `bg-primary`
      // and `text-brand-green` line up with `bg-th-accent-500` etc.
      colors: {
        primary: {
          DEFAULT: '#3D72BC',
          50:  '#F0F6FC',
          100: '#E2EBF7',
          200: '#C8DBF0',
          300: '#9EBFE6',
          400: '#6998D7',
          500: '#3D72BC',   // peacock royal blue
          600: '#325FA0',
          700: '#284E84',
          800: '#21416E',
          900: '#1B3258',
          950: '#13233F',
          foreground: '#FFFFFF',
        },
        brand: {
          // Peacock palette keys
          navy: '#1B2D5C',           // dark peacock navy (sidebar bg)
          blue: '#1B2D5C',           // alias for legacy `bg-brand-blue` callsites
          'blue-light': '#3D72BC',   // royal blue accent
          green: '#5BA85A',          // bright peacock-feather green
          'green-deep': '#3F5E29',   // forest (charts / nav rails)
          tan: '#A18C5E',            // warm secondary
          'gray-light': '#E2EAF0',   // unchanged neutral
        },
      },
      animation: {
        scroll: 'scroll 30s linear infinite',
        shimmer: 'shimmer 3s ease-in-out infinite',
        'button-shimmer': 'button-shimmer 2.5s ease-in-out infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%, 100%': { backgroundSize: '200% 200%', backgroundPosition: 'left center' },
          '50%': { backgroundSize: '200% 200%', backgroundPosition: 'right center' },
        },
        'button-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
};
