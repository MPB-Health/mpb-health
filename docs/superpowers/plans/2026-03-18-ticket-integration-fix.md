# Ticket Integration Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken advisor ↔ ITSTS ticket flows: submission, replies, staff responses visible to advisors, and 30-second polling for live updates.

**Architecture:** The advisor portal calls `ticket-proxy` (Supabase edge function in `dtmnkzllidaiqyheguhl`) which relays to the ITSTS database (`hhikjgrttgnvojtunmla`) using a service-role key. The ITSTS app writes directly to that database. Both sides must agree on the `ticket_comments.body` column name; currently `ticket-proxy` uses `content` everywhere, which doesn't exist.

**Tech Stack:** Deno/TypeScript (edge functions), React 18 + TypeScript (advisor portal), Supabase CLI v2.75, PostgreSQL (ITSTS DB), Supabase MCP tools

---

## File Map

| File | Action | Reason |
|------|--------|--------|
| `supabase/functions/ticket-proxy/index.ts` | Modify | Fix 2 SELECT aliases + 2 INSERT field names (BUG-1) |
| `apps/advisor-portal/src/pages/Tickets.tsx` | Modify | Add 30s silent polling when ticket detail is open (BUG-5) |
| `supabase/itsts-migrations/20260318000000_add_comment_body_index.sql` | Create | Composite index on ticket_comments(ticket_id, created_at) |

---

## Task 1: Fix `ticket-proxy` — SELECT column alias (BUG-1, part A)

**Files:**
- Modify: `supabase/functions/ticket-proxy/index.ts` lines 168 and 317

The ITSTS `ticket_comments` table stores replies in a column called `body` (NOT `content`). The proxy currently selects a non-existent column, so every comment loads as `null`. The PostgREST alias syntax `content:body` renames `body` to `content` in the JSON response, so nothing downstream needs to change.

- [ ] **Open the file and make the first SELECT fix (line ~168, inside `getTicketDetail`)**

```typescript
// BEFORE (line ~168):
.select("id, content, is_internal, created_at, author_id")

// AFTER:
.select("id, content:body, is_internal, created_at, author_id")
```

Edit [supabase/functions/ticket-proxy/index.ts](supabase/functions/ticket-proxy/index.ts) at the `getTicketDetail` function.

- [ ] **Make the second SELECT fix (line ~317, inside `getTicketDetailAdmin`)**

```typescript
// BEFORE (line ~317):
.select("id, content, is_internal, created_at, author_id")

// AFTER:
.select("id, content:body, is_internal, created_at, author_id")
```

- [ ] **Verify exactly 2 occurrences were changed — confirm none remain**

```bash
grep -n '"id, content,' supabase/functions/ticket-proxy/index.ts
```

Expected output: (empty — zero matches)

---

## Task 2: Fix `ticket-proxy` — INSERT field name (BUG-1, part B)

**Files:**
- Modify: `supabase/functions/ticket-proxy/index.ts` lines ~382 and ~471

When advisors reply or admins add comments, the proxy inserts `{ content: "..." }` but the column is `body NOT NULL`. This causes a PostgreSQL NOT NULL constraint violation — the insert silently fails with a 500 from the edge function.

- [ ] **Fix the `addComment` INSERT (line ~382)**

```typescript
// BEFORE:
const { error: commentError } = await itstsAdmin
  .from("ticket_comments")
  .insert({
    ticket_id: ticketId,
    content,
    author_id: authorId,
    is_internal: isInternal,
  });

// AFTER:
const { error: commentError } = await itstsAdmin
  .from("ticket_comments")
  .insert({
    ticket_id: ticketId,
    body: content,
    author_id: authorId,
    is_internal: isInternal,
  });
```

- [ ] **Fix the `replyToTicket` INSERT (line ~471)**

```typescript
// BEFORE:
const { error } = await itstsAdmin
  .from("ticket_comments")
  .insert({
    ticket_id: ticketId,
    content: content.trim(),
    author_id: advisorId,
    is_internal: false,
  });

// AFTER:
const { error } = await itstsAdmin
  .from("ticket_comments")
  .insert({
    ticket_id: ticketId,
    body: content.trim(),
    author_id: advisorId,
    is_internal: false,
  });
```

