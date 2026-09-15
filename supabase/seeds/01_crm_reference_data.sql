-- ============================================================
-- CRM reference data (local + CI only)
-- ============================================================
-- 20260101000001_baseline_schema.sql is a schema-only dump, so a fresh stack
-- comes up with these three lookup tables empty. They are not application
-- data -- they are the controlled vocabularies that lead intake validates
-- against, and three triggers/RPCs fail closed without them:
--
--   crm_lead_source_types  -- submit_public_lead rejects any lead_source not
--                             found here. Empty table => every public lead
--                             submission fails with 'Invalid lead_source',
--                             which is exactly how anon_smoke.sh failed.
--   crm_product_lines      -- crm_validate_deal_product_line rejects unknown
--                             product lines the same way.
--   crm_pipeline_stages    -- crm_lead_workflow_subsection_sync reads
--                             routes_to_subsection to place a lead. Empty
--                             table mis-routes silently rather than erroring.
--
-- Rows mirror production as of 2026-09-15 so local behavior matches live.
-- This runs on `supabase db reset`/`start` only; production already holds
-- these rows and is never touched by a seed file.
--
-- jsonb_populate_recordset maps by column name, so adding a nullable column
-- upstream will not break this seed the way a positional INSERT would.
-- ON CONFLICT DO NOTHING keeps it idempotent across repeated resets.
--
-- One sharp edge: jsonb_populate_recordset emits NULL for any column missing
-- from the JSON, and an explicit NULL overrides the column DEFAULT rather
-- than falling back to it. created_at/updated_at are NOT NULL DEFAULT now(),
-- so they have to be supplied. seed_rows() stamps both onto every object
-- instead of repeating them on each line; keys that do not match a column
-- are ignored, so it is safe to send updated_at to a table without one.
-- ============================================================

