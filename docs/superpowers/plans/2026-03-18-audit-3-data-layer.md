# Audit Sub-Plan 3: Data Layer & Edge Functions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find and fix every mismatch between frontend data access and the actual Supabase schema: missing tables/views, stale RPC signatures, RLS policy gaps, query field mismatches, and edge function contract failures.

**Architecture:** Two Supabase projects. Primary (`dtmnkzllidaiqyheguhl`) hosts all app data + advisor data + 264 migrations. Secondary (`hhikjgrttgnvojtunmla` = ITSTS) holds ticket data. `ticket-proxy` edge function bridges them. All schema changes must be delivered as migration files.

**Tech Stack:** PostgreSQL (Supabase), Row Level Security, Edge Functions (Deno/TypeScript), `@mpbhealth/database` types, supabase-js v2, React Query wrappers in `@mpbhealth/database`.

---

## Supabase Projects

| Project | ID | Role |
|---------|----|------|
| Primary | `dtmnkzllidaiqyheguhl` | Advisor portal, Admin portal, CRM, Website |
| ITSTS | `hhikjgrttgnvojtunmla` | IT ticketing backend |

---

## Files in Scope

- `packages/database/src/types/database.ts` — auto-generated types
- `packages/database/src/` — query hooks, client, helpers
- `supabase/migrations/` — all 264 primary migrations (read most recent 20)
- `supabase/itsts-migrations/` — ITSTS migrations
- `supabase/functions/ticket-proxy/index.ts` — main integration
- `supabase/functions/_shared/security.ts` — JWT + RBAC
- `supabase/functions/_shared/itsts-sync.ts` — ITSTS sync
- `supabase/functions/send-ticket-notification/index.ts`
- `apps/advisor-portal/src/` — all ticket/notification queries
- `apps/admin-portal/src/` — ticket management queries

---

## Task 1: Audit ticket-proxy Against Current Schema

The ticket-proxy is the highest-risk edge function. Audit every case.

- [ ] **Step 1: Read ticket-proxy in full**

```bash
cat supabase/functions/ticket-proxy/index.ts
```

Map every case handler:
- `create` — what fields it sends to ITSTS, what it expects back
- `create_for_advisor` — how it differs from create
- `get` — fields it selects from ITSTS
- `list` — pagination params, filters, sort
- `update_status` — valid statuses it accepts
- `add_reply` — reply body structure
- `get_stats` — aggregation query

- [ ] **Step 2: Verify ITSTS schema matches ticket-proxy queries**

Run against ITSTS project (`hhikjgrttgnvojtunmla`):

```sql
-- Check tickets table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tickets'
ORDER BY ordinal_position;

-- Check ticket_replies schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ticket_replies'
ORDER BY ordinal_position;

-- Check profiles schema (for agent_id)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
```

For each query in ticket-proxy, verify every referenced column exists.

- [ ] **Step 3: Verify ticket_origin enum values**

```sql
-- Run against ITSTS
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'ticket_origin';
```

Expected: `member`, `advisor`, `staff`, `concierge`. If enum doesn't exist or has wrong values → ticket creation fails.

- [ ] **Step 4: Check for missing columns referenced in ticket-proxy**

Cross-reference every field name in ticket-proxy's insert/select queries against ITSTS schema from Step 2. Document any that are missing.

- [ ] **Step 5: Create ITSTS migration for any missing columns**

Create file: `supabase/itsts-migrations/YYYYMMDD_fix_missing_columns.sql`

```sql
-- Example: if ticket_reply.attachment_urls is missing
ALTER TABLE ticket_replies
ADD COLUMN IF NOT EXISTS attachment_urls text[] DEFAULT '{}';

-- Example: if tickets.priority is missing
DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS priority ticket_priority DEFAULT 'medium';
```

- [ ] **Step 6: Verify agent_id fetch flow**

In ticket-proxy, before creating a ticket, it fetches `agent_id` from ITSTS `profiles`:

```typescript
// Verify this exact query exists and is correct
const { data: profile } = await itsts.from('profiles')
  .select('agent_id')
  .eq('user_id', userId)  // or .eq('id', userId)
  .single()
```

If `user_id` vs `id` is wrong → `agent_id` is null → ticket creation fails silently.

