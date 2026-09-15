-- ============================================================
-- PRE-BASELINE: extensions required by 20260101000001_baseline_schema.sql
-- ============================================================
-- The baseline was produced with `supabase db dump --schema public`, which
-- emits references to the extensions schema but never the CREATE EXTENSION
-- statements themselves. On production that is harmless -- the extensions were
-- already installed -- but a fresh stack (CI, a new local env) failed on
--
--   CREATE INDEX ... USING gin ("name" "extensions"."gin_trgm_ops")
--   ERROR: operator class "extensions.gin_trgm_ops" does not exist
--
-- Every extension call in the baseline is schema-qualified to `extensions`, so
-- install these there to match production, where all three already live.
--
-- This file runs before the baseline and is already marked applied on
-- production, so it never re-runs there; it only repairs fresh environments.
-- ============================================================

-- gin_trgm_ops, used by the crm_* trigram search indexes.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- gen_random_bytes and pgp_sym_encrypt/pgp_sym_decrypt.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- uuid_generate_v4, still used by a few column defaults.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
