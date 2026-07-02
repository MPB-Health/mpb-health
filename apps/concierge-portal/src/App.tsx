import MpbRoutes from './routing/MpbRoutes';

// Prefetch common routes when the browser is idle
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    import('./pages/Dashboard').catch(() => {});
    import('./pages/DailyLogs').catch(() => {});
    import('./pages/Tickets').catch(() => {});
    import('./pages/Profile').catch(() => {});
  });
}

export default function App() {
  return <MpbRoutes />;
}
