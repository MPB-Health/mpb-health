-- ============================================================================
-- CRM rebuild — seed the MPB Health round-robin pool
--
-- MPB Health has been operating without an active `crm_round_robin_config`
-- row, so Phase 2's insert-time round-robin trigger has been a no-op since
-- the org went live. Combined with the org_id intake bug fixed in
-- 20260620600000, this is why 229 backfilled website leads remained
-- unassigned.
--
-- This migration seeds the pool with the 23 internal `@mympb.com` reps
-- (alphabetical by full_name per operator decision), all `is_active=true /
-- is_paused=false`. `tie_breaking_rule='sequential'` matches the existing
-- trigger logic. `current_position=-1` so the very next pick lands on
-- index 0 (Aba Shihat).
--
-- The companion runtime step — distributing the 229 backfilled leads via
-- `crm_assign_leads_round_robin` — is intentionally NOT included in this
-- migration. That call happens once at the application time of the
-- migration set, after this seed lands. Keeping the data-modifying call
-- out of the migration file means re-applying the migration in a fresh
-- environment won't accidentally fan out assignments against a different
-- dataset.
-- ============================================================================

BEGIN;

INSERT INTO public.crm_round_robin_config (
    org_id,
    is_active,
    pool_members,
    current_position,
    tie_breaking_rule,
    skip_unavailable,
    updated_by
)
VALUES (
    '00000000-0000-4000-a000-000000000001',
    true,
    jsonb_build_array(
        jsonb_build_object('user_id', 'dee104ad-4a2f-4ceb-8113-af6547f79a68', 'email', 'aba@mympb.com',         'name', 'Aba Shihat',                          'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '522d1865-d9d3-4b60-8011-05ae6c529eaa', 'email', 'acelyn@mympb.com',      'name', 'Acelyn Calderon',                     'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'd2a51b74-b97a-4d7a-9805-3407555d7c69', 'email', 'adam@mympb.com',        'name', 'Adam Jordano',                        'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '9b867694-08b1-4046-82d8-72e876e86f84', 'email', 'anita@mympb.com',       'name', 'Anita Federico',                      'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '62486330-2184-47a7-873c-ca04c3528231', 'email', 'bern@mympb.com',        'name', 'Bern Philipp',                        'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '7da9e708-b7c0-4ad4-9363-81db46229d06', 'email', 'caio@mympb.com',        'name', 'Caio Roque',                          'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '3b100ea9-ac42-4650-8a0d-6b2e1be240e5', 'email', 'catherine@mympb.com',   'name', 'Catherine Okubo',                     'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '81add68b-6693-4663-967f-ed85393fed76', 'email', 'claudia@mympb.com',     'name', 'Claudia Okubo',                       'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'e23ce3ee-def8-4bc1-aa54-3496379382f4', 'email', 'eny@mympb.com',         'name', 'Eny Camarago',                        'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '99c61e43-57bb-4d92-bcfb-cae601765380', 'email', 'jacobo@mympb.com',      'name', 'Jacobo Salcedo',                      'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '959f2666-1598-44a9-ac58-b6c386f9d06b', 'email', 'jennifer@mympb.com',    'name', 'Jennifer Thorin',                     'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '06fffeb1-b394-4677-814d-a1fabe69ecfa', 'email', 'joan@mympb.com',        'name', 'Joan Phelps',                         'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'df1e8dfa-983f-4679-9daf-31fd9af3bd80', 'email', 'joelma@mympb.com',      'name', 'Joelma Dos Santos Ferreira Ferreira', 'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '51f11537-6f31-4ecc-af01-6e156c5f49f5', 'email', 'julia@mympb.com',       'name', 'Julia Avalon',                        'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'e7ce38d6-5e33-4a80-9598-7329a9c48a37', 'email', 'kellyf@mympb.com',      'name', 'Kelly Frederickson',                  'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'ad28c94e-d358-47f9-b4b8-9b934178a6c7', 'email', 'kiley@mympb.com',       'name', 'Kiley',                               'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'f675b20d-9a60-40dd-a150-c63c0b7747b7', 'email', 'kirk@mympb.com',        'name', 'Kirk Bennett',                        'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '28cd74c5-c3d4-46ee-9b77-e4be31e1d603', 'email', 'leonardo@mympb.com',    'name', 'Leo Moraes',                          'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '7a2ac4f0-6f95-4105-bd0f-19acf9b0abe4', 'email', 'rebalarney@mympb.com',  'name', 'Reba Larney',                         'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'e2571c35-7c5d-44de-b3cb-f8e5df8431e2', 'email', 'rosana@mympb.com',      'name', 'Rosana Bowman',                       'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'cfba185d-ab5b-42de-a315-a10eeb41e865', 'email', 'ryan@mympb.com',        'name', 'Ryan Cahill',                         'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', 'a90784f5-159d-47c2-9882-76214f502374', 'email', 'vrt@mympb.com',         'name', 'Vinnie',                              'is_active', true, 'is_paused', false),
        jsonb_build_object('user_id', '9fe74bae-2aaf-4602-aaf2-66cd77cff4d8', 'email', 'wendys@mympb.com',      'name', 'Wendy Scipione',                      'is_active', true, 'is_paused', false)
    ),
    -1,
    'sequential',
    true,
    NULL
)
ON CONFLICT DO NOTHING;

COMMIT;