- [ ] **Confirm no remaining `content:` or `, content,` INSERT references**

```bash
grep -n "content:" supabase/functions/ticket-proxy/index.ts | grep -v "body:" | grep -v "//"
```

Expected: lines that show `content:` in the INSERT objects should be gone; only `body:` remains.

- [ ] **Commit the ticket-proxy fix**

```bash
cd "c:/Users/VinnieRTannous/OneDrive - mympb.com (1)/Documents/GitHub/mpbhealth-monorepo"
git add supabase/functions/ticket-proxy/index.ts
git commit -m "$(cat <<'EOF'
fix(ticket-proxy): use body column for ticket_comments (was content)

ITSTS DB stores comments in ticket_comments.body (NOT NULL). The proxy
was selecting and inserting 'content', which does not exist. Fixes:
- SELECT now uses PostgREST alias content:body (response shape unchanged)
- INSERT in replyToTicket and addComment now writes body field

This resolves BUG-1: advisor replies failing + staff replies invisible.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add 30-second polling to Tickets.tsx (BUG-5)

**Files:**
- Modify: `apps/advisor-portal/src/pages/Tickets.tsx`

When an advisor opens a ticket detail view, staff replies written in ITSTS are not visible without a manual page reload. Because the advisor portal and ITSTS use different Supabase projects, a Realtime subscription is not possible cross-project. A 30-second silent background poll is the correct approach.

**CRITICAL:** This poll must NOT set `detailLoading = true` or show any spinner. It is entirely silent — the detail simply updates in place when new comments arrive.

- [ ] **Add the polling effect inside `Tickets.tsx`, after the existing `openTicketDetail` function**

Find the `openTicketDetail` function (around line 199). After its closing brace, add:

```typescript
// Silent 30-second poll for new staff replies while ticket detail is open.
// We cannot use Supabase Realtime here — the advisor portal and ITSTS run
// on different Supabase projects. The poll is intentionally silent (no
// loading indicator) so it never disrupts the advisor's reply textarea.
useEffect(() => {
  if (!selectedTicket) return;
  const ticketId = selectedTicket.ticket.id;
  const interval = setInterval(() => {
    executeWithAuth(() => ticketService.getTicketDetail(ticketId))
      .then((detail) => { if (mountedRef.current) setSelectedTicket(detail); })
      .catch(() => {}); // silent — network blips should not surface as errors
  }, 30_000);
  return () => clearInterval(interval);
}, [selectedTicket?.ticket.id, executeWithAuth]);
```

- [ ] **Verify the dependency array is correct**

The effect depends on `selectedTicket?.ticket.id` (not the full object) and `executeWithAuth`. This means:
- Opens when a ticket is selected
- Cleans up when ticket is deselected or changes
- Does NOT re-open on every comment update (since ticket ID doesn't change)

- [ ] **Commit**

```bash
git add apps/advisor-portal/src/pages/Tickets.tsx
git commit -m "$(cat <<'EOF'
feat(advisor-portal): poll ticket detail every 30s for staff replies

Advisors now see staff replies appear within 30 seconds without manual
refresh. Uses silent background polling (no loading indicator) because
the advisor portal and ITSTS are separate Supabase projects — Realtime
subscriptions cannot cross project boundaries.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create ITSTS performance migration (BUG-1 support)

**Files:**
- Create: `supabase/itsts-migrations/20260318000000_add_comment_body_index.sql`

The existing `idx_ticket_comments_ticket` index covers `ticket_id` only. Adding `created_at ASC` to the index eliminates a sort operation on every comment load.

- [ ] **Create the migration file**

```sql
-- supabase/itsts-migrations/20260318000000_add_comment_body_index.sql
-- Composite index: eliminates sort when fetching comments ordered by time.
-- Apply to: hhikjgrttgnvojtunmla (ITSTS project)
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_time
  ON public.ticket_comments (ticket_id, created_at ASC);
```

- [ ] **Commit**

