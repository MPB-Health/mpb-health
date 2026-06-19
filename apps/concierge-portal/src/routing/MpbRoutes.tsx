import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { TenantSlugGate } from './TenantSlugGate';
import {
  AuthGuard,
  appRouteElements,
  authRouteElements,
} from './routeElements';

/**
 * Production routes for concierge.mpb.health — flat URLs (/login, /daily-logs, …).
 */
export default function MpbRoutes() {
  return (
    <Routes>
      {authRouteElements(false)}

      <Route path="/" element={<AuthGuard><MainLayout /></AuthGuard>}>
        {appRouteElements()}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
