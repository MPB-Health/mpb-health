-- ============================================================================
-- Add category column to advisor_quick_links for Advisor Toolkit segmentation
-- Categories: forms, training, news, resources
-- ============================================================================

-- Add category column with check constraint
ALTER TABLE public.advisor_quick_links 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'resources';

-- Add check constraint for valid categories
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'advisor_quick_links_category_check'
    ) THEN
        ALTER TABLE public.advisor_quick_links 
        ADD CONSTRAINT advisor_quick_links_category_check 
        CHECK (category IN ('forms', 'training', 'news', 'resources'));
    END IF;
END $$;

-- Update existing links with appropriate categories based on their labels
UPDATE public.advisor_quick_links SET category = 'forms' 
WHERE label ILIKE '%forms%' AND category = 'resources';

UPDATE public.advisor_quick_links SET category = 'training' 
WHERE (label ILIKE '%training%' OR label ILIKE '%sop%' OR label ILIKE '%university%') 
AND category = 'resources';

UPDATE public.advisor_quick_links SET category = 'news' 
WHERE (label ILIKE '%bulletin%' OR label ILIKE '%news%' OR label ILIKE '%announcement%') 
AND category = 'resources';

-- Resources remains as default for: My Profile, Get Support, Resources, etc.

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_advisor_quick_links_category 
ON public.advisor_quick_links(category);

-- Add comment for documentation
COMMENT ON COLUMN public.advisor_quick_links.category IS 
'Toolkit category: forms (Forms & Documents), training (Training & Education), news (News & Updates), resources (Resources & Tools)';
