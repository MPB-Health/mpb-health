-- ============================================================================
-- Website homepage SEO — Sprint 1 on-page metadata alignment
-- ============================================================================
-- The Vercel Edge middleware in apps/website/middleware.ts overrides the
-- static <title>, meta description, OG/Twitter tags, and canonical from the
-- `seo_metadata` table for every request, fetching via PostgREST with the
-- anon key. This migration does two things:
--
--   1. Adds a public-read RLS policy on `seo_metadata` so the anon-key
--      middleware fetch can actually return rows. SEO metadata is by
--      definition public (it's rendered into every page's <head> for all
--      visitors), so allowing anonymous SELECT does not leak anything that
--      isn't already on the wire. Write access remains admin-only via the
--      existing "Admins can manage SEO metadata" policy.
--
--   2. Upserts the row for page_path = '/' so the production homepage
--      matches the new on-page SEO copy shipped alongside this migration
--      in apps/website/index.html, apps/website/src/pages/Landing.tsx,
--      and apps/website/src/lib/seoService.ts.
--
-- Idempotent: re-runs are safe — the policy uses DROP IF EXISTS + CREATE,
-- and the upsert uses ON CONFLICT against the UNIQUE constraint on
-- seo_metadata.page_path.
-- ============================================================================

-- 1. Public-read RLS policy ---------------------------------------------------
-- Allows anon (and authenticated) roles to SELECT seo_metadata rows so the
-- Edge middleware can serve admin-managed per-route metadata. Existing
-- admin-only management policies are untouched and continue to gate writes.

DROP POLICY IF EXISTS "Public can view SEO metadata" ON public.seo_metadata;

CREATE POLICY "Public can view SEO metadata"
    ON public.seo_metadata
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. Homepage row upsert ------------------------------------------------------

INSERT INTO public.seo_metadata (
    page_path,
    meta_title,
    meta_description,
    meta_keywords,
    og_title,
    og_description,
    og_image,
    og_type,
    twitter_card,
    twitter_title,
    twitter_description,
    twitter_image,
    canonical_url,
    robots,
    updated_at
)
VALUES (
    '/',
    'Affordable HealthShare Memberships | MPB Health',
    'MPB Health offers flexible, affordable HealthShare memberships for individuals and families. Save on healthcare costs with our community-driven solutions.',
    ARRAY[
        'healthshare memberships',
        'health sharing',
        'healthcare costs',
        'insurance alternative',
        'community health',
        'medical cost sharing',
        'affordable healthcare'
    ]::text[],
    'Affordable HealthShare Memberships | MPB Health',
    'MPB Health offers flexible, affordable HealthShare memberships for individuals and families. Save on healthcare costs with our community-driven solutions.',
    'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
    'website',
    'summary_large_image',
    'Affordable HealthShare Memberships | MPB Health',
    'MPB Health offers flexible, affordable HealthShare memberships for individuals and families. Save on healthcare costs with our community-driven solutions.',
    'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
    'https://mpb.health/',
    'index,follow',
    now()
)
ON CONFLICT (page_path) DO UPDATE SET
    meta_title          = EXCLUDED.meta_title,
    meta_description    = EXCLUDED.meta_description,
    meta_keywords       = EXCLUDED.meta_keywords,
    og_title            = EXCLUDED.og_title,
    og_description      = EXCLUDED.og_description,
    og_image            = EXCLUDED.og_image,
    og_type             = EXCLUDED.og_type,
    twitter_card        = EXCLUDED.twitter_card,
    twitter_title       = EXCLUDED.twitter_title,
    twitter_description = EXCLUDED.twitter_description,
    twitter_image       = EXCLUDED.twitter_image,
    canonical_url       = EXCLUDED.canonical_url,
    robots              = EXCLUDED.robots,
    updated_at          = now();
