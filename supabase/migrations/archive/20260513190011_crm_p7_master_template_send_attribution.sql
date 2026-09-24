ALTER TABLE public.crm_email_log
    ADD COLUMN IF NOT EXISTS master_template_id uuid
        REFERENCES public.crm_master_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_email_log_master_template
    ON public.crm_email_log(master_template_id)
    WHERE master_template_id IS NOT NULL;

COMMENT ON COLUMN public.crm_email_log.master_template_id IS
    'CRM rebuild Section 7 (Round 3 Addendum) - when populated, this email was sent from the Master Template Library (admin-driven mass send). Mutually informative with template_id (per-rep templates).';

ALTER TABLE public.crm_master_templates
    ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

COMMENT ON COLUMN public.crm_master_templates.usage_count IS
    'Total outbound sends that referenced this master template. Bumped by the send-crm-email edge function via crm_master_template_bump_usage().';
COMMENT ON COLUMN public.crm_master_templates.last_used_at IS
    'Most recent send timestamp for this master template.';

CREATE OR REPLACE FUNCTION public.crm_master_template_bump_usage(
    p_template_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.crm_master_templates
       SET usage_count = COALESCE(usage_count, 0) + 1,
           last_used_at = now()
     WHERE id = p_template_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_master_template_bump_usage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_master_template_bump_usage(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.crm_master_template_bump_usage(uuid) IS
    'Bumps usage_count/last_used_at on a master template. Called from send-crm-email edge function after a successful Resend dispatch.';;