```bash
git add supabase/itsts-migrations/20260318000000_add_comment_body_index.sql
git commit -m "$(cat <<'EOF'
perf(itsts-migrations): composite index on ticket_comments(ticket_id, created_at)

Eliminates an in-memory sort on every comment load. Apply to hhikjgrttgnvojtunmla.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Verify ITSTS secrets on primary project (BUG-2)

**No file changes.** This is a verification + remediation step using the Supabase CLI.

- [ ] **List current secrets on the primary ticket-proxy deployment**

```bash
cd "c:/Users/VinnieRTannous/OneDrive - mympb.com (1)/Documents/GitHub/mpbhealth-monorepo"
supabase secrets list --project-ref dtmnkzllidaiqyheguhl
```

Expected: A list of secret names (values are masked). You should see:
- `ITSTS_SUPABASE_URL`
- `ITSTS_SERVICE_ROLE_KEY`
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- `RESEND_API_KEY`
- `SUPPORT_TEAM_EMAIL`
- `WARMUP_CRON_SECRET`

- [ ] **If any of the above are missing, set them now**

```bash
# Set missing secrets — replace <VALUE> with actual values from .env.local or Vercel dashboard
supabase secrets set ITSTS_SUPABASE_URL=https://hhikjgrttgnvojtunmla.supabase.co --project-ref dtmnkzllidaiqyheguhl
supabase secrets set ITSTS_SERVICE_ROLE_KEY=<itsts-service-role-key> --project-ref dtmnkzllidaiqyheguhl
supabase secrets set RESEND_API_KEY=<resend-api-key> --project-ref dtmnkzllidaiqyheguhl
supabase secrets set SUPPORT_TEAM_EMAIL=support@mpb.health --project-ref dtmnkzllidaiqyheguhl
supabase secrets set APP_URL=https://advisor.mpb.health --project-ref dtmnkzllidaiqyheguhl
```

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase — you do NOT need to set these.

---

## Task 6: Deploy ticket-proxy to primary project (dtmnkzllidaiqyheguhl)

- [ ] **Deploy**

```bash
cd "c:/Users/VinnieRTannous/OneDrive - mympb.com (1)/Documents/GitHub/mpbhealth-monorepo"
supabase functions deploy ticket-proxy --project-ref dtmnkzllidaiqyheguhl
```

Expected output:
```
Deploying function ticket-proxy (Deno)...
Done: ticket-proxy
```

- [ ] **Smoke-test the deployment with a ping action**

```bash
# Get the JWT from the advisor portal dev env (or use your own session token)
# Then call the ping action — expects { success: true, pong: true }
curl -s -X POST \
  https://dtmnkzllidaiqyheguhl.supabase.co/functions/v1/ticket-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt>" \
  -d '{"action":"ping"}'
```

Expected: `{"success":true,"pong":true,"userId":"...","correlationId":"..."}`

---

## Task 7: Deploy ticket-proxy to secondary project (hhikjgrttgnvojtunmla)

The same `ticket-proxy` is deployed to the ITSTS project as a secondary endpoint (v4+). It needs the same body/content fix.

- [ ] **Verify secrets on the secondary project**

```bash
supabase secrets list --project-ref hhikjgrttgnvojtunmla
```

The secondary deployment uses `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` pointing at `hhikjgrttgnvojtunmla` itself. The `ITSTS_SUPABASE_URL` / `ITSTS_SERVICE_ROLE_KEY` may point back to the same project or be empty. Verify this is intentional.

- [ ] **Deploy**

```bash
supabase functions deploy ticket-proxy --project-ref hhikjgrttgnvojtunmla
```

Expected: same success output as Task 6.

---

## Task 8: Deploy send-ticket-notification (refresh _shared/ bundle)

No code changes in this function, but the `_shared/` utilities are bundled at deploy time. Redeploying ensures the production bundle is current.

- [ ] **Deploy**

```bash
supabase functions deploy send-ticket-notification --project-ref dtmnkzllidaiqyheguhl
```

Expected: `Done: send-ticket-notification`

---

## Task 9: Apply ITSTS performance migration (hhikjgrttgnvojtunmla)

- [ ] **Apply the migration using Supabase MCP or CLI**

Use the `mcp__claude_ai_Supabase__execute_sql` tool with project `hhikjgrttgnvojtunmla`, or run:

```bash
# Using psql or Supabase Studio SQL editor — paste the migration content:
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_time
  ON public.ticket_comments (ticket_id, created_at ASC);
