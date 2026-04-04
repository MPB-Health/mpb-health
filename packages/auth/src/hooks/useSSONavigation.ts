/**
 * useSSONavigation - Hook for navigating between portals with SSO
 *
 * Wraps the unified `getPortalSSOUrl` service to provide a simple
 * `navigateToPortal(portal)` callback with loading state.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@mpbhealth/database';
import { type PortalKey } from '@mpbhealth/config';
import { getPortalSSOUrl, shouldOpenInNewTab, type SSOResult } from '../services/ssoService';

export interface UseSSONavigationReturn {
  /** Navigate to a portal via SSO. Throws on failure. */
  navigateToPortal: (portal: PortalKey, options?: { newTab?: boolean }) => Promise<void>;
  /** The portal currently being navigated to, or null when idle */
  loadingPortal: PortalKey | null;
  /** Last SSO error, cleared on next attempt */
  error: string | null;
}

export function useSSONavigation(): UseSSONavigationReturn {
  const [loadingPortal, setLoadingPortal] = useState<PortalKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigateToPortal = useCallback(async (
    portal: PortalKey,
    options?: { newTab?: boolean },
  ) => {
    setLoadingPortal(portal);
    setError(null);

    try {
      const result: SSOResult = await getPortalSSOUrl(portal, supabase);
      const openNewTab = options?.newTab ?? shouldOpenInNewTab(portal);

      if (openNewTab) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = result.url;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SSO navigation failed';
      setError(msg);
      console.error('[useSSONavigation] Failed:', msg);
      throw err;
    } finally {
      setLoadingPortal(null);
    }
  }, []);

  return { navigateToPortal, loadingPortal, error };
}
