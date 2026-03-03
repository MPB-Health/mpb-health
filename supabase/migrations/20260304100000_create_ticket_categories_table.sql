-- Managed ticket categories for the admin portal.
-- Previously tickets used freeform category strings; this table adds
-- structured categories that admins can manage via the Settings UI.

CREATE TABLE IF NOT EXISTS public.ticket_categories (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL UNIQUE,
  slug         TEXT        NOT NULL UNIQUE,
  description  TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  display_order INTEGER    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active categories (needed for ticket creation form)
CREATE POLICY "Authenticated users can read ticket_categories"
  ON public.ticket_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins and super_admins can manage categories
CREATE POLICY "Admins can manage ticket_categories"
  ON public.ticket_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_ticket_categories_display_order
  ON public.ticket_categories (display_order);

-- Seed common default categories
INSERT INTO public.ticket_categories (name, slug, description, display_order) VALUES
  ('General Inquiry',  'general-inquiry',  'General questions and information requests',     0),
  ('Technical Issue',  'technical-issue',  'Platform or technical problems',                  1),
  ('Enrollment',       'enrollment',       'Questions about member enrollment or eligibility', 2),
  ('Commission',       'commission',       'Commission tracking and payment questions',        3),
  ('Training',         'training',         'Training module or certification questions',       4),
  ('Compliance',       'compliance',       'Regulatory and compliance inquiries',              5)
ON CONFLICT (slug) DO NOTHING;
