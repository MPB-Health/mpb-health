# Ticket Integration Fix — Design Spec
**Date:** 2026-03-18
**Approach:** B — Fix + Real-Time
**Projects:** `dtmnkzllidaiqyheguhl` (MPB Health / advisor portal) + `hhikjgrttgnvojtunmla` (ITSTS)

---

## Problem Summary

Five confirmed bugs are breaking the advisor ↔ ITSTS support flow:

| ID | Severity | Description |
|----|----------|-------------|
| BUG-1 | P0 | `ticket_comments.body` vs `content` column mismatch in `ticket-proxy` — all writes fail, all staff replies invisible |
| BUG-2 | P0 | ITSTS env vars (`ITSTS_SUPABASE_URL`, `ITSTS_SERVICE_ROLE_KEY`) may not be set in production |
| BUG-3 | P1 | New advisors not synced to ITSTS `profiles` → 404 "Support account not found" on ticket creation |
| BUG-4 | P1 | `send-ticket-notification` queries `advisor_profiles` table which may have no rows — in-app notifications silently skipped |
| BUG-5 | P2 | No real-time/polling updates in advisor portal ticket detail — advisors must manually refresh to see staff replies |

---

## Architecture

```
ADVISOR PORTAL (advisor.mpb.health)        ITSTS (support.mpb.health)
─────────────────────────────────          ──────────────────────────
Tickets.tsx                                MessageComposer.tsx
  + 30s polling when detail open             inserts { body: "..." } ← correct
  ↓
TicketService.call()
  → invoke ticket-proxy (dtmnkzllidaiqyheguhl)
      ↓
    ticket-proxy edge fn (FIXED)
      reads:  SELECT "id, content:body, ..."   (body aliased → content)
      writes: INSERT { body: value, ... }
      ↓
    hhikjgrttgnvojtunmla (ITSTS DB)
      ticket_comments.body NOT NULL ← correct
      ↓
    send-ticket-notification (FIXED)
      lookups: profiles → admin_users (not advisor_profiles)
      → Resend email + in-app push
```

---

## Changes

### 1. `supabase/functions/ticket-proxy/index.ts`

**getTicketDetail()** and **getTicketDetailAdmin()** — fix SELECT (2 occurrences, lines 168 and 317):
```diff
- .select("id, content, is_internal, created_at, author_id")
+ .select("id, content:body, is_internal, created_at, author_id")
```
Exactly 2 locations. `listAllTickets()` does not query `ticket_comments` so no change needed there.

**replyToTicket()** — fix INSERT:
```diff
- .insert({ ticket_id, content: content.trim(), author_id, is_internal: false })
+ .insert({ ticket_id, body: content.trim(), author_id, is_internal: false })
```

**addComment()** — fix INSERT:
```diff
- .insert({ ticket_id, content, author_id, is_internal })
+ .insert({ ticket_id, body: content, author_id, is_internal })
```

No downstream changes needed — the PostgREST alias preserves the `content` key in responses, so `TicketService.ts` and `Tickets.tsx` are unaffected.

### 2. `supabase/functions/send-ticket-notification/index.ts`

**No code change needed.** The existing `advisor_profiles → admin_users` lookup chain in `getUserIdByEmail()` is architecturally correct. The `advisor_profiles` table in `dtmnkzllidaiqyheguhl` has an `email` column (confirmed by `idx_advisor_profiles_email` index).

BUG-4 is independent of BUG-3. Two separate syncs are needed:
- **BUG-3 fix:** `bulk-sync-itsts` populates ITSTS project (`hhikjgrttgnvojtunmla`) `profiles` so advisors can submit tickets
- **BUG-4 fix:** `advisor_profiles` in the monorepo project (`dtmnkzllidaiqyheguhl`) is populated by an existing trigger (`trigger_advisor_profile_on_role_grant`) when an advisor role is assigned. Backfill via `bulk-sync-itsts` is NOT sufficient for BUG-4. Verify the trigger is active and run the backfill migration `20260302103000_backfill_missing_advisor_profiles_for_role_users.sql` if needed. No code change to `send-ticket-notification` is required.

### 3. `apps/advisor-portal/src/pages/Tickets.tsx`

Add 30-second polling effect when ticket detail is open (cross-project architecture means Realtime subscription to ITSTS DB is not possible from the advisor portal Supabase client):

```typescript
// Poll for new staff replies every 30s while ticket detail is open.
// This is a SILENT background poll — no loading indicator is shown.
// Do NOT add detailLoading or any spinner to this effect; it would
// flash every 30 seconds and disrupt the user's reply textarea.
useEffect(() => {
  if (!selectedTicket) return;
  const interval = setInterval(() => {
    executeWithAuth(() =>
      ticketService.getTicketDetail(selectedTicket.ticket.id)
    )
      .then((detail) => { if (mountedRef.current) setSelectedTicket(detail); })
      .catch(() => {});
  }, 30_000);
  return () => clearInterval(interval);
}, [selectedTicket?.ticket.id, executeWithAuth]);
```

### 4. `supabase/itsts-migrations/20260318000000_add_comment_body_index.sql`

```sql
-- Composite index for fast comment loading ordered by time
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_time
  ON public.ticket_comments (ticket_id, created_at ASC);
```

Applied to: `hhikjgrttgnvojtunmla`

---

## No Changes Needed

- `advisor-forgot-password/index.ts` — already uses correct `token_hash` URL to `advisor.mpb.health/reset-password`
- `TicketService.ts` — response shape preserved via PostgREST alias
- `Login.tsx` — auth flow correct
- `ResetPassword.tsx` — token_hash + PASSWORD_RECOVERY flows correct
- `_shared/cors.ts` — allowlist already includes both production domains

---

## Deployment Checklist

1. Deploy `ticket-proxy` to `dtmnkzllidaiqyheguhl` (primary)
2. Deploy `ticket-proxy` to `hhikjgrttgnvojtunmla` (secondary — same function, same fix required)
3. Deploy `send-ticket-notification` to `dtmnkzllidaiqyheguhl` (no code change, but redeploy to ensure `_shared/` bundle is current)
4. Deploy advisor-portal frontend (Vercel)
5. Apply new ITSTS migration to `hhikjgrttgnvojtunmla`
6. Verify these secrets exist on `ticket-proxy` in `dtmnkzllidaiqyheguhl`: `ITSTS_SUPABASE_URL`, `ITSTS_SERVICE_ROLE_KEY`, `WARMUP_CRON_SECRET`, `RESEND_API_KEY`, `SUPPORT_TEAM_EMAIL`
7. Invoke `bulk-sync-itsts` edge function (already exists in `supabase/functions/bulk-sync-itsts/`) to sync existing advisors to ITSTS profiles. This resolves BUG-3 and BUG-4 together.

---

## Success Criteria

- Advisor submits ticket → ticket appears in ITSTS staff view
- Advisor replies to ticket → reply saves successfully
- Staff replies via ITSTS MessageComposer → advisor sees reply (within 30s without manual refresh)
- Staff adds comment via admin portal → saves correctly
- New advisors can submit tickets on first try (ITSTS profile auto-provisioned)
- In-app notifications fire for ticket events