- [ ] **Step 7: Verify ticket_stats RPC exists in ITSTS**

```sql
-- Run against ITSTS
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE '%ticket%';
```

The `get_stats` case calls an RPC. Verify it exists and matches the call signature.

- [ ] **Step 8: Deploy any ITSTS migrations**

Apply migrations to `hhikjgrttgnvojtunmla`:
```bash
supabase db push --project-ref hhikjgrttgnvojtunmla
```

Or use Supabase MCP to apply migrations directly.

- [ ] **Step 9: Commit**

```bash
git add supabase/itsts-migrations/ supabase/functions/ticket-proxy/
git commit -m "fix(data): align ticket-proxy queries with ITSTS schema, add missing columns"
```

---

## Task 2: Audit Primary Schema Against App Queries

- [ ] **Step 1: Read the most recent 20 primary migrations**

```bash
ls -t supabase/migrations/ | head -20
cat supabase/migrations/<most_recent_5>.sql
```

Note tables/views/RPCs added or modified recently that app code might reference.

- [ ] **Step 2: Extract all table/view names referenced in app code**

```bash
grep -r '\.from\(' apps/ packages/database/src/ --include="*.ts" --include="*.tsx" | grep -oP "\.from\(['\"](\w+)['\"]\)" | sort -u
```

For each table/view name found, verify it exists in the primary schema:

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

- [ ] **Step 3: Check for stale view references**

Views are particularly risky — they're referenced like tables but can be dropped without app-level errors until runtime:

```bash
grep -r 'meeting_attendees\|ticket_categories\|contact_directory' --include="*.ts" --include="*.tsx" apps/ packages/
```

Verify each view exists and has the columns being selected.

- [ ] **Step 4: Audit RPC calls**

```bash
grep -r '\.rpc\(' apps/ packages/database/src/ --include="*.ts" --include="*.tsx" | grep -oP "\.rpc\(['\"](\w+)['\"]\)" | sort -u
```

For each RPC name, verify it exists:

```sql
SELECT routine_name, routine_type, specific_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

- [ ] **Step 5: Check for column drift in frequent queries**

Focus on high-traffic queries in advisor portal:

```bash
cat apps/advisor-portal/src/pages/TicketList.tsx
cat apps/advisor-portal/src/pages/TicketDetail.tsx
cat apps/advisor-portal/src/pages/NewTicket.tsx
```

For each `.select()` call, verify every field listed exists in the table.

- [ ] **Step 6: Add migrations for any missing schema objects**

Create: `supabase/migrations/YYYYMMDD_fix_missing_schema.sql`

Apply via:
```bash
supabase db push --project-ref dtmnkzllidaiqyheguhl
```

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/
git commit -m "fix(data): add migrations for missing schema objects referenced by app code"
```

---

## Task 3: Audit RLS Policies

RLS is the production access control layer. Wrong policies = data leakage or broken functionality.

- [ ] **Step 1: List all RLS policies on high-risk tables**

Run against primary project:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Focus on tables: `profiles`, `advisors`, `members`, `tickets` (if any in primary), `audit_logs`, `notifications`, `bulletin_notifications`.

- [ ] **Step 2: Check for advisor-visible-to-self policies**

An advisor should only see THEIR own profile, tickets, and notifications:

```sql
-- Example expected policy on profiles table
CREATE POLICY "Advisors can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

If the policy uses `auth.uid() = user_id` but the column is actually `id` → every advisor gets denied.

- [ ] **Step 3: Check for admin override policies**

Admin users (role = 'admin' or 'superadmin') should bypass restrictive RLS:

```sql
-- Check if admin bypass policy exists
SELECT policyname FROM pg_policies
WHERE tablename = 'profiles' AND policyname ILIKE '%admin%';
```

If missing → admin portal can't read advisor profiles → broken.

- [ ] **Step 4: Check audit_logs table access**

Per most recent migrations, audit_logs table was just created:

```sql
SELECT policyname, cmd, qual FROM pg_policies
WHERE tablename = 'audit_logs';
```

Verify:
1. Only service_role can insert
2. Only admin role can read
3. No delete policy (immutable audit trail)

- [ ] **Step 5: Check notifications table RLS**

```sql
SELECT policyname, cmd, qual FROM pg_policies
WHERE tablename = 'notifications' OR tablename = 'bulletin_notifications';
```

Verify:
1. An advisor can only read notifications where `user_id = auth.uid()`
2. Service role can insert (for edge function delivery)
3. Advisor can mark as read (UPDATE own records)
4. No cross-advisor read access

- [ ] **Step 6: Verify ticket_attachments bucket RLS**

Per memory: `create_ticket_attachments_bucket` migration was applied.

```sql
-- Check storage.objects policies
SELECT id, name, owner, created_at
FROM storage.buckets WHERE name = 'ticket-attachments';

