import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { LandingPage } from './lazyPages';
import { TenantSlugGate } from './TenantSlugGate';
import { appRouteElements, authRouteElements, routeFallback } from './routeElements';

/**
 * ARYX AOS platform routes (aos.aryxcloud.com): /landing + /{tenantSlug}/…
 * Uses Fragment children (valid React Router v6) — never wrapper components.
 */
export default function AosRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route
        path="/landing"
        element={
          <Suspense fallback={routeFallback('Loading…', 'Preparing the platform.')}>
            <LandingPage />
          </Suspense>
        }
      />

      <Route path="/:tenantSlug">
        {authRouteElements(true)}

        <Route
          element={
            <TenantSlugGate>
              <MainLayout />
            </TenantSlugGate>
          }
        >
          {appRouteElements()}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}
