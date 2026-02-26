import { useState, useCallback } from 'react';
import { supabase } from '@mpbhealth/database';
import toast from 'react-hot-toast';

interface SSOResult {
  success?: boolean;
  url?: string;
  redirect_path?: string;
  error?: string;
}

/**
 * Extract the real error message from a Supabase Functions error.
 * The SDK returns a generic message; the actual error is in the Response body.
 */
async function extractError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    try {
      const ctx = (error as any).context;
      const status = typeof ctx?.status === 'number' ? ctx.status : undefined;
      if (ctx && typeof ctx.clone === 'function') {
        const cloned = ctx.clone();
        if (typeof cloned.json === 'function') {
          const body = await cloned.json();
          if (body?.error) {
            return status ? `Support SSO failed (${status}): ${body.error}` : body.error;
          }
        }
      }
      if (ctx && typeof ctx.text === 'function') {
        const raw = (await ctx.text())?.trim();
        if (raw) {
          return status ? `Support SSO failed (${status}): ${raw}` : raw;
        }
      }
    } catch {
      // ignore
    }
  }
  return error instanceof Error ? error.message : 'Failed to open support portal';
}

export function useSupportSSO() {
  const [loading, setLoading] = useState(false);

  const openSupport = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<SSOResult>('sso-itsts-login');

      if (error) {
        const msg = await extractError(error);
        throw new Error(msg);
      }
      if (data?.success === false) {
        throw new Error(data.error || 'Failed to open support portal');
      }
      if (!data?.url) throw new Error('No SSO URL returned');

      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open support portal';
      toast.error(msg);
      console.error('[useSupportSSO]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { openSupport, loading };
}