SELECT id, name, definition FROM storage.policies
WHERE bucket_id = 'ticket-attachments';
```

Verify advisor can upload/download their own attachments only.

- [ ] **Step 7: Fix any broken RLS policies**

Create migration: `supabase/migrations/YYYYMMDD_fix_rls_policies.sql`

```sql
-- Example fix: missing admin bypass policy
CREATE POLICY "Admin can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'superadmin')
  )
);
```

Apply and verify:
```bash
supabase db push --project-ref dtmnkzllidaiqyheguhl
```

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/
git commit -m "fix(rls): correct RLS policies for profiles, notifications, audit_logs, and storage"
```

---

## Task 4: Audit Edge Function JWT Verification

- [ ] **Step 1: Read _shared/security.ts**

```bash
cat supabase/functions/_shared/security.ts
```

Map:
1. How `verifyJWT` works — which JWKS endpoint it hits
2. Whether it validates `aud` claim (must match `authenticated`)
3. Whether it validates `iss` claim (must match project URL)
4. Role extraction — where it reads roles from JWT claims
5. Rate limiting implementation — in-memory (resets on cold start?) vs DB-backed

- [ ] **Step 2: Check for in-memory rate limiting issue**

Deno edge functions are stateless. In-memory rate limiting resets on every cold start, meaning:
- Rate limit is effectively per-instance, not per-user
- A user can bypass rate limits by hammering until a new cold-start occurs

If rate limiting is in-memory:

```bash
grep -r 'Map\|Map<\|rateLimit' supabase/functions/_shared/security.ts
```

Fix: move rate limiting to Redis (Upstash) or a Supabase table:

```sql
-- Migration for rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  CONSTRAINT valid_count CHECK (count >= 0)
);
```

Or document as known limitation and accept it.

- [ ] **Step 3: Verify JWT audience and issuer validation**

```bash
grep -r '"authenticated"\|aud\|iss\|issuer\|audience' supabase/functions/_shared/security.ts
```

Missing `aud` validation = tokens from other Supabase projects could be accepted (PHI risk).

- [ ] **Step 4: Check RBAC role claims**

```bash
grep -r 'user_role\|app_role\|user_metadata\|app_metadata' supabase/functions/_shared/security.ts supabase/functions/ticket-proxy/index.ts
```

Verify roles are read from `app_metadata.role` (set by service_role only, cannot be forged by users) NOT `user_metadata.role` (user-editable).

- [ ] **Step 5: Audit `_shared/svix.ts` and its consumers**

The `_shared/` directory also contains `svix.ts` (Svix webhook signature verification), used by `ticket-webhook-receiver` and `resend-webhook`:

```bash
cat supabase/functions/_shared/svix.ts
grep -r "_shared/svix\|svix" supabase/functions/*/index.ts | cut -d: -f1
```

Verify:
1. Svix signature verification is being called before processing webhook payloads (not skipped)
2. `ticket-webhook-receiver` correctly parses the incoming ITSTS webhook payload
3. `ticket-webhook-receiver` correctly triggers the notification write (links to Plan 4 Task 2)

This function is the inbound path from ITSTS → advisor portal notifications. If broken, admin replies never trigger advisor notifications.

- [ ] **Step 6: Fix any JWT verification gaps**

Add missing validations in `_shared/security.ts`:

```typescript
// Verify audience
if (payload.aud !== 'authenticated') {
  throw new Error('Invalid token audience')
}

// Verify issuer
if (payload.iss !== `${SUPABASE_URL}/auth/v1`) {
  throw new Error('Invalid token issuer')
}

// Read role from app_metadata ONLY
const role = payload.app_metadata?.role ?? null
```

