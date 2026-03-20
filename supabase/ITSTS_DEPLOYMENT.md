# ITSTS User Sync - Deployment Steps

Follow these steps to deploy the advisor-to-ITSTS profile sync.

## Prerequisites

- Supabase CLI installed (`npx supabase` or global install)
- Access to the monorepo Supabase project
- Access to the ITSTS Supabase project (https://support.mpb.health)

## 1. Verify / Set ITSTS Environment Variables

The sync edge functions need two secrets to reach the ITSTS project:

```bash
# Check if they're already set
npx supabase secrets list

# If not set, add them (replace with actual values from the ITSTS project dashboard):
npx supabase secrets set ITSTS_SUPABASE_URL=https://<itsts-project-ref>.supabase.co
npx supabase secrets set ITSTS_SERVICE_ROLE_KEY=<itsts-service-role-key>
```

You can find these values in the ITSTS Supabase project dashboard under
**Settings > API > Project URL** and **Service Role Key**.

## 2. Apply ITSTS Migration (separate project)

### Ticket comment rich text (`content_format`)

Apply `supabase/itsts-migrations/20260321120000_ticket_comment_content_format.sql` to the **ITSTS** project (adds `content_format` on `ticket_comments` for sanitized HTML vs plain text). Deploy this **before** deploying the updated `ticket-proxy` edge function that reads/writes this column.

### Advisor profile fields (legacy section)

The ITSTS `profiles` table needs new columns for rich profile data.
Apply the migration at `supabase/itsts-migrations/20260225100000_add_advisor_profile_fields.sql`
to the ITSTS Supabase project:

```bash
# Option A: Copy to the ITSTS repo and push
cp supabase/itsts-migrations/20260225100000_add_advisor_profile_fields.sql \
   /path/to/ITSTS/supabase/migrations/

cd /path/to/ITSTS
npx supabase db push

# Option B: Run directly via SQL Editor in the ITSTS project dashboard
# Copy the SQL from the migration file and execute it
```

## 3. Push Monorepo Migrations

```bash
# From the monorepo root:
npx supabase db push
```

This applies two migrations:
- `20260224100000_itsts_user_sync_trigger.sql` - trigger on `user_roles` table
- `20260225100000_advisor_profile_itsts_sync_trigger.sql` - trigger on `advisor_profiles` table

## 4. Deploy Edge Functions

```bash
# Deploy all ITSTS-related edge functions:
npx supabase functions deploy sync-user-to-itsts
npx supabase functions deploy bulk-sync-itsts
npx supabase functions deploy sso-itsts-login
npx supabase functions deploy ticket-proxy
npx supabase functions deploy ticket-webhook-receiver

# Also redeploy functions that were updated with rich profile sync:
npx supabase functions deploy create-user
npx supabase functions deploy bulk-create-advisors
```

## 5. Enable rich ticket UI (Admin + Advisor portals)

After migration + `ticket-proxy` are live, set **`VITE_RICH_TICKET_EDITOR=true`** in the build environment for **admin-portal** and **advisor-portal** (Vercel/host env vars). Local `pnpm dev` picks up `apps/*/ .env.development` so the Tiptap editor is on by default in development.

## 6. Bulk Sync Existing Users

After everything is deployed, run the bulk sync to backfill all existing
users into ITSTS (including their advisor profile data):

```bash
# Get your auth token (log in as a super_admin user):
TOKEN="<your-supabase-access-token>"

# Run the bulk sync:
curl -X POST \
  https://hhikjgrttgnvojtunmla.supabase.co/functions/v1/bulk-sync-itsts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

The response will show a summary:
```json
{
  "success": true,
  "summary": { "total": 150, "synced": 142, "skipped": 5, "failed": 3 }
}
```

## What Gets Synced

| Monorepo Field | ITSTS Field | Notes |
|---|---|---|
| email | email | Primary matching key |
| first_name + last_name | full_name | Concatenated |
| user_roles.role | role | Mapped: advisor->advisor, admin->staff, super_admin->admin |
| advisor_profiles.phone | phone | Optional |
| advisor_profiles.specialization | specialization | Optional |
| advisor_profiles.agent_id | agent_id | Optional |
| advisor_profiles.company_name | company_name | Optional |
| advisor_profiles.avatar_url | avatar_url | Optional |

## Sync Triggers

After deployment, sync happens automatically via:

1. **user_roles INSERT/UPDATE** -> `sync_user_to_itsts()` trigger -> edge function
2. **advisor_profiles INSERT/UPDATE** -> `sync_advisor_profile_to_itsts()` trigger -> edge function
3. **create-user / bulk-create-advisors** edge functions -> direct sync call
4. **Password changes** -> sync to keep ITSTS password in sync
