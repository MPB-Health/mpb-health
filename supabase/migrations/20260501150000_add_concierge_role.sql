-- ============================================================================
-- Add 'concierge' to user_role_type so concierge-portal RLS / invites work.
-- The TypeScript admin-portal already accepted this value; the DB enum was
-- missing it, which is why no users with role='concierge' exist today and
-- only super_admin/admin team members can reach the concierge portal.
--
-- ALTER TYPE ... ADD VALUE is kept in its own migration because the new
-- value cannot be referenced inside the transaction that creates it.
-- ============================================================================

ALTER TYPE public.user_role_type ADD VALUE IF NOT EXISTS 'concierge';