After fixing `_shared/security.ts` or any other `_shared/` file, redeploy ALL functions that import it. This includes functions importing `cors.ts`, `security.ts`, `logger.ts`, `itsts-sync.ts`, AND `svix.ts`:

```bash
# Find all functions importing any _shared file
grep -r "from.*_shared\|import.*_shared" supabase/functions/*/index.ts | cut -d: -f1 | sort -u
```

Redeploy every function in that list. Missing a redeployment means the live function bundle has the old `_shared/` code.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/security.ts supabase/functions/_shared/svix.ts
git commit -m "fix(security): harden JWT verification with audience/issuer validation and app_metadata role checks; audit svix webhook verification"
```

---

## Task 5: Audit Database Types vs Live Schema

- [ ] **Step 1: Check when types were last generated**

```bash
git log --oneline packages/database/src/types/database.ts | head -5
```

If the last generation was before the most recent 5 migrations → types are stale.

- [ ] **Step 2: Regenerate types from live schema**

```bash
pnpm db:generate
```

Or manually:
```bash
supabase gen types typescript \
  --project-id dtmnkzllidaiqyheguhl \
  > packages/database/src/types/database.ts
```

- [ ] **Step 3: Run typecheck to surface new type errors**

```bash
pnpm -r typecheck 2>&1 | grep -E "error TS"
```

New errors = app code referencing fields that no longer exist or were renamed.

- [ ] **Step 4: Fix all type errors**

For each type error:
1. If the field was renamed → update the query
2. If the field was removed → remove from select, update UI
3. If the field is new and needed → add to select

- [ ] **Step 5: Commit regenerated types and fixes**

```bash
git add packages/database/src/types/database.ts apps/ packages/
git commit -m "fix(data): regenerate Supabase types from live schema and fix type errors"
```

---

## Task 6: Audit Edge Function Error Responses

Poor error handling in edge functions causes confusing frontend behavior (spinner-of-death, blank pages).

- [ ] **Step 1: Check all edge functions for bare error returns**

```bash
grep -r 'return new Response\|Response.json\|JSON.stringify({.*error' supabase/functions/ticket-proxy/index.ts supabase/functions/send-ticket-notification/index.ts
```

Every error response must have:
1. Correct HTTP status code (400, 401, 403, 404, 500)
2. JSON body with `{ error: string, code?: string }`
3. CORS headers (otherwise browser treats it as network error)

- [ ] **Step 2: Check that all responses include CORS headers**

```bash
grep -r 'corsHeaders\|Access-Control' supabase/functions/ticket-proxy/index.ts
```

Even error responses MUST include CORS headers:
```typescript
return new Response(JSON.stringify({ error: 'Unauthorized' }), {
  status: 401,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

If CORS headers are missing on error responses → browser sees a network error, not a 401.

- [ ] **Step 3: Check send-ticket-notification for fire-and-forget safety**

```bash
cat supabase/functions/send-ticket-notification/index.ts
```

This function is called fire-and-forget from ticket-proxy. Verify:
1. It catches ALL errors internally (never throws to caller)
2. If notification delivery fails, it logs but doesn't fail the ticket operation
3. It handles missing `user_id` gracefully (notification skipped, not errored)

- [ ] **Step 4: Fix any bare error throws in fire-and-forget path**

```typescript
// In ticket-proxy, wrap notification call:
try {
  await fetch(`${SUPABASE_URL}/functions/v1/send-ticket-notification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, event: 'created' })
  })
} catch (e) {
  // Fire-and-forget: log but don't fail the main operation
  console.error('Notification send failed:', e)
}
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/
git commit -m "fix(edge): ensure all edge function error responses include CORS headers and correct status codes"
```

---

## Validation

- [ ] Create a test ticket via advisor portal → verify it appears in admin portal
- [ ] Add a reply from admin portal → verify it appears in advisor portal ticket detail
- [ ] Check ticket stats endpoint: `GET /ticket-proxy?action=get_stats`
- [ ] Run: `supabase db diff --project-ref dtmnkzllidaiqyheguhl` — should show no unapplied changes
- [ ] Run: `pnpm -r typecheck` — zero errors after type regeneration
- [ ] Verify all RLS policies allow expected access by testing with advisor JWT
- [ ] Test ITSTS migration applied: connect to ITSTS and check missing columns now exist
