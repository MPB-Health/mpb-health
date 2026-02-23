-- ============================================================================
-- Migration: Update Advisor Agreement Cognito Form URL
-- Description: Update the Advisor Agreement form to use the 2026 Cognito form
-- ============================================================================

-- Update existing record by label match
UPDATE public.cognito_forms
SET cognito_embed = '<iframe src="https://www.cognitoforms.com/MPoweringBenefits1/HealthcareAdvisorAgreement2026" style="border:0;width:100%" height="1400"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
    updated_at = NOW()
WHERE label ILIKE '%Advisor Agreement%';

-- If no row was updated, insert a new one
INSERT INTO public.cognito_forms (slug, label, category, description, icon, estimated_minutes, cognito_embed, is_active, requires_auth, sort_order, show_in_menu, menu_section)
SELECT '/advisor-agreement/', 'Advisor Agreement', 'advisor', 'Healthcare Advisor Agreement 2026', 'FileText', 10,
       '<iframe src="https://www.cognitoforms.com/MPoweringBenefits1/HealthcareAdvisorAgreement2026" style="border:0;width:100%" height="1400"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
       true, true, 1, true, 'advisor'
WHERE NOT EXISTS (
    SELECT 1 FROM public.cognito_forms WHERE label ILIKE '%Advisor Agreement%'
);
