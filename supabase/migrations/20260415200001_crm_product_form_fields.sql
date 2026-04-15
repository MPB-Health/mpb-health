-- ============================================================================
-- CRM Product Configuration Form Fields & Quote Line Item Answers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_product_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.crm_products(id) ON DELETE CASCADE,
  field_type text NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'hidden', 'heading', 'paragraph')),
  label text NOT NULL,
  placeholder text,
  required boolean NOT NULL DEFAULT false,
  options jsonb DEFAULT '[]'::jsonb,
  validation jsonb DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_product_form_fields_product ON public.crm_product_form_fields(product_id);
CREATE INDEX IF NOT EXISTS idx_crm_product_form_fields_org ON public.crm_product_form_fields(org_id);

ALTER TABLE public.crm_product_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_product_form_fields_select ON public.crm_product_form_fields
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY crm_product_form_fields_insert ON public.crm_product_form_fields
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY crm_product_form_fields_update ON public.crm_product_form_fields
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY crm_product_form_fields_delete ON public.crm_product_form_fields
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
  );

-- Quote Line Item Answers
CREATE TABLE IF NOT EXISTS public.crm_quote_line_item_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_item_id uuid NOT NULL REFERENCES public.crm_quote_line_items(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.crm_product_form_fields(id) ON DELETE CASCADE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_quote_line_item_answers_li ON public.crm_quote_line_item_answers(line_item_id);

ALTER TABLE public.crm_quote_line_item_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_quote_line_item_answers_select ON public.crm_quote_line_item_answers
  FOR SELECT USING (
    line_item_id IN (
      SELECT li.id FROM public.crm_quote_line_items li
      JOIN public.crm_quotes q ON q.id = li.quote_id
      WHERE q.org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
    )
  );

CREATE POLICY crm_quote_line_item_answers_insert ON public.crm_quote_line_item_answers
  FOR INSERT WITH CHECK (
    line_item_id IN (
      SELECT li.id FROM public.crm_quote_line_items li
      JOIN public.crm_quotes q ON q.id = li.quote_id
      WHERE q.org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
    )
  );

CREATE POLICY crm_quote_line_item_answers_update ON public.crm_quote_line_item_answers
  FOR UPDATE USING (
    line_item_id IN (
      SELECT li.id FROM public.crm_quote_line_items li
      JOIN public.crm_quotes q ON q.id = li.quote_id
      WHERE q.org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
    )
  );

CREATE POLICY crm_quote_line_item_answers_delete ON public.crm_quote_line_item_answers
  FOR DELETE USING (
    line_item_id IN (
      SELECT li.id FROM public.crm_quote_line_items li
      JOIN public.crm_quotes q ON q.id = li.quote_id
      WHERE q.org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND status = 'active')
    )
  );
