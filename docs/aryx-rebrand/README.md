# ARYX rebrand — Phase 0 (Org Table Unification)

The mpbhealth-monorepo will be white-labeled as the ARYX platform with mpb health as the first tenant. Phase 0 unifies a schema-level defect (two parallel org tables) so that any subsequent rebrand work — tenant-themed CSS variables, license-gated modules, multi-tenant onboarding — can be built on a sound foundation.

## Files

| File | Purpose | Run when |
|---|---|---|
| `phase-0-org-table-unification.md` | Phase 0 design spec. The "why" and the "what". | Read first. |
| `phase-1-tenant-seed.md` | Phase 1 design spec — mpb as fully provisioned tenant. | Read after Phase 0 spec. |
| `01-preflight.sql` | Phase 0.A read-only assertions. | Day-of, ~1 hour before cutover. |
| `02-migration-phase0a.sql` | Reversible: adopts `organizations`, retargets FKs, renames `orgs` → `orgs_deprecated` + compat view. | Sunday 2026-05-17 06:00 ET. |
| `03-migration-phase0b.sql` | Irreversible: drops `orgs_deprecated`. | Sunday 2026-05-24 06:00 ET, after soak. |
| `04-code-audit.sh` | Greps application code for direct references to the `orgs` table. | During Phase 0.A development; CI gate before deploy. |
| `05-phase1-preflight.sql` | Phase 1 read-only assertions. | ~1 hour before Phase 1 deploy. |
| `06-migration-phase1-seed-mpb-tenant.sql` | Seeds `white_label_configs`, `organization_subscriptions`, 8 × `org_module_licenses` for mpb. Adds missing FKs. | Wednesday 2026-05-20 10:00 ET. |
| `07-phase1-rollback.sql` | Reversal: DELETE the seeded rows. | Only if Phase 1 misbehaves. |

## Sequence

1. **Pre-week (2026-05-12 → 2026-05-16)** — run `04-code-audit.sh`. Migrate any application code from `orgs` to `organizations`. Land those changes on `master` and deploy ahead of Sunday.
2. **Sunday 2026-05-17 ≈ 05:00 ET** — dry run Phase 0.A on a Supabase branch DB cloned from prod. Apply `01-preflight.sql`, review every output. If any assertion fails, abort.
3. **Sunday 2026-05-17 06:00 ET** — apply `02-migration-phase0a.sql` to production. Watch Vercel + Supabase logs for 30 min.
4. **2026-05-17 → 2026-05-19** — first 48 hours of soak. Monitor error rates daily. If anything regresses, rollback: drop the `orgs` view, rename `orgs_deprecated` back to `orgs`, reverse the FK retargets. (Worst case: PITR.)
5. **Wednesday 2026-05-20 ≈ 09:00 ET** — Phase 1 dry run on a branch DB. Apply `05-phase1-preflight.sql`.
6. **Wednesday 2026-05-20 10:00 ET** — apply `06-migration-phase1-seed-mpb-tenant.sql`. Mid-week deploy is safe because no app code reads these tables yet; rollback via `07-phase1-rollback.sql` is one transaction.
7. **2026-05-20 → 2026-05-24** — remainder of soak. Same monitoring.
8. **Sunday 2026-05-24 06:00 ET** — apply `03-migration-phase0b.sql`. End of org-table-defect story.

## What Phase 1 unblocks

After Phase 1, mpb has a complete `white_label_configs` row (palette, logos, fonts, support contacts, legal URLs), an enterprise `organization_subscriptions` row, and active licenses on all 8 modules. No app behavior changes — these tables are written but not yet read. That setup makes Phase 2 (the actual UI rebrand) a strictly visual, fully tested operation: mount `WhiteLabelProvider`, swap hardcoded `primary`/`brand` palettes for CSS-var consumers, gate routes with `ModuleGate`. Because mpb's row reproduces the current visible brand 1:1, mpb users should see zero visual change when Phase 2 ships.

## Open design question for Phase 2

`concierge-portal` uses a distinct teal palette (`#4A7C8A`), not mpb blue. See `phase-1-tenant-seed.md` §6 for the three options on how to handle this in Phase 2.
