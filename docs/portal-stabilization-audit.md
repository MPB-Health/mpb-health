# Portal stabilization audit (MPB Health monorepo)

This document captures **verified root causes** addressed in-code, **remaining risk areas** for follow-up sprints, and a **QA checklist**.

## 1. Root cause report (this pass)

| Area | Severity | Location | Symptom | Fix applied |
|------|-----------|----------|---------|-------------|
| Mega-context identity churn | **High** | `apps/crm/src/contexts/CRMContext.tsx` | Any CRM state update (or parent re-render) produced a **new** `value={{ ... }}` object every time, forcing **all** `useCRM()` subscribers to re-render. | Memoized provider value with `useMemo`. |
| Org context churn | **Medium** | `apps/crm/src/contexts/OrgContext.tsx` | Same pattern: inline provider object → broad re-renders on permission/org updates. | Memoized provider value with `useMemo`. |
| Admin context churn | **Medium** | `apps/admin-portal/src/contexts/AdminContext.tsx` | `hasPermission` was a new function each render; combined with inline `value={{}}` → unnecessary subtree work. | `useCallback` for `hasPermission`, `useMemo` for provider value. |
| CRM initial load hang | **High** | `CRMContext` `loadInitialData` | `await Promise.all([...])` with no upper bound: one stuck Supabase call could leave **`loading === true` indefinitely**. | Wrapped in `withTimeout(..., 45s)`; **always** `setLoading(false)` in `finally`. |
| Shared auth roles hang | **Medium** | `packages/auth/src/contexts/AuthContext.tsx` | `getUserRoles` could stall; `rolesLoading` stayed true. | `withTimeout(..., 15s)` around role fetch; empty roles on failure. |
| Permission service typing / builder misuse | **Medium** | `packages/auth/src/services/permissionService.ts` | Local `withTimeout` expected `Promise` but received Postgrest **builders** (not assignable). Broke `dts` build. | Use shared `withTimeout` from `@mpbhealth/utils` + `Promise.resolve(builder)`. |
| Admin user profile hang | **Medium** | `apps/admin-portal/src/contexts/AdminContext.tsx` | `userService.getUser` could block session resolution. | `withTimeout(..., 20s)`; user-facing `error` on timeout; `setError(null)` on success. |
| React Query retry / focus refetch storms | **Low–Medium** | `apps/advisor-portal/src/main.tsx` | Default `retry` + `refetchOnWindowFocus` can amplify failures and background churn. | `retry: 1`, `refetchOnWindowFocus: false`, `mutations.retry: 0`. |

## 2. Shared utilities added

| Export | Package | Purpose |
|--------|---------|---------|
| `withTimeout`, `TimeoutError`, `isTimeoutError`, `abortAfterMs` | `@mpbhealth/utils` | Central timeout + optional abort pairing for portal-critical async work. |

**Dependency:** `@mpbhealth/auth` now depends on `@mpbhealth/utils` (shared `withTimeout` + role fetch).

## 3. Worst offenders (historical / ongoing watchlist)

| Category | Files / areas |
|----------|----------------|
| Large CRM surface | `crm-core` services + CRM pages with tables/filters (client-side sort/filter on big lists) |
| Modals | `apps/crm/src/components/*Modal*.tsx` — confirm each opens **before** heavy fetch; use skeleton + abort on close in follow-up |
| Advisor shell | `apps/advisor-portal/src/layouts/MainLayout.tsx` — many hooks; keep nav query keys stable (already uses `['advisor-nav-menu']`) |
| Admin dashboard | `AdminContext` metrics + enrollment subscription — debounce already present; verify metrics calls on slow networks |

## 4. High‑latency risk (backend / network)

- Org permission path: `loadUserPermissions` → `org_memberships` + `role_permissions` (now wrapped with `withTimeout` + `Promise.resolve`).
- CRM dashboard initial bundle: `getDashboardStats`, `getPipelineStages`, `getStages`, `getRecentActivities`, `getLeads`, tasks, calendar — parallel; **45s** client cap; individual queries may still be slow (indexes / RLS review in a DB pass).

## 5. Modal flows to review next (Phase 2)

- Any modal that **awaits** a network call **before** setting `open={true}`.
- Drawers that load full record graphs on first paint without `AbortController` / request id.

## 6. Long‑term guardrails

1. **No inline `value={{}}`** for React contexts that sit near the app root — always `useMemo` (or split contexts).
2. **No unbounded `await`** for “gate” loading flags — pair with `withTimeout` or `AbortSignal`.
3. **Supabase builders** → pass through `Promise.resolve(...)` when using `withTimeout` (builders are `PromiseLike`, not `Promise`).
4. **React Query**: set defaults per app; opt-in `refetchOnWindowFocus` only where safe.
5. **Modals**: open first, skeleton inside, fetch after mount, cancel on close.

## 7. Verification QA checklist

### Advisor Portal
- [ ] Cold load: shell appears without infinite spinner; login redirect works after refresh.
- [ ] Navigation: route changes do not freeze; lazy chunks recover on error.
- [ ] Tickets / inbox: no permanent loading after network toggle.

### CRM
- [ ] Org switch: dashboard loads or shows empty/error within ~45s worst case; never infinite global loading.
- [ ] Leads/pipeline tables: filtering remains responsive (large lists).
- [ ] Modals: open instantly; forms submit; errors visible.

### Admin Portal
- [ ] Login: profile load times out gracefully with message (simulate slow API).
- [ ] Dashboard metrics refresh without locking UI.

### Cross‑cutting
- [ ] Session refresh / tab focus: no unexpected refetch storms (Advisor RQ defaults).
- [ ] Permissions: CRM gates work after permission load or timeout.

---

*Generated as part of the stabilization pass; extend with profiling results (e.g. React Profiler, network waterfall) as you run Phase 2.*
