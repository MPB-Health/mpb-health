import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { TenantSlugGate } from './TenantSlugGate';
import {
  AuthGuard,
  appRouteElements,
  authRouteElements,
} from './routeElements';

function PathTenantRoot() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-sage/20 via-white to-brand-sage/10 p-6 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-lg font-semibold text-brand-forest">Concierge Portal</h1>
        <p className="text-sm text-brand-olive">
          Sign in at{' '}
          <code className="rounded bg-brand-sage/30 px-1.5 py-0.5 text-brand-forest">
            /your-organization/login
          </code>
          , for example{' '}
          <a href="/saudemax/login" className="font-medium text-brand-teal hover:underline">
            /saudemax/login
          </a>
          .
        </p>
      </div>
    </div>
  );
}

/**
 * ARYX concierge routes (concierge.aryxcloud.com): /{tenantSlug}/login, /{tenantSlug}/daily-logs, …
 */
export default function PathTenantRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PathTenantRoot />} />

      <Route path="/:tenantSlug">
        {authRouteElements(true)}

        <Route
          element={
            <TenantSlugGate>
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            </TenantSlugGate>
          }
        >
          {appRouteElements()}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
