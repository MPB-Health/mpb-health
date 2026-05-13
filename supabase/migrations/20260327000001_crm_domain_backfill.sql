-- ============================================================================
-- Migration: CRM Domain Backfill
-- Description: Backfills existing lead/contact data into new domain structures.
--              Migrates flat phone fields into crm_phone_numbers, infers
--              plan_type from existing data where possible, and seeds
--              common insurance carriers.
--
-- SAFE: All operations are idempotent (INSERT ... ON CONFLICT DO NOTHING,
--       UPDATE ... WHERE column IS NULL). Can be re-run without side effects.
--
-- ROLLBACK: This migration only inserts new rows and sets previously-NULL
--           columns. To rollback, truncate the new tables and NULL the columns:
--           TRUNCATE crm_phone_numbers, crm_family_members, insurance_carriers CASCADE;
--           UPDATE zoho_lead_submissions SET plan_type = NULL, state = NULL, city = NULL;
--           UPDATE crm_contacts SET plan_type = NULL, state = NULL, city = NULL;
-- ============================================================================

BEGIN;
-- ============================================================================
-- STEP 1: SEED COMMON INSURANCE CARRIERS (org_id = NULL = global defaults)
-- ============================================================================

INSERT INTO public.insurance_carriers (id, org_id, name, slug, carrier_type, sort_order) VALUES
    (gen_random_uuid(), NULL, 'Aetna', 'aetna', 'traditional', 1),
    (gen_random_uuid(), NULL, 'Anthem / Blue Cross Blue Shield', 'anthem-bcbs', 'traditional', 2),
    (gen_random_uuid(), NULL, 'Cigna', 'cigna', 'traditional', 3),
    (gen_random_uuid(), NULL, 'Humana', 'humana', 'traditional', 4),
    (gen_random_uuid(), NULL, 'Kaiser Permanente', 'kaiser-permanente', 'traditional', 5),
    (gen_random_uuid(), NULL, 'Molina Healthcare', 'molina', 'traditional', 6),
    (gen_random_uuid(), NULL, 'UnitedHealthcare', 'unitedhealthcare', 'traditional', 7),
    (gen_random_uuid(), NULL, 'Ambetter', 'ambetter', 'traditional', 8),
    (gen_random_uuid(), NULL, 'Oscar Health', 'oscar-health', 'traditional', 9),
    (gen_random_uuid(), NULL, 'Bright Health', 'bright-health', 'traditional', 10),
    (gen_random_uuid(), NULL, 'Sedera', 'sedera', 'healthshare', 20),
    (gen_random_uuid(), NULL, 'Zion Health', 'zion-health', 'healthshare', 21),
    (gen_random_uuid(), NULL, 'Knew Health', 'knew-health', 'healthshare', 22),
    (gen_random_uuid(), NULL, 'Impact Health Sharing', 'impact-health-sharing', 'healthshare', 23),
    (gen_random_uuid(), NULL, 'Solidarity HealthShare', 'solidarity-healthshare', 'healthshare', 24),
    (gen_random_uuid(), NULL, 'Medi-Share', 'medi-share', 'healthshare', 25),
    (gen_random_uuid(), NULL, 'Christian Healthcare Ministries', 'chm', 'healthshare', 26),
    (gen_random_uuid(), NULL, 'Samaritan Ministries', 'samaritan-ministries', 'healthshare', 27),
    (gen_random_uuid(), NULL, 'Delta Dental', 'delta-dental', 'dental', 40),
    (gen_random_uuid(), NULL, 'Guardian Life', 'guardian-life', 'supplemental', 50),
    (gen_random_uuid(), NULL, 'MetLife', 'metlife', 'supplemental', 51),
    (gen_random_uuid(), NULL, 'Aflac', 'aflac', 'supplemental', 52),
    (gen_random_uuid(), NULL, 'VSP Vision', 'vsp-vision', 'vision', 60)
ON CONFLICT DO NOTHING;
-- Allow global carriers (org_id IS NULL) to be read by anyone authenticated
-- Drop first to avoid duplicate policy errors on re-run
DROP POLICY IF EXISTS insurance_carriers_global_select ON public.insurance_carriers;
CREATE POLICY insurance_carriers_global_select ON public.insurance_carriers
    FOR SELECT TO authenticated
    USING (org_id IS NULL);
-- ============================================================================
-- STEP 2: BACKFILL PHONE NUMBERS FROM LEADS
-- Migrates the flat phone column into the normalized crm_phone_numbers table.
-- ============================================================================

INSERT INTO public.crm_phone_numbers (org_id, owner_type, owner_id, phone_number, phone_type, is_primary)
SELECT
    l.org_id,
    'lead',
    l.id,
    l.phone,
    'mobile',
    true
