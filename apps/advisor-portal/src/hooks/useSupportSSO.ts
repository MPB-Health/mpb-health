import { useState, useCallback } from 'react';
import { supabase } from '@mpbhealth/database';
import toast from 'react-hot-toast';

interface SSOResult {
  url: string;
  redirect_path: string;
}

export function useSupportSSO() {
  const [loading, setLoading] = useState(false);

  const openSupport = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<SSOResult>('sso-itsts-login');

      if (error) throw error;
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
