# Phase 2 — Stabilization patterns (MPB Health monorepo)

Shared utilities and conventions introduced or reinforced in this pass.

## Async / timeouts (`@mpbhealth/utils`)

- **`withTimeout(promise, ms, label)`** — Races a promise against a timer; rejects with `TimeoutError`. The underlying HTTP request is **not** aborted unless the caller uses `AbortSignal` with a fetch client that supports it.
- **`isTimeoutError(err)`** — Type guard for user-visible timeout handling.
- **`abortAfterMs(ms)`** — Returns `{ signal, abortCleanup }` for `useEffect` cleanups.

Use timeouts on portal-critical Supabase calls where the client does not expose abort, and pair with **stale-update guards** (`cancelled` flag in `useEffect`) so results are ignored after unmount or modal close.

## CRM permission UX (`PermissionGate`)

- **`permissionsLoading`** → spinner panel (no blank screen).
- **`permissionsError`** → retry UI for non–org-admins; **owners/admins** still pass through because `can()` does not depend on the permission row set.

## CRM realtime (`CRMContext`)

- Lead submission realtime handlers **debounce** dashboard + leads refresh (~1.2s) to prevent refetch storms.

## CRM initial org load (`CRMContext`)

- **Critical path** (blocking `loading`): `refreshDashboard` + `refreshLeads` under one timeout — enough for shell + main widgets.
- **Secondary** (non-blocking): `refreshTasks` + `refreshCalendar` run immediately after; failures log only.

## Body scroll lock (`apps/crm/src/utils/bodyScrollLock.ts`)

- **`acquireBodyScrollLock()`** — ref-counted; safe when multiple modals/overlays stack.

## Email composer modal

- **`EmailComposerHandle.discard`** — imperative close path aligned with discard confirmation (`window.confirm` when dirty).
- Outer header / backdrop close call `discard()` — no bypass of confirmation.
- **Escape** — handled inside `EmailComposer` (closes schedule sub-modal first, then discard flow).

## Incremental next steps (Phase 2b / 3)

Shipped detail and checklists:

- **[Phase 2b — architecture remediation](./stabilization-phase2b.md)** — CRM service split, TanStack Query for shell slices, `get_my_org_permissions_snapshot` RPC, index notes.
- **[Phase 3 — verification & release](./stabilization-phase3-checklist.md)** — typecheck, DB/RPC smoke, permission/org regression, instrumentation.

Still open for later passes:

- Virtualize very large CRM tables; APM-backed index/query tuning beyond the Phase 2b index + RPC.
- Supabase client `AbortSignal` where supported for true cancellation after timeout.

## TanStack Query (Advisor Portal)

- **`ADVISOR_NAV_MENU_QUERY_KEY`** — Single exported `as const` tuple for nav menu query reads/writes to avoid key drift.

## Modal data loading

- Modals **open immediately**; account/contact lists use **in-modal** loading text, **timeout** via `withTimeout`, **retry** tokens, and **cancelled** flags to avoid stale state after close.

## Database

- Migration `20260320120000_phase2_role_permissions_org_role_index.sql` adds `idx_role_permissions_org_role` for `(org_id, role)` filters.

Apply locally: `supabase db push` or your usual migration pipeline.
