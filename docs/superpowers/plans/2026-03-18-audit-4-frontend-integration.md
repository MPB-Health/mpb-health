# Audit Sub-Plan 4: Frontend Contract & Notification Audit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find and fix all frontend-to-backend contract mismatches (payload shape, field names, enums, nullability), broken notification/realtime flows, duplicate implementations across apps, stale asset/document references, and cross-app integration gaps.

**Architecture:** All apps are SPAs consuming the same Supabase backend via `@mpbhealth/database`. Notifications flow from edge functions → DB → realtime subscription → UI badge. Ticket replies flow from admin portal → ticket-proxy → ITSTS → realtime → advisor portal notification.

**Tech Stack:** React 18, TanStack Query (advisor-portal, crm), Supabase Realtime (WebSocket), `@mpbhealth/database` React Query hooks, `@mpbhealth/ui` components, React Router v6.

---

## Files in Scope

- `apps/advisor-portal/src/pages/` — all pages
- `apps/advisor-portal/src/components/` — all components (focus: notification panel, ticket list, ticket detail)
- `apps/advisor-portal/src/hooks/` — all custom hooks
- `apps/admin-portal/src/pages/` — ticket management, advisor list
- `apps/admin-portal/src/components/` — notification components
- `apps/crm/src/` — lead/member data queries
- `apps/website/src/` — public-facing content
- `packages/database/src/hooks/` — React Query + Realtime hooks
- `packages/ui/src/` — shared components (focus: NotificationBell, StatusDot, MetricCard)
- `supabase/functions/notification-service/index.ts`
- `supabase/functions/push-service/index.ts`
- `supabase/functions/send-bulletin-notification/index.ts`

---

## Task 1: Audit Ticket Payload Contracts

This is the highest-risk area — the advisor portal sends ticket data to ticket-proxy which sends it to ITSTS. Any shape mismatch = silent failure or 500.

- [ ] **Step 1: Map the full ticket creation payload**

Read the advisor portal's new ticket form submission:

```bash
cat apps/advisor-portal/src/pages/NewTicket.tsx
```

Extract the exact payload object sent to ticket-proxy. Note every field name and type.

- [ ] **Step 2: Read ticket-proxy create case**

```bash
grep -A50 "case 'create'" supabase/functions/ticket-proxy/index.ts
```

Compare every field ticket-proxy receives to what the frontend sends. Document mismatches.

- [ ] **Step 3: Read ITSTS insert schema**

What does ticket-proxy actually insert into ITSTS? Compare to ITSTS tickets table schema (from Sub-Plan 3, Task 1).

- [ ] **Step 4: Check required vs optional field assumptions**

If frontend sends `priority?: string` but ITSTS requires `priority NOT NULL` without a default → insert fails.

Fix by either:
1. Adding `DEFAULT 'medium'` to ITSTS schema (migration)
2. Adding `priority: payload.priority ?? 'medium'` in ticket-proxy

- [ ] **Step 5: Audit ticket list payload**

```bash
grep -A30 "case 'list'" supabase/functions/ticket-proxy/index.ts
cat apps/advisor-portal/src/pages/Tickets.tsx
```

Verify:
1. Pagination params sent by frontend match what ticket-proxy expects (`page`/`limit` vs `offset`/`count`)
2. Filter fields match (status filter, date filter, search term)
3. Sort field names match ITSTS column names

- [ ] **Step 6: Audit ticket reply payload**

```bash
grep -A30 "case 'add_reply'" supabase/functions/ticket-proxy/index.ts
cat apps/advisor-portal/src/pages/Tickets.tsx  # detail view may be embedded here
cat apps/advisor-portal/src/pages/ConversationThread.tsx 2>/dev/null  # or separate file
cat apps/admin-portal/src/pages/Tickets.tsx 2>/dev/null
cat apps/admin-portal/src/pages/ConversationThread.tsx 2>/dev/null
```

Verify:
1. `reply_body` vs `content` vs `message` — field name consistency
2. `author_type` is sent and valid (`advisor | staff | system`)
3. `ticket_id` is passed correctly (string UUID vs integer ID)

- [ ] **Step 7: Fix all payload mismatches**