FROM public.zoho_lead_submissions l
WHERE l.phone IS NOT NULL
  AND l.phone != ''
  AND l.org_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.crm_phone_numbers pn
      WHERE pn.owner_type = 'lead' AND pn.owner_id = l.id
  );
-- ============================================================================
-- STEP 3: BACKFILL PHONE NUMBERS FROM CONTACTS
-- Migrates phone + mobile into separate normalized rows.
-- ============================================================================

INSERT INTO public.crm_phone_numbers (org_id, owner_type, owner_id, phone_number, phone_type, is_primary)
SELECT
    c.org_id,
    'contact',
    c.id,
    c.phone,
    'work',
    true
FROM public.crm_contacts c
WHERE c.phone IS NOT NULL
  AND c.phone != ''
  AND NOT EXISTS (
      SELECT 1 FROM public.crm_phone_numbers pn
      WHERE pn.owner_type = 'contact' AND pn.owner_id = c.id AND pn.phone_number = c.phone
  );
INSERT INTO public.crm_phone_numbers (org_id, owner_type, owner_id, phone_number, phone_type, is_primary)
SELECT
    c.org_id,
    'contact',
    c.id,
    c.mobile,
    'mobile',
    (c.phone IS NULL OR c.phone = '')
FROM public.crm_contacts c
WHERE c.mobile IS NOT NULL
  AND c.mobile != ''
  AND NOT EXISTS (
      SELECT 1 FROM public.crm_phone_numbers pn
      WHERE pn.owner_type = 'contact' AND pn.owner_id = c.id AND pn.phone_number = c.mobile
  );
-- ============================================================================
-- STEP 4: INFER plan_type FROM current_insurance WHERE POSSIBLE
-- Best-effort: known healthshare keywords → healthshare; known carrier keywords → traditional
-- Only sets plan_type where it is currently NULL.
-- ============================================================================

UPDATE public.zoho_lead_submissions
SET plan_type = 'healthshare'
WHERE plan_type IS NULL
  AND current_insurance IS NOT NULL
  AND (
      lower(current_insurance) LIKE '%sedera%'
      OR lower(current_insurance) LIKE '%zion%'
      OR lower(current_insurance) LIKE '%knew health%'
      OR lower(current_insurance) LIKE '%impact health%'
      OR lower(current_insurance) LIKE '%solidarity%'
      OR lower(current_insurance) LIKE '%medi-share%'
      OR lower(current_insurance) LIKE '%medishare%'
      OR lower(current_insurance) LIKE '%christian healthcare%'
      OR lower(current_insurance) LIKE '%samaritan%'
      OR lower(current_insurance) LIKE '%healthshare%'
      OR lower(current_insurance) LIKE '%health share%'
      OR lower(current_insurance) LIKE '%sharing%'
  );
UPDATE public.zoho_lead_submissions
SET plan_type = 'traditional_insurance'
WHERE plan_type IS NULL
  AND current_insurance IS NOT NULL
  AND (
      lower(current_insurance) LIKE '%aetna%'
      OR lower(current_insurance) LIKE '%anthem%'
      OR lower(current_insurance) LIKE '%bcbs%'
      OR lower(current_insurance) LIKE '%blue cross%'
      OR lower(current_insurance) LIKE '%cigna%'
      OR lower(current_insurance) LIKE '%humana%'
      OR lower(current_insurance) LIKE '%kaiser%'
      OR lower(current_insurance) LIKE '%united%'
      OR lower(current_insurance) LIKE '%ambetter%'
      OR lower(current_insurance) LIKE '%oscar%'
      OR lower(current_insurance) LIKE '%molina%'
      OR lower(current_insurance) LIKE '%marketplace%'
      OR lower(current_insurance) LIKE '%aca%'
      OR lower(current_insurance) LIKE '%medicaid%'
      OR lower(current_insurance) LIKE '%medicare%'
  );
-- ============================================================================
-- STEP 5: BACKFILL STATE FROM ZIP CODE (mailing_address) ON CONTACTS
-- Pulls state from the mailing_address JSONB if present and state column is NULL.
-- ============================================================================

UPDATE public.crm_contacts
SET state = mailing_address->>'state'
WHERE state IS NULL
  AND mailing_address->>'state' IS NOT NULL
  AND mailing_address->>'state' != '';
UPDATE public.crm_contacts
SET city = mailing_address->>'city'
WHERE city IS NULL
  AND mailing_address->>'city' IS NOT NULL
  AND mailing_address->>'city' != '';
-- ============================================================================
-- STEP 6: BACKFILL SEARCH VECTORS FOR FAMILY MEMBERS (in case any were
-- inserted before the trigger was created — defensive no-op if empty)
-- ============================================================================

UPDATE public.crm_family_members
SET first_name = first_name
WHERE search_vector IS NULL;
COMMIT;
