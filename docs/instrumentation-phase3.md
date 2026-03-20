# Phase 3 — Instrumentation

Implemented client-side diagnostics to support verification and future APM wiring. **Nothing here replaces** staging/production traces or manual QA.

## Events

| Mechanism | Name | Payload |
|-----------|------|---------|
| `window` `CustomEvent` | `mpb:portal-diag` | `PortalDiagnosticPayload` from `@mpbhealth/utils` |

Subscribe in DevTools:

```js
window.addEventListener('mpb:portal-diag', (e) => console.log(e.detail));
```

## Emitters (CRM)

| Kind | Source | When |
|------|--------|------|
| `permission_load` | `apps/crm/src/contexts/OrgContext.tsx` | After `loadUserPermissions` completes or throws (`durationMs`, `success`, `detail` = org id) |
| `modal_open` | `apps/crm/src/components/Modal.tsx` | First `requestAnimationFrame` after `open` becomes true (`detail` = title prefix) |
| `crm_query_refetch_storm` | `apps/crm/src/query/crmQueryDiagnostics.ts` | **DEV only** — same query key enters `fetching` ≥4 times within `queryStormWindowMs` |

## Thresholds

Defined in `PORTAL_DIAG_THRESHOLDS` (`packages/utils/src/portalDiagnostics.ts`):

| Constant | Value | Purpose |
|----------|-------|---------|
| `slowPermissionMs` | 4000 | Console warning in dev |
| `slowModalOpenMs` | 600 | Console warning in dev |
| `queryStormWindowMs` | 1500 | Storm detection window |
| `queryStormMinFetches` | 4 | Fetches per window to flag storm |

## API surface

- `emitPortalDiagnostic(payload)` — fire-and-forget
- `subscribePortalDiagnostics(handler)` — unsubscribe function

## Future APM

Map `mpb:portal-diag` in the app bootstrap (e.g. one `useEffect` in `main.tsx`) to Azure Application Insights `trackEvent` with properties `{ kind, durationMs, app, detail }`. **Do not** ship PII in `detail` when wiring to cloud telemetry.
