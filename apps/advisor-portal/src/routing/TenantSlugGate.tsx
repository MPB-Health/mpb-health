import { Loader2 } from 'lucide-react';
import { useTenant } from '@mpbhealth/auth';

/** Blocks tenant-scoped routes until org slug from URL resolves on AOS. */
export function TenantSlugGate({ children }: { children: React.ReactNode }) {
  const { loading, error, orgSlug, pathTenantSlug, isAosPlatform } = useTenant();

  if (!isAosPlatform || !pathTenantSlug) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF5A1F]" aria-hidden />
      </div>
    );
  }

  if (error || !orgSlug) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center">
        <h1 className="text-lg font-semibold text-white">Tenant not found</h1>
        <p className="mt-2 max-w-md text-sm text-gray-400">
          {error ?? `No organization matches /${pathTenantSlug}.`}
        </p>
        <a href="/landing" className="mt-6 text-sm font-medium text-[#FF5A1F] hover:underline">
          Back to Advisor OS
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
