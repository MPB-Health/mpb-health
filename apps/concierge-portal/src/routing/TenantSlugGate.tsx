import { Loader2 } from 'lucide-react';
import { useTenant } from '@mpbhealth/auth';

/** Blocks tenant-scoped routes until org slug from URL resolves on concierge.aryxcloud.com. */
export function TenantSlugGate({ children }: { children: React.ReactNode }) {
  const { loading, error, orgSlug, pathTenantSlug, isPathTenantPlatform } = useTenant();

  if (!isPathTenantPlatform || !pathTenantSlug) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-sage/20 via-white to-brand-sage/10">
        <Loader2 className="h-10 w-10 animate-spin text-brand-teal" aria-hidden />
      </div>
    );
  }

  if (error || !orgSlug) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-sage/20 via-white to-brand-sage/10 px-6 text-center">
        <h1 className="text-lg font-semibold text-brand-forest">Tenant not found</h1>
        <p className="mt-2 max-w-md text-sm text-brand-olive">
          {error ?? `No organization matches /${pathTenantSlug}.`}
        </p>
        <a href="/" className="mt-6 text-sm font-medium text-brand-teal hover:underline">
          Concierge Portal home
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
