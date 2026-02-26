import { useState, useCallback } from 'react';
import { supabase } from '@mpbhealth/database';
import toast from 'react-hot-toast';

interface SSOResult {
  url: string;
  redirect_path: string;
}

/**
 * Extract the real error message from a Supabase Functions error.
 * The SDK returns a generic message; the actual error is in the Response body.
 */
async function extractError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) return body.error;
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
