-- ============================================================================
-- Migration: Phase 3 CMS columns
-- Description: Add category/tags/duration to advisor_videos, image_url/is_popup
--              to advisor_quick_links, flipbook_url to handbooks
-- ============================================================================

-- ─── advisor_videos: add category, tags, duration ───────────────────────────
ALTER TABLE public.advisor_videos
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'training',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration TEXT;

-- Update existing seeded videos with category/tags/duration
UPDATE public.advisor_videos SET
  category = 'training',
  tags = ARRAY['onboarding', 'landing page', 'advisor tools'],
  duration = '12 min'
WHERE vimeo_id = '1098270274';

UPDATE public.advisor_videos SET
  category = 'training',
  tags = ARRAY['zion', 'contest', 'incentives'],
  duration = '8 min'
WHERE vimeo_id = '1121281554';

UPDATE public.advisor_videos SET
  category = 'marketing',
  tags = ARRAY['overview', 'cost sharing', 'education', 'member-facing'],
  duration = '5 min'
WHERE vimeo_id = '867328836';

UPDATE public.advisor_videos SET
  category = 'marketing',
  tags = ARRAY['spanish', 'multicultural', 'member-facing'],
  duration = '4 min'
WHERE vimeo_id = '999576729';

UPDATE public.advisor_videos SET
  category = 'marketing',
  tags = ARRAY['overview', 'membership', 'benefits', 'member-facing'],
  duration = '6 min'
WHERE vimeo_id = '560882524';

UPDATE public.advisor_videos SET
  category = 'marketing',
  tags = ARRAY['premium care', 'plans', 'member-facing'],
  duration = '7 min'
WHERE vimeo_id = '951207884';

UPDATE public.advisor_videos SET
  category = 'marketing',
  tags = ARRAY['hsa', 'premium', 'plans', 'member-facing'],
  duration = '6 min'
WHERE vimeo_id = '952446997';

UPDATE public.advisor_videos SET
  category = 'marketing',
  tags = ARRAY['app', 'technology', 'member-facing', 'onboarding'],
  duration = '3 min'
WHERE vimeo_id = '889549950';

-- ─── advisor_quick_links: add image_url, is_popup ───────────────────────────
ALTER TABLE public.advisor_quick_links
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_popup BOOLEAN DEFAULT false;

-- Drop old category constraint if it exists, allow 'resource_center'
ALTER TABLE public.advisor_quick_links DROP CONSTRAINT IF EXISTS advisor_quick_links_category_check;

-- Seed the 8 resource center links (from hardcoded QuickLinks.tsx)
INSERT INTO public.advisor_quick_links
  (label, url, icon, description, order_index, is_external, is_active, requires_auth, category, image_url, is_popup)
VALUES
  ('RX, Labs & Imaging Quote', 'https://www.cognitoforms.com/MPoweringBenefits1/RXLabsImagingCustomQuoteRequest2026',
   'Pill', 'Request a custom quote for prescriptions, lab work, and imaging services.',
   100, true, true, false, 'resource_center',
   '/storage/v1/object/public/advisor-documents/quick-link-rx-labs-imaging.png', true),

  ('Laboratory Assist', 'https://laboratoryassist.com/',
   'FlaskConical', 'Nationwide access to affordable diagnostic lab tests.',
   101, true, true, false, 'resource_center',
   '/storage/v1/object/public/advisor-documents/quick-link-lab-assist.png', false),

  ('Find a Provider', 'https://providersearch.multiplan.com/',
   'MapPin', 'Search the MultiPlan network for in-network healthcare providers.',
   102, true, true, false, 'resource_center',
   '/storage/v1/object/public/advisor-documents/quick-link-provider-search.png', false),

  ('Book a Doctor', 'https://www.zocdoc.com/?dd_referrer=',
   'Stethoscope', 'Find and book doctor appointments online through ZocDoc.',
   103, true, true, false, 'resource_center',
   '/storage/v1/object/public/advisor-documents/quick-link-zocdoc.png', false),

  ('Prescription Savings', 'https://www.goodrx.com/',
   'DollarSign', 'Compare prescription drug prices and find discounts with GoodRx.',
   104, true, true, false, 'resource_center',
   '/storage/v1/object/public/advisor-documents/quick-link-goodrx.png', false),

  ('HealthyCare Podcast', 'https://www.youtube.com/@HealthyCarePodcast',
   'Podcast', 'Watch the HealthyCare Podcast for health education and tips.',
   105, true, true, false, 'resource_center',
   '/storage/v1/object/public/advisor-documents/quick-link-healthy-care-podcast.png', false),

  ('MPB Health Channel', 'https://www.youtube.com/@MPBHealth_official',
   'Youtube', 'Visit the official MPB Health YouTube channel for updates and content.',
   106, true, true, false, 'resource_center',
   '/storage/v1/object/public/advisor-documents/quick-link-mpb-health-youtube.png', false),

  ('Preventive Care', 'https://www.healthcare.gov/coverage/preventive-care-benefits/',
   'HeartPulse', 'Learn about preventive health services covered at no cost, including screenings and immunizations.',
   107, true, true, false, 'resource_center',
   '/storage/v1/object/public/advisor-documents/quick-link-preventive-care.png', false)
ON CONFLICT DO NOTHING;

-- ─── handbooks: add flipbook_url for external 3D flip-book links ────────────
ALTER TABLE public.handbooks
  ADD COLUMN IF NOT EXISTS flipbook_url TEXT;

-- Set flipbook URLs for existing handbooks
UPDATE public.handbooks SET flipbook_url = 'https://mpb.health/3d-flip-book/' || slug
WHERE slug IN ('careplus', 'direct-handbook', 'secure-hsa', 'essentials', 'mecessentials-handbook');
