import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { safeRemoveChannel } from '@mpbhealth/database';
import type { CmsPage as CmsPageRow } from '@mpbhealth/database';
import { BlockRenderer } from '../components/cms-blocks';
import NotFound from './NotFound';

const SELECT_COLUMNS =
  'id, path, slug, title, description, sections, is_published, meta, created_by, created_at, updated_at';

/**
 * Public-facing renderer for any admin-authored CMS page. Resolves the page
 * by URL path (`location.pathname`) so the same component handles every
 * route registered in App.tsx.
 *
 * Live updates: subscribes to `cms_pages` Realtime + refetches on visibility
 * so the public site re-renders within ~1s of an admin publish.
 */
export default function CmsPage() {
  const location = useLocation();
  const params = useParams<{ slug?: string }>();
  const [page, setPage] = useState<CmsPageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // If the route is `/p/:slug`, look up by slug. Otherwise resolve by full path.
  const lookup = params.slug
    ? { column: 'slug' as const, value: params.slug }
    : { column: 'path' as const, value: location.pathname };

  const fetchPage = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('cms_pages')
        .select(SELECT_COLUMNS)
        .eq(lookup.column, lookup.value)
        .eq('is_published', true)
        .maybeSingle();

      // Table may not exist yet in some environments — degrade gracefully.
      if (
        error &&
        (error.code === 'PGRST205' ||
          error.code === 'PGRST204' ||
          error.message?.includes('schema cache'))
      ) {
        setNotFound(true);
        return;
      }
      if (error) throw error;

      if (!data) {
        setNotFound(true);
        setPage(null);
      } else {
        setNotFound(false);
        setPage(data as unknown as CmsPageRow);
      }
    } catch (e) {
      console.error('[CmsPage] fetch failed', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [lookup.column, lookup.value]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetchPage();
  }, [fetchPage]);

  // Live updates: subscribe to changes for this specific row (by slug or path).
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`cms-page:${lookup.column}:${lookup.value}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cms_pages',
          filter: `${lookup.column}=eq.${lookup.value}`,
        },
        () => {
          fetchPage();
        }
      )
      .subscribe();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchPage();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', fetchPage);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', fetchPage);
      safeRemoveChannel(channel);
    };
  }, [lookup.column, lookup.value, fetchPage]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return <NotFound />;
  }

  const ogImage = page.meta?.og_image;
  const ogDescription = page.meta?.og_description ?? page.description ?? undefined;
  const canonical = page.meta?.canonical_url;
  const robots = page.meta?.noindex ? 'noindex,nofollow' : undefined;

  return (
    <>
      <Helmet>
        <title>{`${page.title} | MPB Health`}</title>
        {page.description && <meta name="description" content={page.description} />}
        {ogDescription && <meta property="og:description" content={ogDescription} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:title" content={page.title} />
        <meta property="og:type" content="website" />
        {canonical && <link rel="canonical" href={canonical} />}
        {robots && <meta name="robots" content={robots} />}
      </Helmet>

      <article>
        {(page.sections ?? []).map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </article>
    </>
  );
}
