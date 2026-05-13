-- ============================================================================
-- Migration: Add Menu Visibility Fields to Cognito Forms
-- Description: Allow forms to appear in navigation menus
-- ============================================================================

-- Add new columns for menu visibility
ALTER TABLE public.cognito_forms 
ADD COLUMN IF NOT EXISTS show_in_menu BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS menu_section TEXT DEFAULT 'member-forms',
ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 99;
-- Create index for menu queries
CREATE INDEX IF NOT EXISTS idx_cognito_forms_menu ON public.cognito_forms(show_in_menu, menu_section, menu_order);
-- Update existing forms to show in menu based on category
UPDATE public.cognito_forms 
SET show_in_menu = true,
    menu_section = CASE 
        WHEN slug IN ('/membership-changes/', '/update-form-of-payment/', '/dependent-over-18-information/', '/refer-a-friend/', '/review-us/') THEN 'member-forms'
        WHEN slug IN ('/permission-to-discuss-plan/', '/request-rx-quote/', '/request-to-schedule-an-appointment/', '/cancel-membership/') THEN 'requests-scheduling'
        WHEN slug IN ('/schedule-a-call/', '/welcome-call-survey/') THEN 'onboarding'
        WHEN category = 'employer' THEN 'employer-forms'
        ELSE 'member-forms'
    END,
    menu_order = sort_order
WHERE is_active = true AND cognito_embed IS NOT NULL AND cognito_embed != '';
-- Add comment for documentation
COMMENT ON COLUMN public.cognito_forms.show_in_menu IS 'Whether this form appears in the navigation mega menu';
COMMENT ON COLUMN public.cognito_forms.menu_section IS 'Which section of the mega menu to display in: member-forms, requests-scheduling, onboarding, employer-forms';
COMMENT ON COLUMN public.cognito_forms.menu_order IS 'Order within the menu section';
