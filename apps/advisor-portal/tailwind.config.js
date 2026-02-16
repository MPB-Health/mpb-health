import baseConfig from '@mpbhealth/tailwind-config';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [...(baseConfig.plugins || []), typography],
};
