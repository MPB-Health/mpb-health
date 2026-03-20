# Optional portal smoke tests

These specs are **skipped by default** so CI and local runs do not hit production URLs without credentials.

## CRM shell

1. Start CRM locally: `pnpm dev:crm`
2. Set `E2E_CRM_URL` (e.g. `http://localhost:5173`) and run:

```bash
pnpm exec playwright test tests/e2e/smoke/crm-shell.spec.ts
```

## Diagnostics

Subscribe to `mpb:portal-diag` in the browser console:

```js
window.addEventListener('mpb:portal-diag', (e) => console.log(e.detail));
```

Use this during manual QA to capture permission timing, modal open timing, and (in dev) query refetch-storm warnings.
