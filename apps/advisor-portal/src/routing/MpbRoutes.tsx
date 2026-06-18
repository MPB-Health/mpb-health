import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { LandingPage } from './lazyPages';
import { appRouteElements, authRouteElements, routeFallback } from './routeElements';

/**
 * Production route table for advisor.mpb.health and advisor.aryxcloud.com.
 * Flat URLs (/login, /training, …) — unchanged from the pre-outage portal.
 */
export default function MpbRoutes() {
  return (
    <Routes>
      <Route
        path="/landing"
        element={
          <Suspense fallback={routeFallback('Loading…', 'Preparing the platform.')}>
            <LandingPage />
          </Suspense>
        }
      />

      {authRouteElements(false)}

      <Route path="/" element={<MainLayout />}>
        {appRouteElements()}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
