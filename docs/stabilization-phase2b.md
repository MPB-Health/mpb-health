# Phase 2b — Deep architecture remediation

This document records **what shipped** in Phase 2b: CRM state layering, selective TanStack Query adoption, batched permission loading, and evidence-oriented DB support. It complements [`stabilization-phase2.md`](./stabilization-phase2.md).

## 1. Architecture remediation summary

### What changed

| Area | Change | Why |
|------|--------|-----|
| **CRM server state** | Dashboard bundle, recent leads, tasks, and calendar are loaded via **TanStack Query** with org-scoped keys. | Dedupe in-flight work, stale-while-revalidate, targeted invalidation instead of ad-hoc refresh chains. |
| **CRM service boundary** | **`CRMServiceContext`** holds stable service factories + `user` / `orgId`; **`CRMQueryDataProvider`** owns query hooks. | Subscribers that only need API clients can use **`useCRMService()`** and avoid rerenders from dashboard/leads/tasks/calendar updates. |
| **`useCRM()`** | Still exposes the merged **`CRMContextType`** shape for compatibility. | Incremental migration; consumers do not need a single big-bang rewrite. |
| **Realtime** | Lead-subscription handler **debounces** invalidation of `recentLeads` + `dashboard` query keys. | Reduces refresh storms under bursty notifications. |
| **Permissions** | **`get_my_org_permissions_snapshot(p_org_id uuid)`** RPC returns role + permission keys in **one round trip**; **`loadUserPermissions`** tries RPC first, then **PostgREST fallback**. | Fewer chained client calls on the hot path; preserves behavior if RPC is unavailable. |
| **Org role** | **`OrgContext`** sets **`orgRole`** from the permission load result (no separate membership query for role). | Aligns role with the same snapshot as permissions. |
| **Indexes** | **`idx_role_permissions_org_role`** on `(org_id, role)`. | Supports the role_permissions join path used by permission resolution and the RPC. |

### Risk removed

- **Duplicate parallel fetches** for the same org slice (within cache windows).
- **Uncontrolled invalidation** from realtime (debounced).
- **Permission load latency** from multiple sequential PostgREST round trips (when RPC is deployed).
- **Subtle role/permission drift** from two independent loads (single snapshot path).

### What is intentionally not yet done

- **`useCRM()`** still merges all query-driven slices; components that need minimal subscriptions should move to **`useCRMService()`** + focused queries/hooks over time.
- **Activities feed**, full lead lists, and other pages may still use local/context patterns — only the **highest-churn shell slices** were migrated first.
- **Production APM traces** were not attached in-repo; backend tuning beyond the index + RPC is **methodology** (see §7).

---

## 2. File list (Phase 2b–related)

| File | Change |
|------|--------|
| `apps/crm/package.json` | `@tanstack/react-query` dependency. |
| `apps/crm/src/query/crmQueryKeys.ts` | Stable **query key factories** per org. |
| `apps/crm/src/query/crmQueryClient.ts` | Shared **QueryClient** defaults. |
| `apps/crm/src/contexts/CRMServiceContext.tsx` | **Services-only** provider + `useCRMService`. |
| `apps/crm/src/contexts/CRMContext.tsx` | **QueryClientProvider** → `CRMServiceProvider` → query-backed provider; **invalidate** refresh APIs; realtime debounce. |
| `apps/crm/src/contexts/OrgContext.tsx` | **orgRole** from `loadUserPermissions`; clear on no org / error. |
| `packages/auth/src/services/permissionService.ts` | **RPC-first** `loadUserPermissions`, **PostgREST fallback**; typed timeouts. |
| `supabase/migrations/20260320150000_get_my_org_permissions_snapshot.sql` | RPC + **GRANT EXECUTE** to `authenticated`. |
| `supabase/migrations/20260320120000_phase2_role_permissions_org_role_index.sql` | Index on `(org_id, role)`. |

---

## 3. TanStack Query — migrated flows