For frontend-side fixes, update the form submission handler.
For edge function-side fixes, update ticket-proxy.
For schema-side fixes, create a migration (see Sub-Plan 3).

- [ ] **Step 8: Audit `supabase.functions.invoke()` on unauthenticated pages**

**This is a production high-complaint area.** `supabase.functions.invoke()` hangs when a stale session exists on pages that can be reached unauthenticated. Use direct `fetch()` instead on any unauth page.

```bash
# Find all invoke() usages in advisor portal pages
grep -rn 'functions\.invoke' apps/advisor-portal/src/pages/ --include="*.tsx"
grep -rn 'functions\.invoke' apps/admin-portal/src/pages/ --include="*.tsx"
```

Cross-reference each found file with the router to determine if it's behind `<ProtectedRoute>`. Files to check specifically:
- `Login.tsx`
- `ForgotPassword.tsx`
- `ResetPassword.tsx`
- `ChangePassword.tsx`

If `invoke()` appears on ANY of those pages, replace with direct `fetch()`:

```typescript
// Replace invoke() on unauth pages:
// WRONG:
const { data } = await supabase.functions.invoke('advisor-forgot-password', { body: { email } })

// CORRECT:
const res = await fetch(`${SUPABASE_URL}/functions/v1/advisor-forgot-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
})
const data = await res.json()
```

- [ ] **Step 9: Commit**

```bash
git add apps/ supabase/functions/ticket-proxy/
git commit -m "fix(contracts): align ticket create/list/reply payloads; replace invoke() on unauth pages"
```

---

## Task 2: Audit Notification System End-to-End

The notification flow is: admin replies → ticket-proxy fires send-ticket-notification → notification written to DB → realtime subscription fires → advisor sees badge update.

- [ ] **Step 1: Map the full notification flow**

Read the notification service AND the inbound webhook receiver (the entry point from ITSTS):

```bash
cat supabase/functions/send-ticket-notification/index.ts
cat supabase/functions/notification-service/index.ts 2>/dev/null
cat supabase/functions/ticket-webhook-receiver/index.ts
```

`ticket-webhook-receiver` is the inbound path from ITSTS → primary DB. When ITSTS receives a reply, it posts a webhook here. This function must:
1. Verify the Svix signature (via `_shared/svix.ts`)
2. Parse the ITSTS ticket event payload
3. Write a notification record to the primary DB
4. The realtime subscription then fires to the advisor portal

If `ticket-webhook-receiver` is broken (wrong secret, wrong field names, missing DB write), NO admin reply ever reaches the advisor notification panel — regardless of whether everything else is correct.

Document for each function:
1. What table notifications are written to
2. What fields are written (`user_id`, `type`, `ticket_id`, `message`, `read`, `created_at`)
3. How the function knows which user to notify (advisor vs admin)

- [ ] **Step 2: Read advisor portal notification hook**

```bash
grep -r 'useNotifications\|notification\|unreadCount' apps/advisor-portal/src/ --include="*.ts" --include="*.tsx" -l
cat apps/advisor-portal/src/hooks/useNotifications.ts 2>/dev/null
```

Verify:
1. Query selects the same fields that the edge function writes
2. Unread count filter matches `read = false` (not `is_read = false` or `seen = false`)
3. The Supabase table name matches

- [ ] **Step 3: Find the realtime subscription for notifications**

```bash
grep -r 'channel\|subscribe\|on\(.*INSERT\|realtime' apps/advisor-portal/src/ --include="*.ts" --include="*.tsx"
```

Verify:
1. Subscribe to the correct table and filter (`user_id = auth.uid()`)
2. On INSERT event, invalidate React Query cache (so badge count updates)
3. On SUBSCRIBE error, falls back to polling (not silent failure)
4. Subscription is cleaned up on component unmount (no memory leaks)

- [ ] **Step 4: Check the notifications table has realtime enabled**

In Supabase, realtime must be explicitly enabled per table:

```sql
-- Check if notifications table is in realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
```

If missing → realtime subscriptions silently receive no events. Fix:

```sql
-- Migration
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

- [ ] **Step 5: Check unread count query**

