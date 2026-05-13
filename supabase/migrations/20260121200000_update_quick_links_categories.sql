-- ============================================================================
-- Update Quick Links Categories for Advisor Toolkit
-- New Categories: sales_tools, member_support, advisor_forms
-- ============================================================================

-- Drop existing check constraint
ALTER TABLE public.advisor_quick_links 
DROP CONSTRAINT IF EXISTS advisor_quick_links_category_check;
-- Clear existing quick links to replace with new structure
DELETE FROM public.advisor_quick_links;
-- Add new check constraint with updated categories
ALTER TABLE public.advisor_quick_links 
ADD CONSTRAINT advisor_quick_links_category_check 
CHECK (category IN ('sales_tools', 'member_support', 'advisor_forms'));
-- Update default value
ALTER TABLE public.advisor_quick_links 
ALTER COLUMN category SET DEFAULT 'sales_tools';
-- ============================================================================
-- Seed Sales Tools (4 links)
-- ============================================================================
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) VALUES
('Current Price Sheets', '#', 'FileSpreadsheet', 'sales_tools', NULL, 1, FALSE, TRUE),
('Cost of MEC', '#', 'Calculator', 'sales_tools', 'Tax Deductible for Employers', 2, FALSE, TRUE),
('Current Promo Videos', '#', 'Video', 'sales_tools', NULL, 3, TRUE, TRUE),
('Brochures & Marketing Materials', '#', 'BookOpen', 'sales_tools', NULL, 4, FALSE, TRUE);
-- ============================================================================
-- Seed Member Support (8 links)
-- ============================================================================
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) VALUES
('Schedule a Welcome Call', '#', 'Calendar', 'member_support', NULL, 1, TRUE, TRUE),
('Welcome Call Webinar Links', '#', 'Video', 'member_support', 'Secure HSA members only', 2, TRUE, TRUE),
('PHCS Network Search', '#', 'Search', 'member_support', NULL, 3, TRUE, TRUE),
('HSA Setup Instructions', '#', 'CreditCard', 'member_support', NULL, 4, FALSE, TRUE),
('Prescription Drug Search', '#', 'Pill', 'member_support', NULL, 5, TRUE, TRUE),
('How to Login to the New App', '#', 'Smartphone', 'member_support', NULL, 6, FALSE, TRUE),
('Find Your Member Card', '#', 'CreditCard', 'member_support', NULL, 7, FALSE, TRUE),
('ACA Wellness Screenings Included', '#', 'Heart', 'member_support', NULL, 8, FALSE, TRUE);
-- ============================================================================
-- Seed Advisor Forms (8 links)
-- ============================================================================
INSERT INTO public.advisor_quick_links (label, url, icon, category, description, order_index, is_external, is_active) VALUES
('Commission Structure', '#', 'DollarSign', 'advisor_forms', NULL, 1, FALSE, TRUE),
('Advisor Agreement', '#', 'FileText', 'advisor_forms', NULL, 2, FALSE, TRUE),
('Enroll E&O', '#', 'Shield', 'advisor_forms', NULL, 3, FALSE, TRUE),
('Media Release Consent', '#', 'Camera', 'advisor_forms', NULL, 4, FALSE, TRUE),
('Referring Individual', '#', 'UserPlus', 'advisor_forms', NULL, 5, FALSE, TRUE),
('Update E&O', '#', 'RefreshCw', 'advisor_forms', NULL, 6, FALSE, TRUE),
('List-Bill Conversion', '#', 'FileCheck', 'advisor_forms', NULL, 7, FALSE, TRUE),
('Advisor Termination Request', '#', 'UserMinus', 'advisor_forms', NULL, 8, FALSE, TRUE);
-- Update column comment
COMMENT ON COLUMN public.advisor_quick_links.category IS 
'Toolkit category: sales_tools (Sales Tools), member_support (Member Support), advisor_forms (Advisor Forms)';