| Flow | Query key | Notes |
|------|-----------|--------|
| Dashboard bundle (stats, pipeline stages, deal stages, recent activities) | `crmQueryKeys.dashboard(orgId)` | Single `queryFn` parallelizing `getDashboardStats`, `getPipelineStages`, `getStages`, `getRecentActivities`. |
| Recent leads (first page) | `crmQueryKeys.recentLeads(orgId)` | `getLeads({}, 10, 0)`. |
| Tasks due today + overdue | `crmQueryKeys.tasks(orgId)` | Parallel `getTasksDueToday` + `getOverdueTasks`. |
| Upcoming calendar events | `crmQueryKeys.calendar(orgId)` | `getUpcomingEvents(30)`. |

**Defaults (see `crmQueryClient.ts`):** `staleTime` 45s per query in provider, `gcTime` 5m, `retry: 1`, `refetchOnWindowFocus: false`. Org id is part of every key so **org switches never read another org’s cache**.

**Invalidation**

- **`refresh*`** methods → `queryClient.invalidateQueries` for the matching key.
- **Realtime** (lead submissions) → debounced invalidation of **recent** + **dashboard** only.

**Transitional pattern**

- Keep using **`useCRM()`** where the full snapshot is acceptable.
- Prefer **`useCRMService()`** + direct queries (or future thin hooks) when a subtree must not rerender on unrelated CRM data.

---

## 4. Permission batching — contract & security

### RPC

- **Name:** `public.get_my_org_permissions_snapshot(p_org_id uuid)`
- **Returns:** `jsonb` with:
  - `error`: `null` | `'not_authenticated'` | `'no_membership'`
  - `membership`: `{ "role": "<role>" }` or null JSON
  - `permissions`: JSON array of permission **key** strings

### Security

- **`SECURITY INVOKER`** — runs as the caller; **`auth.uid()`** inside the function.
- **RLS** on underlying tables still applies to the same extent as direct PostgREST calls (membership + role_permissions join).
- **No service role** in the client path; **EXECUTE** granted to **`authenticated`** only.

### Frontend

- **`loadUserPermissions`** uses RPC when it returns a usable snapshot; otherwise **PostgREST** path (membership + role_permissions) unchanged.
- **Cache:** existing in-memory TTL cache unchanged (`invalidatePermissionCache` on org switch).
- **Failure:** `null` from `loadUserPermissions` → same consumer behavior as before (gates, OrgContext).

### Retry

- `withTimeout` (8s) wraps RPC and PostgREST steps; RPC failure throws into fallback path rather than hard-failing the app.

---

## 5. Performance tuning report

### Evidence applied in-repo

1. **`idx_role_permissions_org_role`** — supports filtering `role_permissions` by `org_id` + `role` (permission resolution and RPC).
2. **RPC aggregation** — single SQL function aggregates permission keys instead of multiple HTTP round trips.

### Not claimed without production data

- End-to-end latency improvements (ms) require **APM** (e.g. Application Insights) or **Postgres** `pg_stat_statements` + **EXPLAIN (ANALYZE, BUFFERS)** on staging.

### Recommended Phase 3 follow-up

- Capture **slow query** names / endpoints from traces.
- Run **EXPLAIN** on: permission RPC, dashboard aggregates, lead list, tasks, events (as listed in audit docs).
- Add or adjust indexes only when a plan shows **sequential scans** or **high buffer** cost on hot filters.

---

## 6. Deferred items (Phase 3+)

- Narrow **`useCRM()`** subscribers via granular hooks / context selectors.
- Migrate additional CRM flows (full lead lists, activities-only feeds, page-level data) where rerender or fan-out cost justifies it.
- **Measured** performance report tied to traces and query plans.
- Optional: regenerate Supabase **generated types** for `get_my_org_permissions_snapshot` to remove casts in `permissionService`.

---

## 7. Supabase CLI

```bash
# From repo root
supabase db push
# or apply migrations in your CI/CD pipeline
```

Ensure `20260320150000_get_my_org_permissions_snapshot.sql` runs **before** relying on RPC-first permission loading in production.
