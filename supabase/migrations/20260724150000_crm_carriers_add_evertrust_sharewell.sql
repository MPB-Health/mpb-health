-- ============================================================================
-- Expand active healthshare carriers: Zion, Sedera, EverTrust, ShareWell
-- ============================================================================
-- Extends 20260620560000 (Zion + Sedera only) so CRM Lead Carrier dropdown
-- and global insurance_carriers include EverTrust and ShareWell.
-- ============================================================================

BEGIN;

-- Keep only the four active healthshare partners as global carriers.
UPDATE public.insurance_carriers
   SET is_active = false,
       updated_at = now()
 WHERE org_id IS NULL
   AND slug NOT IN ('sedera', 'zion-health', 'evertrust', 'sharewell');

-- Re-assert Zion + Sedera (stable sort order)
UPDATE public.insurance_carriers
   SET is_active = true,
       sort_order = 1,
       carrier_type = 'healthshare',
       name = 'Sedera',
       website_url = COALESCE(website_url, 'https://sedera.com/'),
       updated_at = now()
 WHERE org_id IS NULL AND slug = 'sedera';

INSERT INTO public.insurance_carriers (org_id, name, slug, carrier_type, sort_order, is_active, website_url)
SELECT NULL, 'Sedera', 'sedera', 'healthshare', 1, true, 'https://sedera.com/'
 WHERE NOT EXISTS (
     SELECT 1 FROM public.insurance_carriers
      WHERE org_id IS NULL AND slug = 'sedera'
 );

UPDATE public.insurance_carriers
   SET is_active = true,
       sort_order = 2,
       carrier_type = 'healthshare',
       name = 'Zion Health',
       website_url = COALESCE(website_url, 'https://zionhealthshare.org/'),
       updated_at = now()
 WHERE org_id IS NULL AND slug = 'zion-health';

INSERT INTO public.insurance_carriers (org_id, name, slug, carrier_type, sort_order, is_active, website_url)
SELECT NULL, 'Zion Health', 'zion-health', 'healthshare', 2, true, 'https://zionhealthshare.org/'
 WHERE NOT EXISTS (
     SELECT 1 FROM public.insurance_carriers
      WHERE org_id IS NULL AND slug = 'zion-health'
 );

-- EverTrust
UPDATE public.insurance_carriers
   SET is_active = true,
       sort_order = 3,
       carrier_type = 'healthshare',
       name = 'EverTrust',
       website_url = 'https://evertrusthealth.org/',
       updated_at = now()
 WHERE org_id IS NULL AND slug = 'evertrust';

INSERT INTO public.insurance_carriers (org_id, name, slug, carrier_type, sort_order, is_active, website_url)
SELECT NULL, 'EverTrust', 'evertrust', 'healthshare', 3, true, 'https://evertrusthealth.org/'
 WHERE NOT EXISTS (
     SELECT 1 FROM public.insurance_carriers
      WHERE org_id IS NULL AND slug = 'evertrust'
 );

-- ShareWell
UPDATE public.insurance_carriers
   SET is_active = true,
       sort_order = 4,
       carrier_type = 'healthshare',
       name = 'ShareWell',
       website_url = 'https://sharewellhealth.org/',
       updated_at = now()
 WHERE org_id IS NULL AND slug = 'sharewell';

INSERT INTO public.insurance_carriers (org_id, name, slug, carrier_type, sort_order, is_active, website_url)
SELECT NULL, 'ShareWell', 'sharewell', 'healthshare', 4, true, 'https://sharewellhealth.org/'
 WHERE NOT EXISTS (
     SELECT 1 FROM public.insurance_carriers
      WHERE org_id IS NULL AND slug = 'sharewell'
 );

COMMIT;