```

Or via CLI if you have direct DB access:
```bash
supabase db push --project-ref hhikjgrttgnvojtunmla
```

- [ ] **Verify the index exists**

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ticket_comments'
  AND indexname = 'idx_ticket_comments_ticket_time';
```

Expected: 1 row returned.

---

## Task 10: Run bulk-sync-itsts (BUG-3 — existing advisors not in ITSTS)

- [ ] **Invoke the bulk-sync edge function**

```bash
curl -s -X POST \
  https://dtmnkzllidaiqyheguhl.supabase.co/functions/v1/bulk-sync-itsts \
  -H "Authorization: Bearer <service-role-key-for-dtmnkzllidaiqyheguhl>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: a JSON response indicating how many advisors were synced.

- [ ] **Verify advisors now exist in ITSTS profiles**

Using Supabase MCP or Studio on `hhikjgrttgnvojtunmla`:

```sql
SELECT COUNT(*) FROM profiles WHERE role = 'advisor';
```

Expected: a non-zero count matching the number of advisors in the monorepo.

---

## Task 11: Deploy advisor-portal frontend (Vercel)

- [ ] **Push to trigger Vercel deploy (if not using auto-deploy)**

```bash
cd "c:/Users/VinnieRTannous/OneDrive - mympb.com (1)/Documents/GitHub/mpbhealth-monorepo"
git push origin master
```

Vercel will auto-deploy `apps/advisor-portal`. The only frontend change is the 30s polling effect in `Tickets.tsx`.

---

## Task 12: End-to-end validation

**These are manual smoke tests. Run them in order.**

- [ ] **Test 1: Advisor submits a ticket**
  1. Log in to `https://advisor.mpb.health` as an advisor
  2. Go to Support → New Ticket
  3. Fill in subject + description, submit
  4. Expected: success toast, ticket appears in the advisor's ticket list
  5. Go to `https://support.mpb.health` as staff
  6. Expected: the new ticket appears in the ITSTS staff queue

- [ ] **Test 2: Staff replies in ITSTS → advisor sees it within 30s**
  1. In ITSTS, open the ticket submitted in Test 1
  2. Type a reply in MessageComposer, click Send
  3. Switch to the advisor portal, open the same ticket
  4. Wait up to 30 seconds WITHOUT refreshing
  5. Expected: the staff reply appears automatically

- [ ] **Test 3: Advisor replies to ticket**
  1. In the advisor portal, open the ticket
  2. Type a reply in the "Add a Reply" box, click Send Reply
  3. Expected: no error, reply appears in the conversation
  4. Go to ITSTS — expected: the advisor's reply is visible in the thread

- [ ] **Test 4: Admin adds comment from admin portal**
  1. Log in to `https://admin.mpb.health`
  2. Navigate to Admin Tickets, open any ticket
  3. Add a comment
  4. Expected: comment saves successfully, no 500 error

- [ ] **Test 5: Forgot-password flow**
  1. Go to `https://advisor.mpb.health/forgot-password`
  2. Enter a valid advisor email, click Send
  3. Expected: email arrives with a link to `https://advisor.mpb.health/reset-password?token_hash=...&type=recovery`
  4. Click the link, set a new password
  5. Expected: redirected to login with success toast

- [ ] **Test 6: Session stays alive (no unexpected logout)**
  1. Log in to advisor portal
  2. Stay active for 10 minutes
  3. Expected: no logout, no reload loop

---

## Rollback Plan

If a deployment causes regressions:

```bash
# Roll back ticket-proxy to the previous version via Supabase CLI or dashboard
# The previous version is still reading 'content' which returns null — broken,
# but not MORE broken than before this fix was applied.
# There is no data mutation risk — only code changes in this fix.
```

The migration (Task 9) is safe to leave — `CREATE INDEX IF NOT EXISTS` is non-destructive.