In the advisor portal, find where the notification badge count is computed:

```bash
grep -r 'unread\|badge\|count' apps/advisor-portal/src/components/ --include="*.tsx" -l
```

Verify the count query:
1. Filters by `user_id = auth.uid()` (RLS handles this but check if query is explicit)
2. Filters by `read = false`
3. Returns a number (not an array length on the client — expensive)

Better pattern:
```typescript
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('read', false)
```

- [ ] **Step 6: Audit "mark as read" flow**

```bash
grep -r 'markAsRead\|mark_read\|read.*true\|update.*notifications' apps/advisor-portal/src/ --include="*.ts" --include="*.tsx"
```

Verify:
1. On click, update `read = true` for that notification
2. Invalidate unread count query after update
3. Optimistic update is used (no flicker)

- [ ] **Step 7: Fix any notification flow gaps**

Priority fixes:
1. Add `notifications` to realtime publication if missing (migration)
2. Fix field name mismatches between insert and select
3. Add React Query cache invalidation after notification received via realtime
4. Add subscription cleanup in `useEffect` return

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/ apps/advisor-portal/src/ supabase/migrations/
git commit -m "fix(notifications): align notification write/read contracts and enable realtime on notifications table"
```

---

## Task 3: Audit Cross-App Data Contract Consistency

- [ ] **Step 1: Find all places admin portal queries advisor data**

```bash
grep -r '\.from\(\|\.rpc\(' apps/admin-portal/src/ --include="*.ts" --include="*.tsx" | grep -oP "from\(['\"](\w+)['\"]\)|rpc\(['\"](\w+)['\"]\)" | sort -u
```

For each table/RPC used in admin-portal, verify it:
1. Exists in the schema
2. Has RLS policies that allow admin access
3. Returns the fields the admin UI expects

- [ ] **Step 2: Check CRM queries for schema drift**

```bash
grep -r '\.from\(' apps/crm/src/ --include="*.ts" --include="*.tsx" | grep -oP "from\(['\"](\w+)['\"]\)" | sort -u
```

CRM app works with leads, contacts, deals, activities. Verify these tables exist and columns match.

- [ ] **Step 3: Check @mpbhealth/crm-core exports alignment**

```bash
cat packages/crm-core/package.json | grep '"exports"' -A30
ls packages/crm-core/src/
```

Verify:
1. All 24 exported subpaths have corresponding `src/index.ts` files
2. Each exported module compiles without errors
3. The CRM app imports from valid subpaths (not from internal files)

```bash
grep -r 'from.*@mpbhealth/crm-core' apps/crm/src/ --include="*.ts" --include="*.tsx" | grep -oP "'@mpbhealth/crm-core[^']*'" | sort -u
```

- [ ] **Step 4: Identify duplicate logic across apps**

```bash
# Look for duplicate API client patterns
grep -r 'supabase\.from\|supabase\.rpc' apps/ --include="*.ts" --include="*.tsx" -l | wc -l
```

If the same Supabase query appears in 2+ apps → potential for drift. Extract to `@mpbhealth/database` hooks.

Key candidates:
- Advisor profile queries (used in advisor-portal AND admin-portal)
- Ticket status queries (used in advisor-portal AND admin-portal)
- Notification queries (used in advisor-portal AND admin-portal)

- [ ] **Step 5: Fix duplicate implementations**

For each duplicate query found, extract to a shared hook in `@mpbhealth/database/src/hooks/`:

```typescript
// packages/database/src/hooks/useAdvisorProfile.ts
export function useAdvisorProfile(advisorId: string) {
  return useSupabaseQuery(
    ['advisor-profile', advisorId],
    (supabase) => supabase
      .from('advisors')
      .select('id, name, email, agent_id, avatar_url, status')
      .eq('id', advisorId)
      .single()
  )
}
```

Update both apps to import from `@mpbhealth/database` instead of duplicating.

- [ ] **Step 6: Commit**

```bash
git add packages/database/src/hooks/ apps/
git commit -m "fix(contracts): extract duplicate data queries to shared hooks in @mpbhealth/database"
```

---

## Task 4: Audit Stale Content & Asset References

- [ ] **Step 1: Find all PDF/document references in the codebase**

```bash
grep -r '\.pdf\|\.docx\|commission.*document\|training.*resource\|pricing.*sheet' --include="*.ts" --include="*.tsx" --include="*.json" apps/ packages/
```

For each reference:
1. Does the file still exist (in `packages/assets/` or external URL)?
2. Is it the current version?
3. Is it linked from the correct app?

- [ ] **Step 2: Find hardcoded content URLs**

```bash
grep -r 'mpbhealth\.com\|mpb\.health\|supabase\.co/storage' --include="*.ts" --include="*.tsx" apps/ packages/
```

Flag any `mpbhealth.com` domain links (legacy domain — should use `mpb.health`).
Flag any storage bucket URLs that might have changed.

- [ ] **Step 3: Check website for stale plan/pricing references**

```bash
grep -r 'plan\|pricing\|commission\|rate\|premium\|basic\|standard' apps/website/src/ --include="*.tsx" -l
```

Read each found file for hardcoded plan names/prices that may be outdated.

- [ ] **Step 4: Check open enrollment dates**

```bash
grep -r 'OPEN_ENROLLMENT\|openEnrollment\|enrollment.*date\|2025\|2026' apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v dist
```

Any hardcoded dates that have passed are stale. Replace with `import.meta.env.VITE_OPEN_ENROLLMENT_*` env vars.

- [ ] **Step 5: Fix stale references**

1. Update `mpbhealth.com` → `mpb.health` in all non-CORS-allowlist locations
2. Remove references to documents that no longer exist
3. Replace hardcoded dates with env vars

- [ ] **Step 6: Commit**

```bash
git add apps/ packages/
git commit -m "fix(content): remove stale domain references, hardcoded dates, and broken asset links"
```

---

## Task 5: Audit React Query Cache Strategy

Improper cache invalidation causes stale data in UI — advisors see old ticket state after reply, admins see old lists after status change.

- [ ] **Step 1: Map all query keys used in advisor portal**

```bash
grep -r 'queryKey\|useQuery\|useMutation' apps/advisor-portal/src/ --include="*.ts" --include="*.tsx" | grep -oP "'[a-z-]+'" | sort -u
```

- [ ] **Step 2: Verify mutation invalidations**

For every mutation (create ticket, add reply, update status), check what gets invalidated:

```bash
grep -A10 'onSuccess' apps/advisor-portal/src/ --include="*.ts" --include="*.tsx" -r | grep 'invalidate\|refetch'
```

Pattern to verify:
- Create ticket → invalidate `['tickets']` AND `['ticket-stats']`
- Add reply → invalidate `['ticket', ticketId]` AND `['ticket-replies', ticketId]`
- Mark notification read → invalidate `['notifications']` AND `['unread-count']`

- [ ] **Step 3: Check stale time configuration**

```bash
grep -r 'staleTime\|gcTime\|cacheTime' apps/advisor-portal/src/ packages/database/src/ --include="*.ts" --include="*.tsx"
```

Ticket data should have short staleTime (30s max) since it's updated by other users.
Static data (categories, profile) can have longer staleTime (5 min).

- [ ] **Step 4: Fix missing invalidations**

For any mutation missing proper invalidations, add:

```typescript
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: createTicket,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
    queryClient.invalidateQueries({ queryKey: ['ticket-stats'] })
  }
})
```

- [ ] **Step 5: Check for polling vs realtime duplication**

If a component both polls (refetchInterval) AND subscribes to realtime → double updates, potential race conditions.

```bash
grep -r 'refetchInterval\|polling' apps/advisor-portal/src/ --include="*.ts" --include="*.tsx"
```

If realtime is working, remove polling. If realtime is unreliable (see Task 2), keep polling as fallback with a longer interval.

- [ ] **Step 6: Commit**

```bash
git add apps/
git commit -m "fix(queries): add missing cache invalidations and align stale times for ticket/notification data"
```

---

## Task 6: Audit Shared UI Component Usage

- [ ] **Step 1: Check all apps use @mpbhealth/ui components correctly**

The authoritative check is TypeScript — run typecheck rather than relying on fragile grep pipelines (multi-line imports won't be captured by single-line regex):

```bash
pnpm -r typecheck 2>&1 | grep "@mpbhealth/ui"
```

Any "Module '@mpbhealth/ui' has no exported member 'X'" error = missing or renamed export.

As a secondary check, list all files importing from `@mpbhealth/ui`:
```bash
grep -r 'from.*@mpbhealth/ui' apps/ --include="*.tsx" -l
```

Then read each file to identify the imported names and cross-reference against `packages/ui/src/index.ts` exports.

Any component imported from `@mpbhealth/ui` that doesn't exist in `packages/ui/src/` → build failure.

- [ ] **Step 2: Check StatusDot usage matches STATUS_DOT map**

Per memory: NewTicket.tsx uses `STATUS_DOT` map for colored dots. Verify:

```bash
grep -r 'STATUS_DOT\|StatusDot' apps/ packages/ui/src/ --include="*.tsx" --include="*.ts"
```

1. `STATUS_DOT` map covers all ticket statuses returned by ticket-proxy (`open`, `pending`, `in_progress`, `resolved`, `closed`)
2. No status value falls through to undefined (would render as transparent dot)

- [ ] **Step 3: Check MetricCard usage alignment**

```bash
grep -r 'MetricCard' apps/ --include="*.tsx" -l
```

Read MetricCard props definition in `@mpbhealth/ui`:

```bash
grep -A20 'MetricCard\|interface.*Metric' packages/ui/src/ -r --include="*.tsx" --include="*.ts"
```

Verify every usage passes the required props.

- [ ] **Step 4: Check for dark mode support gaps**

```bash
grep -r 'dark:' apps/ --include="*.tsx" | wc -l
grep -r 'useTheme\|ThemeProvider' apps/ --include="*.tsx" | wc -l
```

If components use hardcoded colors (`bg-white`, `text-gray-900`) instead of semantic tokens → broken in dark mode.

Priority fix: any advisor portal page that doesn't support dark mode (advisors are the primary daily users).

- [ ] **Step 5: Fix component prop mismatches**

For any component usage that doesn't match its prop type:
1. Add the missing required prop
2. Or make the prop optional with a sensible default in the UI package

- [ ] **Step 6: Commit**

```bash
git add apps/ packages/ui/src/
git commit -m "fix(ui): align all @mpbhealth/ui component usage with current prop definitions"
```

---

## Task 7: Final Cross-App Integration Check

- [ ] **Step 1: Test advisor portal → admin portal visibility**

Create a ticket in advisor portal. Verify it appears immediately in admin portal ticket list (no page refresh needed).

- [ ] **Step 2: Test admin portal → advisor portal notification**

Reply to a ticket in admin portal. Verify advisor portal shows notification badge increment within 3 seconds (realtime).

- [ ] **Step 3: Test ticket status update flow**

Admin changes ticket status to `resolved`. Verify:
1. Admin portal list updates immediately
2. Advisor portal ticket detail shows `resolved` status
3. Advisor receives a status change notification

- [ ] **Step 4: Test advisor profile data in admin portal**

Admin views advisor list. Verify all advisor fields are populated (name, email, agent_id, status).

- [ ] **Step 5: Test CRM lead → member flow**

If CRM has a lead conversion flow, test that converted leads appear in the member data correctly.

- [ ] **Step 6: Generate final mismatch report**

Create: `docs/AUDIT-FINDINGS-2026-03-18.md`

Document:
1. All mismatches found across all 4 sub-plans
2. Status: fixed / pending / accepted-risk
3. Files changed
4. Migrations applied
5. Functions redeployed

---

## Validation

- [ ] `pnpm -r typecheck` — zero errors
- [ ] `pnpm -r build` — all apps build
- [ ] Advisor portal: create ticket, see it in list, admin replies, advisor sees notification
- [ ] Admin portal: view advisor profiles, update ticket status
- [ ] CRM: lead and contact queries return expected fields
- [ ] Website: no broken links or stale content references
- [ ] Browser devtools: zero CSP console errors
- [ ] Browser devtools: realtime WebSocket connection established (Network tab → WS)
- [ ] Notification badge increments without page refresh after admin reply