CREATE OR REPLACE FUNCTION pg_temp.seed_rows(rows jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT jsonb_agg(
           elem || jsonb_build_object('created_at', now(), 'updated_at', now())
         )
    FROM jsonb_array_elements(rows) AS elem;
$fn$;

-- ------------------------------------------------------------
-- crm_pipeline_stages rows are org-scoped and carry
--   FOREIGN KEY (org_id) REFERENCES orgs(id)
-- so the default org has to exist first. Note this is `orgs`, not the
-- similarly named `organizations` table -- both exist in this schema and
-- the stages FK points at `orgs`. Values match production's row.
-- ------------------------------------------------------------
INSERT INTO public.orgs (id, name, slug, status)
VALUES ('00000000-0000-4000-a000-000000000001', 'MPB Health', 'mpb-health', 'active')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Lead source vocabulary
-- ------------------------------------------------------------
INSERT INTO public.crm_lead_source_types
SELECT * FROM jsonb_populate_recordset(
  NULL::public.crm_lead_source_types,
  pg_temp.seed_rows($json$[
    {"id":"936629cf-3c88-4ab3-a60b-9016a9b970f4","slug":"chamber_bni_sbdc","label":"Chamber/BNI/SBDC","is_active":true,"sort_order":9,"is_self_generated":true},
    {"id":"8bc23f8c-8454-4a2b-8d27-443923cf8f3b","slug":"church_partnership","label":"Church Partnership","is_active":true,"sort_order":7,"is_self_generated":true},
    {"id":"698eb826-7c66-46e7-9265-4b07be402e43","slug":"community","label":"Community","is_active":true,"sort_order":4,"is_self_generated":true},
    {"id":"cb2b1b15-be47-4201-89ca-0f9ae168d82b","slug":"hydration_booth","label":"Hydration Booth","is_active":true,"sort_order":8,"is_self_generated":true},
    {"id":"e566fcd9-7a91-4aaa-a3aa-075cd40ba59d","slug":"inhouse_round_robin","label":"Inhouse (Round-Robin)","is_active":true,"sort_order":6,"is_self_generated":false},
    {"id":"6c4d383f-e807-4f82-b163-ea5013e00fa2","slug":"linkedin","label":"LinkedIn","is_active":true,"sort_order":1,"is_self_generated":true},
    {"id":"a84b7c01-d6e6-413d-bbed-82108f1a76ce","slug":"networking","label":"Networking","is_active":true,"sort_order":2,"is_self_generated":true},
    {"id":"729b5afc-c7c0-4d55-b71a-4e6217834b78","slug":"outside_advisors","label":"Outside Advisors","is_active":true,"sort_order":10,"is_self_generated":false},
    {"id":"61d14f5d-163d-4612-8aa4-1e6270e272fd","slug":"reactivation","label":"Reactivation","is_active":true,"sort_order":5,"is_self_generated":true},
    {"id":"089a418e-8bb7-4405-b3d1-22d95ed01f7d","slug":"referrals","label":"Referrals","is_active":true,"sort_order":3,"is_self_generated":true},
    {"id":"aae8b22b-190f-4e13-b837-d74a21ea3ead","slug":"sunbiz_prospect","label":"sunbiz.org Prospect","is_active":true,"sort_order":11,"is_self_generated":true}
  ]$json$::jsonb))
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Product lines
-- ------------------------------------------------------------
INSERT INTO public.crm_product_lines
SELECT * FROM jsonb_populate_recordset(
  NULL::public.crm_product_lines,
  pg_temp.seed_rows($json$[
    {"id":"53ed10e1-be67-417e-800d-41e95b603f4d","slug":"health_insurance","label":"Health Insurance","org_id":null,"is_active":true,"sort_order":10,"description":"Traditional major-medical / ACA / short-term plans."},
    {"id":"363e7707-2218-4874-bfa4-386678906f3c","slug":"medical_cost_sharing","label":"Medical Cost Sharing","org_id":null,"is_active":true,"sort_order":20,"description":"Faith-based or non-insurance cost-sharing memberships."}
  ]$json$::jsonb))
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Pipeline stages
--
-- The inactive rows (contacted, qualified, proposal, negotiation) are kept
-- deliberately: they are the legacy stage names, still referenced by
-- historical leads, and dropping them here would make local data behave
-- differently from production.
-- ------------------------------------------------------------
INSERT INTO public.crm_pipeline_stages
SELECT * FROM jsonb_populate_recordset(
  NULL::public.crm_pipeline_stages,
  pg_temp.seed_rows($json$[
    {"id":"ca1c92ac-da8c-4163-8151-46fc42241ab8","name":"new","display_name":"New","color":"#3B82F6","org_id":"00000000-0000-4000-a000-000000000001","is_active":true,"sort_order":1,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":"working"},
    {"id":"b82c4939-f702-49aa-9b2d-c3731d74f1df","name":"contacted","display_name":"Contacted","color":"#8B5CF6","org_id":"00000000-0000-4000-a000-000000000001","is_active":false,"sort_order":2,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":null},
    {"id":"0011a1ff-a7b7-489a-9475-2698501eeb46","name":"quoted","display_name":"Quoted","color":"#8B5CF6","org_id":"00000000-0000-4000-a000-000000000001","is_active":true,"sort_order":2,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":"working"},
    {"id":"2840b5c2-7aab-441c-99e2-cfd8e020981e","name":"working","display_name":"Working","color":"#6366F1","org_id":"00000000-0000-4000-a000-000000000001","is_active":true,"sort_order":3,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":"working"},
    {"id":"0ab85804-1cec-40dd-a55e-0ff026b36ef3","name":"qualified","display_name":"Qualified","color":"#10B981","org_id":"00000000-0000-4000-a000-000000000001","is_active":false,"sort_order":3,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":null},
    {"id":"ed9b09a4-06ea-4be1-a96a-b6be007927fa","name":"engaged","display_name":"Engaged / Qualifying","color":"#10B981","org_id":"00000000-0000-4000-a000-000000000001","is_active":true,"sort_order":4,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":"working"},
    {"id":"5f850b72-1fe7-481f-b4ca-423388d98440","name":"proposal","display_name":"Proposal","color":"#F59E0B","org_id":"00000000-0000-4000-a000-000000000001","is_active":false,"sort_order":4,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":null},
    {"id":"f987de30-c667-4c31-a60b-cc49f3ebc469","name":"negotiation","display_name":"Negotiation","color":"#EC4899","org_id":"00000000-0000-4000-a000-000000000001","is_active":false,"sort_order":5,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":null},
    {"id":"56ee5b07-fbc5-4654-8bb5-7e5b10ea969d","name":"application_in_progress","display_name":"Application in Progress","color":"#F59E0B","org_id":"00000000-0000-4000-a000-000000000001","is_active":true,"sort_order":5,"order_index":0,"is_terminal":false,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":"working"},
    {"id":"eef59302-857e-43a7-a9cc-428df7cb6fc9","name":"won","display_name":"Won — Enrolled","color":"#22C55E","org_id":"00000000-0000-4000-a000-000000000001","is_active":true,"sort_order":6,"order_index":0,"is_terminal":true,"is_won_stage":true,"is_lost_stage":false,"routes_to_subsection":"concierge_handoff"},
    {"id":"4c875ecb-b2ab-4cb2-9baa-daff58ae4816","name":"nurture","display_name":"Nurture","color":"#64748B","org_id":"00000000-0000-4000-a000-000000000001","is_active":true,"sort_order":7,"order_index":0,"is_terminal":true,"is_won_stage":false,"is_lost_stage":false,"routes_to_subsection":"nurture"},
    {"id":"c0487cbc-757f-43f1-9787-748b52e54d95","name":"lost","display_name":"Lost","color":"#EF4444","org_id":"00000000-0000-4000-a000-000000000001","is_active":true,"sort_order":8,"order_index":0,"is_terminal":true,"is_won_stage":false,"is_lost_stage":true,"routes_to_subsection":"do_not_contact"}
  ]$json$::jsonb))
ON CONFLICT (id) DO NOTHING;
