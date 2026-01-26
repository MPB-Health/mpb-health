-- ============================================================================
-- Migration: Cognito Forms CMS
-- Description: Create table for managing Cognito Forms dynamically from admin
-- ============================================================================

-- Create the cognito_forms table
CREATE TABLE IF NOT EXISTS public.cognito_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('employer', 'member')),
    description TEXT,
    icon TEXT DEFAULT 'FileText',
    estimated_minutes INTEGER DEFAULT 5,
    cognito_embed TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cognito_forms_slug ON public.cognito_forms(slug);
CREATE INDEX IF NOT EXISTS idx_cognito_forms_category ON public.cognito_forms(category);
CREATE INDEX IF NOT EXISTS idx_cognito_forms_active ON public.cognito_forms(is_active);

-- Enable RLS
ALTER TABLE public.cognito_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to read active forms (for public form pages)
DROP POLICY IF EXISTS "Allow public read active cognito_forms" ON public.cognito_forms;
CREATE POLICY "Allow public read active cognito_forms" 
    ON public.cognito_forms 
    FOR SELECT 
    USING (is_active = true);

-- Allow authenticated users to read all forms (for admin)
DROP POLICY IF EXISTS "Allow authenticated read all cognito_forms" ON public.cognito_forms;
CREATE POLICY "Allow authenticated read all cognito_forms" 
    ON public.cognito_forms 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert forms
DROP POLICY IF EXISTS "Allow authenticated insert cognito_forms" ON public.cognito_forms;
CREATE POLICY "Allow authenticated insert cognito_forms" 
    ON public.cognito_forms 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow authenticated users to update forms
DROP POLICY IF EXISTS "Allow authenticated update cognito_forms" ON public.cognito_forms;
CREATE POLICY "Allow authenticated update cognito_forms" 
    ON public.cognito_forms 
    FOR UPDATE 
    TO authenticated 
    USING (true);

-- Allow authenticated users to delete forms
DROP POLICY IF EXISTS "Allow authenticated delete cognito_forms" ON public.cognito_forms;
CREATE POLICY "Allow authenticated delete cognito_forms" 
    ON public.cognito_forms 
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_cognito_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cognito_forms_updated_at ON public.cognito_forms;
CREATE TRIGGER trigger_cognito_forms_updated_at
    BEFORE UPDATE ON public.cognito_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_cognito_forms_updated_at();

-- Seed with existing forms from config
INSERT INTO public.cognito_forms (slug, label, category, description, icon, estimated_minutes, cognito_embed, is_active, requires_auth, sort_order) VALUES
    ('/list-bill-setup/', 'List-Bill Setup', 'employer', 'Set up list-billing for your organization', 'Briefcase', 10, '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/343" allow="payment" style="border:0;width:100%" height="1540"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>', true, false, 1),
    ('/list-bill-conversion/', 'List-Bill Conversion', 'employer', 'Convert your billing to list-bill format', 'RefreshCw', 10, '', true, false, 2),
    ('/list-bill-update/', 'List-Bill Update', 'employer', 'Update your list-billing information', 'Edit', 5, '', true, false, 3),
    ('/employee-removal/', 'Employee Removal', 'employer', 'Process employee removal from plan', 'UserMinus', 5, '', true, false, 4),
    ('/adult-dependent-information/', 'Adult Dependent Information', 'member', 'Add or update adult dependent information', 'Users', 8, '', true, false, 5),
    ('/permission-to-discuss-plan/', 'Authorization to Share Information', 'member', 'Grant permission to discuss your plan details', 'Shield', 3, '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="405"></script>', true, false, 6),
    ('/cancel-membership/', 'Cancel Membership', 'member', 'Submit a membership cancellation request', 'XCircle', 5, '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/20" allow="payment" style="border:0;width:100%;" height="1979"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>', true, false, 7),
    ('/member-feedback/', 'Member Feedback', 'member', 'Share your experience and suggestions', 'MessageSquare', 5, '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/425" allow="payment" style="border:0;width:100%" height="685"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>', true, false, 8),
    ('/membership-changes/', 'Member Updates', 'member', 'Update your membership information', 'Edit3', 7, '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="411"></script>', true, false, 9),
    ('/refer-a-friend/', 'Refer a Friend', 'member', 'Refer someone to MPB Health', 'UserPlus', 5, '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="395"></script>', true, false, 10),
    ('/healthcare-advisor-review-change/', 'Review or Change Healthcare Advisor', 'member', 'Update your healthcare advisor preferences', 'UserCheck', 5, '', true, false, 11),
    ('/request-rx-quote/', 'Request RX Quote', 'member', 'Get a quote for prescription medications', 'Pill', 5, '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="421"></script>', true, false, 12),
    ('/request-to-schedule-an-appointment/', 'Request to Schedule an Appointment', 'member', 'Schedule an appointment with our team', 'Calendar', 5, '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="420"></script>', true, false, 13),
    ('/update-form-of-payment/', 'Update Form of Payment', 'member', 'Update your payment method', 'CreditCard', 5, '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="347"></script>', true, false, 14),
    ('/dependent-over-18-information/', 'Dependent Over 18 Information', 'member', 'Provide information for dependents over 18 years old', 'UserPlus', 5, '<iframe src="https://www.cognitoforms.com/MPoweringBenefits1/DependentOver18Information" style="border:0;width:100%" height="800"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>', true, false, 15),
    ('/welcome-call-survey/', 'Welcome Call Survey', 'member', 'Complete your welcome call survey', 'Phone', 5, '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/134" allow="payment" style="border:0;width:100%" height="800"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>', true, false, 16)
ON CONFLICT (slug) DO UPDATE SET
    label = EXCLUDED.label,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    estimated_minutes = EXCLUDED.estimated_minutes,
    cognito_embed = COALESCE(NULLIF(public.cognito_forms.cognito_embed, ''), EXCLUDED.cognito_embed),
    updated_at = NOW();

-- Grant permissions
GRANT SELECT ON public.cognito_forms TO anon;
GRANT ALL ON public.cognito_forms TO authenticated;

