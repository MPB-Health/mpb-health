import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { safeRemoveChannel } from '@mpbhealth/database';
import CmsPage from '../pages/CmsPage';

interface ManagedPageProps {
  path: string;
  fallback: ReactNode;
}

/**
 * Renders a published CMS page at `path` when one exists; otherwise shows the
 * legacy React page component.
 */
export function ManagedPage({ path, fallback }: ManagedPageProps) {
  const [mode, setMode] = useState<'loading' | 'cms' | 'static'>('loading');

  const checkCms = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMode('static');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('id')
        .eq('path', path)
        .eq('is_published', true)
        .maybeSingle();

      if (
        error &&
        (error.code === 'PGRST205' ||
          error.code === 'PGRST204' ||
          error.message?.includes('schema cache'))
      ) {
        setMode('static');
        return;
      }
      if (error) throw error;
      setMode(data ? 'cms' : 'static');
    } catch {
      setMode('static');
    }
  }, [path]);

  useEffect(() => {
    setMode('loading');
    checkCms();
  }, [checkCms]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`managed-page:${path}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cms_pages',
          filter: `path=eq.${path}`,
        },
        () => {
          checkCms();
        }
      )
      .subscribe();

    return () => safeRemoveChannel(channel);
  }, [path, checkCms]);

  if (mode === 'loading') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (mode === 'cms') {
    return <CmsPage resolvedPath={path} />;
  }

  return <>{fallback}</>;
}
