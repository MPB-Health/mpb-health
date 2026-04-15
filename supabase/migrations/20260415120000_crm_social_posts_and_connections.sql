-- Social hub: scheduled posts + platform connection scaffolding (org-scoped).
-- OAuth tokens must NOT be written from the browser; use Edge Functions + Vault (see mail_accounts pattern).
-- After apply: run `pnpm db:generate` to refresh packages/database types.

-- -----------------------------------------------------------------------------
-- crm_social_posts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  platform text NOT NULL CHECK (
    platform = ANY (
      ARRAY['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok']::text[]
    )
  ),
  post_date date NOT NULL DEFAULT (CURRENT_DATE),
  status text NOT NULL DEFAULT 'scheduled' CHECK (
    status = ANY (ARRAY['draft', 'scheduled', 'published', 'archived']::text[])
  ),
  utm_campaign text,
  notes text,
  linked_campaign_id uuid REFERENCES public.crm_campaigns(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_social_posts_org ON public.crm_social_posts(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_social_posts_post_date ON public.crm_social_posts(post_date);
CREATE INDEX IF NOT EXISTS idx_crm_social_posts_platform ON public.crm_social_posts(org_id, platform);

CREATE OR REPLACE FUNCTION public.update_crm_social_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_social_posts_updated_at ON public.crm_social_posts;
CREATE TRIGGER trg_crm_social_posts_updated_at
  BEFORE UPDATE ON public.crm_social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_crm_social_posts_updated_at();

ALTER TABLE public.crm_social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_social_posts_select ON public.crm_social_posts;
CREATE POLICY crm_social_posts_select ON public.crm_social_posts
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS crm_social_posts_insert ON public.crm_social_posts;
CREATE POLICY crm_social_posts_insert ON public.crm_social_posts
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS crm_social_posts_update ON public.crm_social_posts;
CREATE POLICY crm_social_posts_update ON public.crm_social_posts
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS crm_social_posts_delete ON public.crm_social_posts;
CREATE POLICY crm_social_posts_delete ON public.crm_social_posts
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- crm_social_platform_connections (non-secret config; tokens via Edge Functions only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_social_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (
    provider = ANY (
      ARRAY['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok']::text[]
    )
  ),
  connection_status text NOT NULL DEFAULT 'not_configured' CHECK (
    connection_status = ANY (
      ARRAY[
        'not_configured',
        'pending_oauth',
        'connected',
        'error',
        'disconnected'
      ]::text[]
    )
  ),
  display_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sync_error text,
  last_synced_at timestamptz,
  connected_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_social_platform_connections_org_provider UNIQUE (org_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_crm_social_platform_connections_org
  ON public.crm_social_platform_connections(org_id);

CREATE OR REPLACE FUNCTION public.update_crm_social_platform_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_social_platform_connections_updated_at
  ON public.crm_social_platform_connections;
CREATE TRIGGER trg_crm_social_platform_connections_updated_at
  BEFORE UPDATE ON public.crm_social_platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crm_social_platform_connections_updated_at();

ALTER TABLE public.crm_social_platform_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_social_platform_connections_select ON public.crm_social_platform_connections;
CREATE POLICY crm_social_platform_connections_select ON public.crm_social_platform_connections
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS crm_social_platform_connections_insert ON public.crm_social_platform_connections;
CREATE POLICY crm_social_platform_connections_insert ON public.crm_social_platform_connections
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS crm_social_platform_connections_update ON public.crm_social_platform_connections;
CREATE POLICY crm_social_platform_connections_update ON public.crm_social_platform_connections
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS crm_social_platform_connections_delete ON public.crm_social_platform_connections;
CREATE POLICY crm_social_platform_connections_delete ON public.crm_social_platform_connections
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid())
  );

GRANT ALL ON public.crm_social_posts TO authenticated;
GRANT ALL ON public.crm_social_posts TO service_role;

GRANT ALL ON public.crm_social_platform_connections TO authenticated;
GRANT ALL ON public.crm_social_platform_connections TO service_role;
