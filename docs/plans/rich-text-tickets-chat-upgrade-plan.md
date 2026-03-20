# Rich text, links, images & files — Tickets + Chat (Advisor, Admin, ITSTS)

**Status:** P0/P1 **partially implemented** (rich text only, no file attachments) — see below · **Scope:** Advisor Portal, Admin Portal, ITSTS-backed ticket threads (team chat still plain text — future phase)

### Implemented (P0–P1, rich text only)

- **ITSTS:** migration `supabase/itsts-migrations/20260321120000_ticket_comment_content_format.sql` adds `content_format` (`plain` | `html`).
- **Edge:** `ticket-proxy` reads/writes `content_format`, sanitizes HTML via `supabase/functions/_shared/ticketHtmlSanitize.ts` (`npm:sanitize-html`), plain-text previews for email notifications.
- **Client:** `@mpbhealth/advisor-core` `TicketComment` + `replyToTicket` / `addComment` accept optional `content_format`.
- **UI:** When `VITE_RICH_TICKET_EDITOR=true`, **Admin** [`TicketDetail`](../apps/admin-portal/src/pages/TicketDetail.tsx) and **Advisor** [`Tickets`](../apps/advisor-portal/src/pages/Tickets.tsx) / [`AdminTickets`](../apps/advisor-portal/src/pages/AdminTickets.tsx) use Tiptap (`TicketRichReplyEditor`: bold/italic/list/link, **image** + **file** attachments via `ticket-attachments` storage) + `sanitizeHtml` for display; otherwise legacy `<textarea>` and plain.
- **Flag:** `VITE_RICH_TICKET_EDITOR` — see each app’s `.env.example`; local dev defaults to on via `.env.development` (production: set in CI / host).

**Deploy order:** Apply ITSTS migration → deploy `ticket-proxy` → enable flag in staging/prod.

**DOM context you shared** matches **Admin Portal** ticket detail (`space-y-6`, “Back to tickets”, `#3478`, status/priority controls): [`apps/admin-portal/src/pages/TicketDetail.tsx`](../apps/admin-portal/src/pages/TicketDetail.tsx).  
Advisor-facing ticket UI is similar in [`apps/advisor-portal/src/pages/Tickets.tsx`](../apps/advisor-portal/src/pages/Tickets.tsx).

---

## 1. Current state (evidence from codebase)

### 1.1 Tickets (ITSTS via `ticket-proxy`)

| Layer | Behavior |
|-------|----------|
| **Storage** | ITSTS Supabase `ticket_comments.body` — plain text inserted in [`replyToTicket` / `addComment`](../supabase/functions/ticket-proxy/index.ts) (`body: content.trim()`). |
| **API** | Edge function `ticket-proxy`: actions `reply`, `add_comment`; `content` string; `MAX_COMMENT_LENGTH = 10_000`. |
| **Client** | [`TicketService`](../packages/advisor-core/src/support/TicketService.ts) `addComment` / `replyToTicket` send JSON `content`. |
| **UI** | **Admin** [`TicketDetail.tsx`](../apps/admin-portal/src/pages/TicketDetail.tsx): `<textarea>` for reply. **Advisor** [`Tickets.tsx`](../apps/advisor-portal/src/pages/Tickets.tsx): `<textarea>` `maxLength={10000}`. |
| **Rendering** | `comment.content` shown as `<p className="... whitespace-pre-wrap">` — **no HTML**; safe but no rich formatting. |
| **Email** | `send-ticket-notification` payload includes `comment: body.content?.slice(0, 500)` — **plain text** for preview. |

### 1.2 Team chat (Advisor Portal — not ITSTS)

| Layer | Behavior |
|-------|----------|
| **Storage** | Primary project `chat_messages` (realtime via `ChatService`). |
| **UI** | [`MessageComposer.tsx`](../apps/advisor-portal/src/components/chat/MessageComposer.tsx) — `<textarea>`, Enter to send, **no rich text**. |

**Implication:** Tickets and chat are **two different backends**. A “full upgrade” touches **both** data models and UIs, with shared **component patterns** (e.g. shared package) but **separate** migrations and storage policies.

