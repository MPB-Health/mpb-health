# Engineering guardrails — portals & data layer

Permanent standards for the MPB Health monorepo. Align new work with Phase 2 / 2b / 3 remediation.

## Context providers

- **Memoize** context values when the value is an object/array created in the provider (`useMemo` + stable deps).
- **Split** “service factories / clients” from “high-churn server snapshots” so consumers can subscribe narrowly (`useCRMService()` vs full `useCRM()` where it matters).
- **Avoid** putting unrelated async state in one giant context without query deduplication.

## Loading UX

- **No silent blank shells**: permission and org loading must show **spinner or explicit message**, not an empty layout that looks frozen.
- **Distinguish** load failure from **deny**: use `permissionsError` + retry for recoverable failures; `AccessDenied` only when `can()` is false with a loaded permission set.

## Server state ownership

- **TanStack Query** owns **refetchable, cacheable** server slices (CRM dashboard bundle, recent leads, tasks, calendar, Advisor nav where applicable).
- **Context** holds **auth/org identity**, **permission checks**, and **service factories** — not a duplicate copy of query data unless merged for backward compatibility.

## TanStack Query keys

- **Prefix with org/tenant id** for any org-scoped data (`crmQueryKeys` pattern).
- **Export** key factories from a single module; do not inline string keys in components.
- **Invalidate** the smallest subtree possible after mutations (e.g. `recentLeads` + `dashboard`, not the whole tree unless necessary).

## Timeouts & cancellation

- Use **`withTimeout`** for portal-critical Supabase calls without native abort.
- Pair with **stale guards** (`cancelled` flags, `orgIdRef` checks) so late responses do not overwrite state after navigation or org switch.

## Realtime → cache

- **Debounce** or **coalesce** invalidations (CRM lead submissions → debounced `invalidateQueries`).
- **Do not** chain unconditional full refreshes on every realtime tick.

## Overlays & scroll

- **Ref-count** body scroll lock when multiple modals/overlays stack.
- **Modal lifecycle**: open fast; load data inside with loading state; guard against stale updates after close.

## Route shells

- **Critical path** should render shell + loading affordances quickly; **secondary** fetches must not block the whole app indefinitely (safety timeouts on org/permission loads).

## Backend tuning

- **Evidence first**: `EXPLAIN (ANALYZE, BUFFERS)`, APM slow traces, or `pg_stat_statements` — not guesswork.
- **Indexes** must match **filter columns** used under RLS; document every migration.

## Testing

- **Unit-test** query key shape and invalidation prefixes.
- **E2E smoke** optional behind env (`E2E_CRM_URL`); do not point CI at production without credentials and approval.
