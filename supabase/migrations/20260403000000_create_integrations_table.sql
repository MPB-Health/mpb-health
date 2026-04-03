-- Create the integrations table for admin-portal settings management.
-- Mirrors the Integration type in packages/admin-core/src/types.ts.

CREATE TABLE IF NOT EXISTS "public"."integrations" (
    "id"            uuid DEFAULT gen_random_uuid() NOT NULL,
    "name"          text NOT NULL,
    "type"          text NOT NULL
                        CHECK ("type" IN ('zoho', 'mailchimp', 'stripe', 'twilio', 'cognito', 'other')),
    "status"        text NOT NULL DEFAULT 'inactive'
                        CHECK ("status" IN ('active', 'inactive', 'error')),
    "config"        jsonb NOT NULL DEFAULT '{}'::jsonb,
    "last_sync_at"  timestamptz,
    "error_message" text,
    "created_at"    timestamptz DEFAULT now() NOT NULL,
    "updated_at"    timestamptz DEFAULT now() NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."integrations" OWNER TO "postgres";

-- Indexes
CREATE INDEX "idx_integrations_type"   ON "public"."integrations" USING btree ("type");
CREATE INDEX "idx_integrations_status" ON "public"."integrations" USING btree ("status");

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.update_integrations_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_integrations_updated_at
    BEFORE UPDATE ON "public"."integrations"
    FOR EACH ROW
    EXECUTE FUNCTION public.update_integrations_updated_at();

-- ==========================================================================
-- RLS — follows the same admin-only pattern as system_settings
-- ==========================================================================
ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;

-- Admins / superadmins / staff can read all integrations
CREATE POLICY "Admins can view integrations"
    ON "public"."integrations"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role IN ('admin', 'superadmin', 'staff')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = (SELECT auth.uid())
              AND user_roles.role IN ('super_admin', 'admin')
        )
    );

-- Only admins / superadmins can insert
CREATE POLICY "Admins can create integrations"
    ON "public"."integrations"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role IN ('admin', 'superadmin')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = (SELECT auth.uid())
              AND user_roles.role IN ('super_admin', 'admin')
        )
    );

-- Only admins / superadmins can update
CREATE POLICY "Admins can update integrations"
    ON "public"."integrations"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role IN ('admin', 'superadmin')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = (SELECT auth.uid())
              AND user_roles.role IN ('super_admin', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role IN ('admin', 'superadmin')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = (SELECT auth.uid())
              AND user_roles.role IN ('super_admin', 'admin')
        )
    );

-- Only admins / superadmins can delete
CREATE POLICY "Admins can delete integrations"
    ON "public"."integrations"
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role IN ('admin', 'superadmin')
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = (SELECT auth.uid())
              AND user_roles.role IN ('super_admin', 'admin')
        )
    );

-- Service role gets full access (edge functions, cron, etc.)
GRANT ALL ON TABLE "public"."integrations" TO "service_role";
GRANT ALL ON TABLE "public"."integrations" TO "authenticated";