---

## 2. Goals (what “full” means)

| Capability | Tickets | Chat |
|------------|---------|------|
| Bold / italic / lists | Yes | Yes |
| Hyperlinks (safe) | Yes | Yes |
| Inline images | Yes (with storage + CSP) | Yes |
| File attachments | Yes (PDF, images, size limits) | Optional / same pattern |
| No XSS / no broken email | Required | Required |
| Backward compatible | Old plain-text rows must render | Old messages must render |

---

## 3. Recommended architecture

### 3.1 Content format (single choice for v1)

- **Store** `body` as **sanitized HTML** *or* **Markdown** (stored as text).
  - **HTML (sanitized)** — Tiptap can `exportHTML`; render with DOMPurify (already in [`@mpbhealth/utils`](../packages/utils) — `sanitizeHtml` / rich-text helpers). Aligns with CRM email/Tiptap usage.
  - **Markdown** — smaller DB; render with `sanitizeHtml` after markdown pipeline; links need careful allowlist.
- **Recommendation:** **HTML + DOMPurify allowlist** for tickets and chat messages, with explicit `content_type` default `'text'` → migrate rows to `'html'` when edited.

Add ITSTS (and chat DB) columns if needed:

- `content_format` enum: `plain` | `html` (default `plain` for legacy rows).
- Or: detect format with heuristic (e.g. starts with `<` and contains known tags) — **fragile**; prefer explicit column.

### 3.2 Attachments (separate from body)

Do **not** embed huge base64 in `body`.

- New table **`ticket_comment_attachments`** (ITSTS): `id`, `comment_id`, `storage_path`, `file_name`, `mime_type`, `size_bytes`, `created_at`, `uploaded_by`.
- **Supabase Storage** bucket `ticket-attachments` (private), signed URLs for download; upload via **signed upload** from client or small Edge Function that validates MIME/size.
- **Chat:** mirror pattern `chat_message_attachments` in primary DB if product wants parity.

### 3.3 Shared UI package (monorepo)

- New package or extend **`@mpbhealth/ui`**: `RichMessageEditor` (Tiptap) + toolbar: bold, italic, link, bullet list, **upload image** (inserts `<img src="signed-url">` or placeholder + attachment ref), **attach file** chip list.
- **CRM** already uses Tiptap — reuse extensions catalog and patterns from [`apps/crm`](../apps/crm/package.json) where possible to avoid three divergent editors.

### 3.4 API changes (`ticket-proxy`)

**Phase A — Rich text only (no files)**

- Continue sending `content` as string; content may contain **sanitized HTML** (still ≤ `MAX_COMMENT_LENGTH` or raise limit for HTML overhead).
- Server-side: optional **second sanitize** in Edge Function before insert (defense in depth).
- Notifications: strip tags for `comment` preview or send first N **plain** chars (`textContent` equivalent in Deno).

**Phase B — Attachments**

- New actions: `request_attachment_upload` (returns signed URL + path) or multipart `add_comment_with_attachments` (heavier).
- Prefer **two-step**: create comment → get `comment_id` → upload files linked to `comment_id` (or temp staging with cleanup job).

---

## 4. Phased rollout (minimize breakage)

| Phase | Deliverable | Risk |
|-------|-------------|------|
| **P0 — Foundation** | DOMPurify render path for **display** only: if `content_format === html`, render sanitized HTML; else `whitespace-pre-wrap` plain. No editor change yet. | Low — read path only behind flag |
| **P1 — Editor swap** | Replace `<textarea>` with Tiptap in **Admin** `TicketDetail` + **Advisor** `Tickets` (and `AdminTickets` if duplicate composer). Submit HTML; set `content_format`. | Medium — test all reply paths |
| **P2 — ITSTS schema** | Migration: `content_format`, optional increase `body` column size if needed. Backfill: all existing → `plain`. | Low |
| **P3 — Attachments** | Storage bucket + RLS + `ticket_comment_attachments` + UI file picker + download links in thread | Medium–High |
| **P4 — Chat** | Same `RichMessageEditor` in `MessageComposer`; migrate `chat_messages` schema + realtime payload size limits | Medium |
| **P5 — Email / notifications** | HTML → text for email body; optional multipart HTML email later | Medium |

