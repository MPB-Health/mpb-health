-- ============================================================================
-- CRM Quote Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_quote_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  layout jsonb NOT NULL DEFAULT '{
    "sections": [
      {"id": "header", "type": "header", "visible": true, "order": 0},
      {"id": "line_items", "type": "line_items", "visible": true, "order": 1},
      {"id": "totals", "type": "totals", "visible": true, "order": 2},
      {"id": "terms", "type": "terms", "visible": true, "order": 3},
      {"id": "signature", "type": "signature", "visible": false, "order": 4},
      {"id": "footer", "type": "footer", "visible": true, "order": 5}
    ]
  }'::jsonb,
  branding jsonb NOT NULL DEFAULT '{
    "logoUrl": null,
    "primaryColor": "#0D9488",
    "accentColor": "#14B8A6",
    "fontFamily": "Inter, sans-serif",
    "headerBgColor": "#F8FAFC",
    "footerText": null
  }'::jsonb,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_quote_templates_org ON public.crm_quote_templates(org_id);
ALTER TABLE public.crm_quote_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_quote_templates_select ON public.crm_quote_templates
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY crm_quote_templates_insert ON public.crm_quote_templates
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY crm_quote_templates_update ON public.crm_quote_templates
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY crm_quote_templates_delete ON public.crm_quote_templates
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
  );
-- Add template_id reference to crm_quotes
ALTER TABLE public.crm_quotes
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.crm_quote_templates(id) ON DELETE SET NULL;
-- Extend crm_web_forms entity_type to support quote_request
-- Drop the old check constraint and add a new one
ALTER TABLE public.crm_web_forms DROP CONSTRAINT IF EXISTS crm_web_forms_entity_type_check;
ALTER TABLE public.crm_web_forms ADD CONSTRAINT crm_web_forms_entity_type_check
  CHECK (entity_type IN ('lead', 'contact', 'quote_request'));
