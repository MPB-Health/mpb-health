import { isPathTenantPlatformHost } from '@mpbhealth/auth';
import MpbRoutes from './routing/MpbRoutes';
import PathTenantRoutes from './routing/PathTenantRoutes';

// Prefetch common routes when the browser is idle
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    import('./pages/Dashboard').catch(() => {});
    import('./pages/DailyLogs').catch(() => {});
    import('./pages/Tickets').catch(() => {});
    import('./pages/Profile').catch(() => {});
  });
}

const usePathTenantRoutes =
  typeof window !== 'undefined' && isPathTenantPlatformHost(window.location.hostname, 'concierge');

export default function App() {
  return usePathTenantRoutes ? <PathTenantRoutes /> : <MpbRoutes />;
}
