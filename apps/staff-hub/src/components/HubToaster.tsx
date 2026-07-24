import { Toaster } from 'react-hot-toast';
import { useTheme } from '@mpbhealth/ui';

export function HubToaster() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: dark ? '#132433' : '#0e2d41',
          color: '#f4f7fb',
          borderRadius: '0.85rem',
          border: dark ? '1px solid rgba(232, 238, 245, 0.12)' : '1px solid transparent',
          boxShadow: dark
            ? '0 16px 40px rgba(0, 0, 0, 0.45)'
            : '0 16px 40px rgba(14, 45, 65, 0.18)',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: '0.875rem',
        },
      }}
    />
  );
}