**Feature flag:** e.g. `VITE_RICH_TICKET_EDITOR` to fall back to textarea if issues in production.

---

## 5. Security & compliance

| Topic | Action |
|-------|--------|
| **XSS** | Sanitize on save **and** on display; strict allowlist (`p`, `br`, `strong`, `em`, `a[href]`, `ul`, `ol`, `li`, `img[src|alt]` from trusted storage only). |
| **Links** | `rel="noopener noreferrer"`, `https:` only (or allowlist domains). |
| **Files** | MIME allowlist (pdf, png, jpeg, gif, webp), max size (e.g. 10–25 MB), virus scan if policy requires. |
| **PHI** | If tickets may contain PHI, document retention on attachments and access logging; align with BAA. |
| **RLS** | ITSTS policies must scope attachments to ticket participants; no public bucket. |

---

## 6. Testing & “nothing breaks”

- **Regression:** list/detail/add_comment/reply/update_ticket unchanged for plain-text payloads.
- **Golden screenshots:** Admin + Advisor ticket thread before/after.
- **E2E (when auth available):** post plain reply → still renders; post HTML → renders correctly; internal note still hidden from advisor.
- **Notifications:** staff reply email still sends; preview readable without raw tags spam.
- **Load:** large HTML within limit; reject oversize with clear error.

---

## 7. Files to touch (initial map)

| Area | Files |
|------|--------|
| Admin ticket UI | [`apps/admin-portal/src/pages/TicketDetail.tsx`](../apps/admin-portal/src/pages/TicketDetail.tsx) |
| Advisor tickets | [`apps/advisor-portal/src/pages/Tickets.tsx`](../apps/advisor-portal/src/pages/Tickets.tsx), [`AdminTickets.tsx`](../apps/advisor-portal/src/pages/AdminTickets.tsx) (if separate composer) |
| Chat | [`apps/advisor-portal/src/components/chat/MessageComposer.tsx`](../apps/advisor-portal/src/components/chat/MessageComposer.tsx), [`ChatService`](../packages/advisor-core/src/chat/ChatService.ts) |
| API | [`supabase/functions/ticket-proxy/index.ts`](../supabase/functions/ticket-proxy/index.ts) |
| Types | [`packages/advisor-core/src/support/TicketService.ts`](../packages/advisor-core/src/support/TicketService.ts) types for comments |
| ITSTS | Migrations on **ITSTS** project (not only monorepo) — coordinate with whoever owns that Supabase |

---

## 8. Dependencies & effort (rough)

- **Tiptap** — already in CRM; add to Advisor/Admin apps if not present (bundle size — use lazy load for editor chunk).
- **DOMPurify** — via `@mpbhealth/utils` sanitizer.
- **Engineering:** 2–4 weeks for P0–P2 (rich text end-to-end); +1–2 weeks for attachments; chat parity +1 week.

---

## 9. Open decisions (product / eng)

1. **Email:** HTML in advisor-facing emails or plain-text only forever?  
2. **Chat:** Full parity with tickets or links + bold only for v1?  
3. **ITSTS repo:** Migrations may live outside this monorepo — **single source of truth** for ITSTS schema versioning.  
4. **Admin “ITSTS”** — confirm whether internal staff also use a separate ITSTS UI; if yes, align formats there too.

---

## 10. Summary

Today, **all ticket replies and chat messages are plain text** in `<textarea>` with **no shared rich editor** and **no attachment tables** in the paths we inspected. A safe upgrade is **phased**: display layer → sanitized HTML storage → Tiptap composers → attachments with private storage → chat parity. **Do not** paste raw HTML into the DB without sanitization; **do** keep legacy rows as `plain` until edited.

This plan aligns with the stabilization program: treat as **new feature work**, not Stage A stabilization — use [`stabilization-stage-checkpoint-template.md`](../stabilization-stage-checkpoint-template.md) for each phase with explicit files and verification evidence.
