# ARYX Accounts naming foundation

**ARYX Accounts** (`nubejeaijuivdhggewkl` / https://nubejeaijuivdhggewkl.supabase.co)
is the ecosystem source of truth for organization **name**, **slug**, and
**Accounts org UUID**.

All ARYX products must converge toward these values. Product databases may keep
local primary keys when needed, but cross-app SSO, licensing, and command-center
flows pass **`org_id` (Accounts UUID)** — never slug alone for entitlement.

## Canonical orgs (Accounts)

| Name | Accounts org id | Canonical slug |
|------|-----------------|----------------|
| MPB Health | `00000000-0000-4000-a000-000000000001` | `mpb` |
| HSA For America | `a5b1e266-5cc3-42b7-acf2-df311ac149ef` | `hsaforamerica` |
| Meridian Benefits | `c02b660e-a453-409f-bc73-18efa238639c` | `meridian-benefits-zpjc` |

## Known drift (do not “fix” by mutating live EnrollFlow)

| System | Project | MPB slug today | MPB id today | Notes |
|--------|---------|----------------|--------------|-------|
| Accounts | `nubejeaijuivdhggewkl` | `mpb` | `00000000-…0001` | Canonical |
| MPB MonoRepo | `dtmnkzllidaiqyheguhl` | `mpb-health` (+ alias `mpb`) | membership UUID matches Accounts; portal UUID differs | Ops/PHI stay here |
| EnrollFlow | `ciowhwoapfokiiflubxs` | `mpb-health` | `a0000000-…0001` | **Live billing/members — no writes in Platform Command Center v1** |

EnrollFlow already has an empty `aryx_org_links(accounts_org_id, enrollflow_org_id, …)`
table for additive bridging later. Populating it (or renaming EnrollFlow orgs)
requires a separate approved plan and must not touch payment or member rows.

## MonoRepo alias

`packages/auth` and `supabase/functions/_shared/orgIdResolver.ts` resolve both:

- `mpb-health` (legacy monorepo slug)
- `mpb` (Accounts canonical slug)

to the same membership / portal UUID pair. Prefer Accounts UUID in new code.

## Platform Command Center

App: `apps/platform-command-center` — single Accounts Supabase client only.
See that app’s README for setup.
