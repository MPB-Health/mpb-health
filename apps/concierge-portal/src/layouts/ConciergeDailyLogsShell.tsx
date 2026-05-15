import { Suspense, lazy, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

const DailyLogs = lazy(() => import('../pages/DailyLogs'));

/**
 * Keeps `DailyLogs` mounted when switching between `/daily-logs` and `/reports`
 * so ISO week and other UI state persist.
 */
export default function ConciergeDailyLogsShell({ fallback }: { fallback: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <DailyLogs />
      <Outlet />
    </Suspense>
  );
}
