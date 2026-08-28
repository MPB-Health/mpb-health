# Website Verbiage Compliance Report

**Date:** August 18, 2026
**Scope:** `apps/website/src` — public marketing pages, member portal pages, and shared copy/data files. Blog/CMS content stored in Supabase and third-party embeds were not scanned (see [Scope notes](#scope-notes)).
**Status:** In progress — steps 1 (Preventative → Preventive), 2 (sharing caps/limits → sharing maximums), 3 (cover/coverage/covered), 4 (pre-existing → pre-membership), and 5 (plan stragglers → membership) completed August 20, 2026; remaining steps pending.

---

## Word lists

### Accepted words

- Share, shared, shareable
- Insurance alternative
- Membership contribution
- Membership
- Join, sign-up
- Pre-membership
- Sharing request
- Preventive
- Sharing maximums
- Enroll, enrolled, enrollment

### Prohibited words

- Cover, coverage, covered
- Insurance
- Premium
- Deductible
- Policy
- Group plan, plan
- Pre-existing
- Guarantee payment or benefits
- Claim, claims
- Preventative
- Sharing caps or limits

---

## Summary of findings

| Prohibited term | Member-visible violations | Severity | Suggested replacement |
|---|---|---|---|
| Preventative | ~19 | **High** | Preventive |
| Claim / claims | ~40+ (entire member portal section) | **High** | Sharing request(s) |
| Sharing caps / limits | ~10 | **High** | Sharing maximums |
| Cover / coverage / covered | ~15 | **High** | Share / shared / shareable, "eligible for sharing", "membership includes" |
| Pre-existing | ~6 | Medium | Pre-membership (condition) |
| Plan / plans | ~6 remaining (most fixed in a prior sweep) | Medium | Membership(s) |
| Premium | ~3 (MPB context) | Low | Membership contribution / monthly share amount |
| Deductible | ~4 (MPB context) | Low | IUA (Initial Unshareable Amount) |
| Guarantee | 2 flagged for review | Low | Reword or remove |
| Insurance | Mostly compliant | Low | Keep only in disclaimers/comparisons; use "insurance alternative" |
| Policy / policies | Mostly exempt | Low | Membership guidelines (where it refers to MPB) |

---

## Detailed findings and suggested replacements

### 1. "Preventative" → "Preventive" — HIGH PRIORITY

The accepted spelling is **Preventive**; **Preventative** appears throughout the flagship benefit's copy.

| Location | Example |
|---|---|
| `apps/website/src/data/healthcareFeaturesData.ts` (18 instances, lines ~569–637) | Feature name **"Preventative Care (ACA-Mandated)"**, plus descriptions, how-it-works steps, and 4 FAQ entries |
| `apps/website/src/components/blocks/FAQAccordion.tsx` line 20 | "For preventative care services, there is a network of providers." |

**Suggested replacement:** straight swap `Preventative` → `Preventive` everywhere (the feature name becomes "Preventive Care (ACA-Mandated)"). Note `EnhancedPricingSection.tsx` already correctly says "Preventive Sharing" — this brings the rest in line.

---

### 2. "Claim / claims" → "Sharing request(s)" — HIGH PRIORITY

The **entire member portal claims section** uses insurance vocabulary that members see directly.

| Location | Example |
|---|---|
| `apps/website/src/pages/member/Claims.tsx` (~31 instances) | Page title "My Claims", "Submit New Claim", "Track and manage your healthcare claims", "No claims found" |
| `apps/website/src/pages/member/MemberPortalDashboard.tsx` (~19) | Claims widgets and labels on the member dashboard |
| `apps/website/src/pages/member/NewClaim.tsx` + route `/member/portal/claims` in `App.tsx` | URL itself says "claims" |
| `apps/website/src/pages/admin/ClaimsProcessing.tsx` (~50) | Staff-facing admin screen (lower priority, but same vocabulary) |
| `apps/website/src/types/memberPortal.ts`, `lib/memberPortalService.ts` | Data-layer naming (internal, cosmetic) |

**Suggested replacement:** "My Claims" → "My Sharing Requests"; "Submit New Claim" → "Submit a Sharing Request"; route `/member/portal/claims` → `/member/portal/sharing-requests` (with a redirect from the old URL). Good news: the marketing site already uses the right term — `healthcareFeaturesData.ts` line 712 says "the sharing request process."

**Exempt:** "claims" in `TermsAndConditions.tsx` (legal sense: "actions, claims, losses"); insurance-product FAQs in `voluntaryBenefitsData.ts` (see [section 11](#11-voluntary-benefits-pages--a-special-case)).

---

### 3. "Sharing caps / limits" → "Sharing maximums" — HIGH PRIORITY

| Location | Current text | Suggested |
|---|---|---|
| `data/healthcareFeaturesData.ts` lines 93–94 | Q: "Are there sharing limits?" A: "There are no lifetime limits or annual caps." | Q: "Are there sharing maximums?" A: "There are no lifetime or annual sharing maximums." |
| `components/blocks/PathExplainers.tsx` line 66 | "Sharing limits apply per medical need" | "Sharing maximums apply per medical need" |
| `components/blocks/ComplianceNoteMVP.tsx` line 13 | "waiting periods, and sharing limits apply" | "waiting periods, and sharing maximums apply" |
| `components/blocks/PlanComparisonGuide.tsx` line 35 | "Lifetime Sharing Limit" | "Lifetime Sharing Maximum" |
| `pages/BusinessesOrganizations.tsx` line 94 | "No Annual or Lifetime Caps" | "No Annual or Lifetime Sharing Maximums" |
| `lib/planUtils.ts` lines 103, 107 | "No lifetime caps" / "No annual caps" (rendered on membership cards) | "No lifetime sharing maximums" / "No annual sharing maximums" |
| `data/accordionItems.ts` line 51 | "all with no lifetime caps" | "all with no lifetime sharing maximums" |
| Admin-only: `components/admin/SharingDetailsForm.tsx`, `components/admin/PlanDetail.tsx` | "Sharing Caps", "Annual Cap", "Lifetime Cap" | Staff-facing; update for consistency when convenient |

---

### 4. "Cover / coverage / covered" → "share / shared / eligible for sharing" — HIGH PRIORITY

Most raw grep hits are CSS (`object-cover`) or code — the true copy violations are:

| Location | Current text | Suggested |
|---|---|---|
| `pages/Contact.tsx` line 42 | "help you find affordable, comprehensive **coverage** for you and your family" | "…find an affordable, comprehensive **membership** for you and your family" |
| `pages/MemberPortal.tsx` line 24 | "view your **coverage** details" | "view your **membership** details" |
| `data/healthcareFeaturesData.ts` line 312 | "How many therapy sessions are **covered**?" | "How many therapy sessions are **included**?" |
| `data/healthcareFeaturesData.ts` line 348 | "Our maternity care benefit **covers** prenatal visits…" | "…benefit **shares the costs of** prenatal visits…" |
| `data/healthcareFeaturesData.ts` lines 398–399 | "Are prenatal vitamins and classes **covered**?" / "…are **covered** under pharmacy benefits" | "…**included**?" / "…are **eligible for sharing** under pharmacy benefits" |
| `data/healthcareFeaturesData.ts` lines 597–598, 632, 667 | "**covered** services", "services are **covered** directly", "Are immunizations… **covered**?", "what's **covered**" | "**eligible** services", "services are **shared** directly", "…**included**?", "what's **shareable**" |
| `data/benefitsData.ts` lines 122, 137, 140 | "Complications and emergencies **covered**", "Mother and newborn care **covered**…", "Emergency services **covered**…" | "…**eligible for sharing**" / "…**shared**" |
| `pages/HowItWorks.tsx` lines 223, 288–291 | "pool resources to **cover** each other's medical…", "you **cover** your Initial Unshareable Amount", "**cover** the remainder" | "pool resources to **share** each other's medical…", "you **pay** your IUA", "**share** the remainder" |
| `data/accordionItems.ts` lines 5, 11 | "contribute money to help members **cover** medical expenses" (historical narrative) | "…help members **pay** medical expenses" |

**Exempt:** all `object-cover` / `backgroundSize: 'cover'` CSS classes; "covering the latest industry trends" (`JoinOurTeam.tsx`, unrelated sense); insurance-product pages (section 11); state-notice legal text.

---

### 5. "Pre-existing" → "Pre-membership" — MEDIUM

| Location | Current text |
|---|---|
| `pages/HowItWorks.tsx` lines 60–61, 117 | FAQ "What if I have a pre-existing condition?" + answer + eligibility copy |
| `components/blocks/ObjectionBlocks.tsx` line 61 | "Pre-existing conditions subject to a phase-in period" |
| `lib/onboarding/howItWorksSteps.tsx` line 90 | "Understand phase-in periods for pre-existing conditions." |
| `lib/schemaMarkup.ts` line 923 | SEO structured data: "pre-existing condition guidelines" |

**Suggested replacement:** "pre-membership condition(s)". `voluntaryBenefitsData.ts` line 689 already uses "pre-membership conditions" — this makes the rest consistent.

**Exempt:** internal field names (`preexisting_lookback_months`, `preexistingConditions` form state) and a code comment in `TrainingManager.tsx` — not member-visible, rename only if desired.

---

### 6. "Plan / plans" → "Membership(s)" — MEDIUM

A prior sitewide sweep (see `docs/wordChanges.md`) fixed most. Remaining member-visible stragglers:

| Location | Current text | Suggested |
|---|---|---|
| `components/navigation/GlobalSearch.tsx` lines 16, 19 | "Health sharing **plans** for individuals", "**Plans** & Pricing — Compare our **plans**" | "Health sharing **memberships**…", "**Memberships** & Pricing — Compare our **memberships**" |
| `components/navigation/MobileBottomNav.tsx` line 24 | Nav label "**Plans**" | "**Memberships**" |
| `pages/MemberDashboard.tsx` line 182 | "Your **Plan**" | "Your **Membership**" |
| `components/onboarding/PlanResult.tsx` line 59 | "Why this **plan**?" | "Why this **membership**?" |
| `data/voluntaryBenefitsData.ts` line 200 | "review your specific **plan** details" | "…**policy** details" if about third-party insurance, otherwise "**membership** details" |

**Exempt:** "payment plans" (billing sense, `healthcareFeaturesData.ts` line 712), "treatment plan" (clinical sense, line 824), "you plan to sell" (verb, `JoinOurTeam.tsx`), and all code identifiers (`usePlans`, `planUtils`, `PlanComparisonTable` internals, `plan_id`, etc.).

---

### 7. "Premium" → "Membership contribution" — LOW

Almost all uses are comparisons to traditional insurance, which read as intentional:

- `pages/HowItWorks.tsx` line 122 — comparison table: "Monthly Share Amount" **vs** "Monthly Premium" (insurance column). Comparative — likely fine to keep.
- `pages/AboutUs.tsx` lines 77, 81 — "compared to traditional insurance premiums". Comparative — fine.
- `components/forms/LeadForm.tsx` lines 222–226 — "Current Monthly Premium (if any)" asks about the visitor's *current insurance*. Acceptable, but could read "Current monthly healthcare cost (if any)" to be safer.

**Exempt:** "Premium Care" / "Premium HSA" product names (different sense of the word); `tier: 'premium'` code values; insurance-product copy (section 11).

---

### 8. "Deductible" → "IUA (Initial Unshareable Amount)" — LOW

Used mainly to *explain* the IUA by analogy:

- `components/onboarding/FlowShell.tsx` line 269 — "IUA is similar to a deductible."
- `components/BusinessRateCalculator.tsx` line 512 — "…is similar to a deductible."
- `pages/HowItWorks.tsx` lines 111, 123 — "Unlike traditional insurance deductibles…" + comparison table. Comparative — fine.
- `components/blocks/ValueProps.tsx` line 31 — "No hidden fees, deductibles, or surprise bills." Describes what MPB *doesn't* have — acceptable, but could be "No hidden fees or surprise bills."

If strict compliance is preferred, replace the analogy sentences with: "The IUA is the amount you pay toward a medical need before sharing begins."

**Exempt:** "Tax-deductible" (different word); calculator inputs asking about the user's current insurance.

---

### 9. "Guarantee payment or benefits" — LOW (2 items to review)

- `components/blocks/FinalCTA.tsx` line 7 and `components/blocks/PricingOverview.tsx` line 157 — **"30-day satisfaction guarantee."** This is a refund promise, not a payment/benefits guarantee, but the word "guarantee" appears in marketing copy. Recommend confirming this offer is real and intentionally worded; otherwise reword to "30-day money-back promise."

**Exempt (required disclaimers — do NOT change):** "does not guarantee payment of medical expenses" in `ComplianceNoteMVP.tsx`, `WashingtonStatement.tsx`, `PlanComparisonGuide.tsx`, `FAQAccordion.tsx`, and all `StateNotices.tsx` legal notices. These *negative* guarantee statements are legally required. Also exempt: `TermsAndConditions.tsx` / `PrivacyPolicy.tsx` legal language and "guaranteed issue" (insurance industry term, section 11).

---

### 10. "Insurance" and "Policy" — mostly compliant

"Insurance" appears ~150 times but nearly all are **allowed contexts**:

- "Not insurance" disclaimers (TopBar, footer, compliance notes, Washington statement) — required, keep.
- "Unlike traditional insurance…" comparisons and "insurance alternative" positioning — accepted per the word list.
- `pages/StateNotices.tsx` (30 uses) — legally mandated state notice text. **Do not edit.**
- `pages/JoinOurTeam.tsx` — "valid health insurance license" (factual licensing requirement). Keep.

"Policy" is similarly fine: `PrivacyPolicy.tsx` and footer links use it in the privacy-policy sense; the rest is in state notices or insurance-product pages. Where MPB guidelines are meant, prefer "membership guidelines" (already used in most places).

---

### 11. Voluntary benefits pages — a special case

`data/voluntaryBenefitsData.ts` (~35 cover/coverage, ~19 insurance, ~13 policy, ~6 premium, ~4 claims, ~4 guarantee hits) describes **third-party products that genuinely are insurance**: disability, critical illness, vision, dental, life, hospital indemnity, accident, and pet insurance. Calling them insurance/policies/premiums/claims is factually accurate and arguably required.

**Recommendation:** leave the insurance terminology on these pages, but (a) make sure each page clearly states these are optional third-party insurance products, separate from the MPB Health sharing membership, and (b) fix the inconsistent spots where "membership" was substituted into insurance-product copy during the earlier word sweep (e.g. "Dental insurance helps make oral health care affordable with membership for preventive services…" reads oddly — that sentence is about an insurance product's coverage, not the MPB membership).

---

## Scope notes

- **Scanned:** all source copy in `apps/website/src` (pages, components, data files, SEO config/JSON).
- **Not scanned:** blog and event articles stored in Supabase (only the historical seed in `scripts/migrate-articles.ts` was visible, which contains a handful of premium/insurance/coverage uses in old article text), CMS-managed page content, PDF handbooks in `public/docs`, and third-party embeds (Zoho chat, forms).
- **Legal text warning:** `StateNotices.tsx`, `WashingtonStatement.tsx`, `TermsAndConditions.tsx`, and `PrivacyPolicy.tsx` intentionally contain prohibited words in state-mandated or legal language. These should be excluded from any find-and-replace.

## Suggested execution order

1. ~~**Preventative → Preventive** (mechanical, zero ambiguity, ~19 replacements).~~ ✅ Done — 19 replacements (18 in `healthcareFeaturesData.ts`, 1 in `FAQAccordion.tsx`).
2. ~~**Sharing caps/limits → sharing maximums** (~10 replacements).~~ ✅ Done — all locations in section 3 plus strays the report missed (`PlanComparisonTable.tsx` "Lifetime/Annual Cap" rows, `AllPlansComparisonTable.tsx` "no lifetime limits", hero compliance note in `mpb_hero_radial_benefits_and_advisors_mvp_react_tailwind.jsx`) and the admin screens.
3. ~~**Cover/coverage/covered** in the copy locations listed in section 4 (~15 hand-tailored rewrites).~~ ✅ Done — all section 4 locations, plus strays the report missed: quote/rate calculators ("Who's Covered?", "oldest covered age"), `MultiStepQuoteForm.tsx` ("Who needs coverage?"), `FAQMVPSection.tsx` ("Am I covered when traveling?"), IUA tooltip in `howItWorksSteps.tsx`, CTA copy in `AboutUs.tsx` / `MaternityFeatureSection.tsx` / `HealthcareFeaturesSection.tsx` / `BlogCTA.tsx`, and SEO copy in `schemaMarkup.ts`, `page-seo-data.json`, `IndividualsAndFamilies.tsx`, `BusinessesOrganizations.tsx`. Left exempt: voluntary-benefits (insurance) pages incl. `BenefitDetail.tsx`, "Minimum Essential Coverage" (official ACA term), CSS `object-cover`, admin/CRM screens, code identifiers and routes, and the `migrate-articles.ts` seed (out of scope).
4. ~~**Pre-existing → pre-membership** (~6 replacements).~~ ✅ Done — all section 5 locations, plus display labels in `leadNotificationFormat.ts` and the admin screens (`SharingDetailsForm.tsx`, `PlanDetail.tsx`). Code identifiers (`preexisting_lookback_months`, `preexistingConditions`, etc.) and the "pre-existing drift" code comments (unrelated sense) kept as-is.
5. ~~**Plan stragglers → membership** (~6 replacements).~~ ✅ Done — all section 6 locations, plus many strays the report missed: "Compare Plans" CTAs/buttons (`StickyComparisonBar`, `StepPanel`, `SimpleComparisonView`, `HowItWorksMVP`, `HowItWorksTimeline`, `InteractivePlanComparison`, `ExitIntentModal`, hero block), breadcrumb labels, `SEOHead.tsx` default title/description/AI summary, "All Plans Include" (`PricingOverview`), `PlanForkSection`, `EnrollmentMembership`, `UrgencyCTA`, `FAQAccordion`, `EducationEnrollment` testimonial, `Advisors.tsx` meta, `CompactMembershipPrioritySelector`, `StaticShell`, and "No active plan" in the member portal dashboard. Also fixed section 11's flagged "Membership varies by policy" → "Coverage varies by policy" in `voluntaryBenefitsData.ts` (insurance context). Kept: URLs/routes (`/plans`, `/compare-plans`), code identifiers, "payment plans"/"treatment plan"/verb senses, and insurance-product "plans" in voluntary benefits copy.
6. **Member portal Claims → Sharing Requests** (biggest job: page copy, routes with redirects, dashboard widgets; admin screens can follow).
7. Review the two "satisfaction guarantee" mentions and the voluntary-benefits wording with compliance.
8. ~~**Minimum Essential Coverage / Minimum Essential Care → Preventive Care**~~ ✅ Done (Aug 2026) — replaced across website copy (`MemberPortal.tsx`, `BusinessesOrganizations.tsx`, `EnhancedBusinessPricingSection.tsx`, `MembershipComparisonGrid.tsx`, `SimplePlanCard.tsx` label, `planUtils.ts` label, `membershipPriorities.ts`, `howItWorksSteps.tsx`, `rules.ts`, `handbooksService.ts`, `schemaMarkup.ts`, `page-seo-extra.mjs`, `llms.txt`, `migrate-articles.ts` seed), advisor-portal `Training.tsx`, and `concierge-core` search keywords. Kept as-is: DB-facing lookup keys `'Minimum Essential Coverage'` (must match live `plan_features.category` values) in `planUtils.ts` / `SimplePlanCard.tsx` / `PlanComparisonTable.tsx`; the "MEC" acronym and plan names; the "What does MEC stand for?" quiz answer in advisor training (factual acronym expansion); already-applied Supabase migration files (historical artifacts); and historical quotes in `docs/word.md` / `docs/wordChanges.md`.
