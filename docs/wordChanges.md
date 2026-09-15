# "Plan / Plans" → "Membership / Memberships" — Change Report

**Date:** 2026-08-17
**Branch:** `main` (changes are local, NOT committed yet)
**Scope:** User-visible content only, per the audit in `docs/word.md`. Routes, URLs, code identifiers, legal text, testimonials, and "payment plan"/"treatment plan" senses were NOT changed.
**Result:** ~117 string replacements across 45 files. Production build passes; `page-seo-data.json` still parses; no lint errors.

---

## 1. Pages

### `src/pages/PlanComparison.tsx` (/compare-plans)
- "Complete Plan Comparison Guide" → "Complete Membership Comparison Guide"
- "View all plans and features at a glance" → "View all memberships and features at a glance"

### `src/pages/PlanCategoryDetail.tsx` (/plan-categories/:slug)
- "Loading plan details..." → "Loading membership details..."
- "Plan Not Found" → "Membership Not Found"
- "The plan you are looking for does not exist." → "The membership you are looking for does not exist."
- "Back to All Plans" → "Back to All Memberships"
- "Who This Plan Is For" → "Who This Membership Is For"
- "Compare All Plans" → "Compare All Memberships"
- "choose the perfect plan for your needs" → "choose the perfect membership for your needs"

### `src/pages/HowItWorks.tsx` (/how-it-works)
- "in accordance with plan guidelines." → "in accordance with membership guidelines."

### `src/pages/IndividualsAndFamilies.tsx` (/individuals-and-families)
- JSON-LD: "Enhanced health sharing plan…" → "…health sharing membership…"
- JSON-LD: "HSA-compatible health sharing plan…" → "…health sharing membership…"
- JSON-LD feature: "Family Plans" → "Family Memberships"
- "Need Help Comparing Plans?" → "Need Help Comparing Memberships?"
- "View all plans side-by-side…" → "View all memberships side-by-side…"
- "Compare Plans Online" → "Compare Memberships Online"
- "Compare All Plans Side-by-Side" → "Compare All Memberships Side-by-Side"
- "See exactly what each plan offers…" → "…each membership offers…"

### `src/pages/BusinessesOrganizations.tsx` (/businesses-and-organizations)
- JSON-LD: "Minimum Essential Care plan satisfying ACA…" → "Minimum Essential Care membership…"
- "Need Help Comparing Plans?" → "Need Help Comparing Memberships?"
- "View all plans side-by-side…" → "View all memberships side-by-side…"
- "Compare Plans Online" → "Compare Memberships Online"
- "Compare All Plans Side-by-Side" → "Compare All Memberships Side-by-Side"
- "See exactly what each plan offers…" → "…each membership offers…"

### `src/pages/GetStarted.tsx` (/get-started)
- "Find Your Perfect Plan" → "Find Your Perfect Membership"
- "recommend the best health sharing plan for your needs" → "…health sharing membership…"

### `src/pages/EducationEnrollment.tsx` (/education-enrollment)
- "which plan fits your needs" → "which membership fits your needs"
- "Compare plan features side-by-side…" → "Compare membership features side-by-side…"

### `src/pages/AdvisorDirectory.tsx` (/advisor-directory)
- "help you find the right health sharing plan" → "…health sharing membership"

### `src/pages/AboutUs.tsx` (/about-us)
- "View Plans" (CTA button) → "View Memberships"

### `src/pages/Welcome.tsx` (/welcome)
- "family plans range from $400 to $1,050" → "family memberships range from…"

### `src/pages/Support.tsx` (/support)
- "Employers & Plan Administrators" → "Employers & Membership Administrators"

### `src/pages/InsightsAnalytics.tsx` (/insights-analytics)
- "by age, location, plan type, and household composition" → "…membership type…"
- "Learn About Group Plans" → "Learn About Group Memberships"

### `src/pages/EmployerFormsIndex.tsx` (/employer-forms)
- Meta description: "managing your organization's health sharing plan" → "…health sharing membership"
- "Manage your organization's health sharing plan…" → "…health sharing membership…"

### `src/pages/LandingMVP.tsx` (/mvp)
- Title: "MPB Health Sharing Plans | Save 30-60%…" → "MPB Health Sharing Memberships |…"
- Keywords: "health sharing plans…" → "health sharing memberships…"

### `src/pages/enroll/PlanEnrollmentPage.tsx` (/enroll/:planSlug)
- "Back to Plans" → "Back to Memberships" (link still goes to /plans)

### Handbook pages (/3d-flip-book/* and handbook viewers)
- `EssentialsHandbook.tsx`: "…Essentials plan member handbook" → "…Essentials membership handbook"; "Complete guide for Essentials plan members" → "Complete guide for Essentials members"
- `DirectHandbook.tsx`: same two patterns → "Direct membership handbook" / "Direct members"
- `CarePlusHandbook.tsx`: → "Care+ membership handbook" / "Care+ members"
- `MECEssentialsHandbook.tsx`: → "MEC+ Essentials membership handbook" / "MEC+ Essentials members"
- `SecureHSAHandbook.tsx`: → "Secure HSA membership handbook" / "Secure HSA members"
- `DynamicHandbookPage.tsx`: "View plan benefits, member guidelines…" → "View membership benefits, member guidelines…"

---

## 2. Components / blocks

### `src/components/HeroCalculator.tsx` (hero calculator)
- "{n} plans compared instantly" → "{n} memberships compared instantly"
- "Compare all plans in 30 seconds" → "Compare all memberships in 30 seconds"
- "We'll match you to your best plan" → "…your best membership"
- "Comparing plans..." → "Comparing memberships..."
- "{n} plans compared" → "{n} memberships compared"

### `src/components/blocks/MobileJourney.tsx`
- aria-label "Compare available plans" → "Compare available memberships"
- "Compare Plans" (button) → "Compare Memberships"

### `src/components/blocks/TailoredJourney.tsx`
- "Get matched with plans that fit your unique needs and budget" → "…with memberships that fit…"
- "See side-by-side comparisons of plans tailored to you" → "…comparisons of memberships…"
- "Find Your Perfect Plan in Minutes" → "Find Your Perfect Membership in Minutes"
- "Skip the confusion of comparing dozens of plans." → "…dozens of memberships."
- "…match you with the ideal plan." → "…the ideal membership."

### `src/components/blocks/PlanComparison.tsx` (comparison modal)
- "Compare Plans" (heading) → "Compare Memberships"
- "Side-by-side comparison of {n} selected plan(s)" → "…selected membership(s)"

### `src/components/blocks/EnrollmentHero.tsx`
- "Compare Plans" (button) → "Compare Memberships"

### `src/components/blocks/HeroMVP.tsx`
- "Compare Plans" (button) → "Compare Memberships"
- "See plan details for specifics." → "See membership details for specifics."

### `src/components/blocks/PlanCardsMVP.tsx`
- "Compare plans →" → "Compare memberships →" (×2)
- "See plan details" → "See membership details"

### `src/components/layout/StickyHeaderMVP.tsx`
- "HealthShare Plans Built for You" → "HealthShare Memberships Built for You"

### `src/components/lead-capture/MultiStepQuoteForm.tsx`
- "It helps us recommend the best plan." → "…the best membership."
- "…contacted about MPB Health plans." → "…MPB Health memberships."

### `src/components/blocks/MembershipBenefits.tsx`
- "All features subject to plan eligibility" → "…subject to membership eligibility"

### `src/components/blocks/PathExplainers.tsx`
- "…each plan family to find the perfect fit…" → "…each membership family…"
- aria-label "View detailed plan comparison" → "View detailed membership comparison"

### `src/pages/FeatureDetail.tsx` (/features/:featureId)
- "Find My Perfect Plan" → "Find My Perfect Membership" (×2)
- "Compare All Plans" → "Compare All Memberships"
- "…find the perfect plan that includes {feature}…" → "…the perfect membership that includes…"

---

## 3. SEO / data / config

### `src/lib/page-seo-data.json`
- /enrollment: title "…MPB Health Sharing Plans" → "…Memberships"; description "flexible plans…" → "flexible memberships…"; keyword "sign up health plan" → "…health membership"
- /plans: title+ogTitle "…Health Sharing Plans | MPB" → "…Health Sharing Memberships | MPB"; description+ogDescription "…health sharing plans with HSA options…" → "…memberships…"; keywords "health sharing plans", "plan comparison", "essentials plan" → membership forms
- /contact: "questions about health sharing plans" → "…memberships"
- /faq: "plan benefits" → "membership benefits"; "health share plans" → "health share memberships"
- /individuals-and-families: keyword "individual health plan" → "individual health membership"
- /businesses-and-organizations: title+ogTitle "HSA Compatible Health Sharing Plans…" → "…Memberships…"; description+ogDescription → memberships; keywords → memberships / "1099 health membership"
- /advisor-directory: "guidance on plans, enrollment" → "guidance on memberships…"; keyword "health plan consultant" → "health membership consultant"
- /compare-plans: title+ogTitle "Compare Health Sharing Plans vs Traditional Insurance" → "…Memberships…"; description+ogDescription → memberships; keywords → membership forms
- /advisors-and-brokers: "affordable health sharing plans" → "…memberships"
- /3d-flip-book/premium-care: "handbook with plan benefits" → "…membership benefits"
- /3d-flip-book/premium-hsa: "HSA-compatible plan benefits" → "…membership benefits"

### `src/lib/dynamicMetaTags.ts`
- "Health Sharing Plans | Compare Options…" → "Health Sharing Memberships |…"
- "MPB Health sharing plans starting at $49.95/month. Find the perfect plan…" → "…memberships… perfect membership…"
- keywords: "health sharing plans, affordable health plans, MPB plans" → all memberships

### `src/data/healthcareFeaturesData.ts` (feature pages copy + FAQs)
- "Different plans have different IUA levels" → "Different memberships…"
- "shared according to your plan benefits" → "…membership benefits"
- "HSA-qualified plans that let you save pre-tax dollars" → "HSA-qualified memberships…"
- "paired with HSA-qualified health sharing plans" → "…memberships"
- "regardless of employment or plan changes" → "…membership changes"
- "Enroll in an HSA-qualified health sharing plan (Secure HSA)" → "…membership (Secure HSA)"
- "What makes a plan HSA-qualified?" → "What makes a membership HSA-qualified?"
- "HSA-qualified plans must meet IRS requirements… Our Secure HSA plan…" → both membership forms
- "Can I take my HSA with me if I change plans?" → "…memberships?"
- "Even if you change health plans, employers, or retire" → "…health memberships…"
- "Check with your plan about membership for travel vaccinations." → "Check your membership details about travel vaccinations." (reworded to avoid "membership about membership")
- "according to your plan's medical benefits" → "…membership's medical benefits"
- "included as a membership benefit on eligible plans" → "…on eligible memberships"

### `src/data/benefitsData.ts`
- "costs shared according to plan terms" → "…membership terms"

### `src/config/forms.config.ts` (public form page descriptions)
- Employee Removal: "your MPB Health group plan" → "…group membership"
- Authorization to Share Information: "discuss your plan details…" → "…membership details…"
- Member Updates: "Change address, dependents, plan details…" → "…membership details…"

### `src/lib/schemaMarkup.ts` (JSON-LD structured data)
- Product name "{name} Health Sharing Plan" → "…Health Sharing Membership"; category → "Health Sharing Membership"
- Essentials / Direct / Secure HSA / MEC+ product descriptions → membership; feature "Family Plans" → "Family Memberships"
- Offer catalog: "Health Sharing Plans", "Individual & Family Plans", "Business & Organization Plans" → Memberships; descriptions → memberships
- Organization description "Affordable health sharing plans…" → "…memberships…"
- Enrollment HowTo: "…health sharing plan", "personalized plan options", step "Compare Plans", "Review available health sharing plans…", step "Select Your Plan", "Choose the plan that best fits…" → all membership forms
- FAQ schema (homepage + /faq): all 12 "health sharing plan(s)"/"health share plans" questions and answers → membership forms
- Plans-page HowTo: "How to Choose a Health Sharing Plan", "selecting the right MPB Health sharing plan", step "Review Plan Features" → membership forms

---

## 4. Site-wide navigation (header, footer, search)

### `src/lib/useSiteNav.ts` (global header + landing header)
- "Comprehensive health sharing plans for you and your loved ones" → "…memberships…"
- "Health Plan with Health Savings Account" → "Health Membership with Health Savings Account"
- "Grant permission to discuss your plan details" → "…membership details"
- 7 handbook menu descriptions: "View the {X} plan member handbook" → "View the {X} membership handbook" (Care+, Direct, Secure HSA, Premium Care, Premium HSA, Essentials, MEC+ Essentials)

### `src/contexts/NavigationContext.tsx` (footer/nav)
- label "Plans & Pricing" → "Memberships & Pricing"
- "Comprehensive health sharing plans…" → "…memberships…"
- "Health Plan with Health Savings Account" → "Health Membership with…"
- label "Compare Plans" → "Compare Memberships"
- "Side-by-side comparison of all available plans" → "…memberships"
- 4 handbook descriptions → "membership handbook"

### `src/lib/navigationConfig.ts`
- "Comprehensive plans for you and your loved ones" → "Comprehensive memberships…"
- label "Compare Plans" → "Compare Memberships"; "Side-by-side plan comparison" → "…membership comparison"
- label "Plan Comparison" → "Membership Comparison"; "Compare plans side-by-side" → "Compare memberships side-by-side"
- quick-nav label "Plans" → "Memberships"; footer column title "Plans" → "Memberships"

### `src/components/layout/Header.tsx` (legacy header)
- "Comprehensive health sharing plans…" → "…memberships…"
- "Health Plan with Health Savings Account" → "Health Membership with…"

### `src/components/layout/GlobalSearch.tsx`
- search result title "Plans & Pricing" → "Memberships & Pricing" (search keywords untouched so users can still search "plans")

---

## 5. Landing page (homepage)

### `src/components/landing-redesign/QuickRateEstimateForm.tsx`
- "Compare all plans in 30 seconds" → "Compare all memberships in 30 seconds"
- "We'll match you to your best plan" → "…your best membership"
- "All plans include $0 virtual care." → "All memberships include $0 virtual care."

---

## 6. Intentionally NOT changed

| What | Where | Why |
|---|---|---|
| Member testimonials (Christine quote; education testimonial + "Family Plan Member" byline; SocialProof quote) | LandingRedesign.tsx, SocialProof.tsx, EducationEnrollment.tsx | Real customer words — left verbatim |
| "versus traditional insurance plans" / "typical plans" / "traditional plans" / "between employer plans" | AboutUs.tsx, BusinessesOrganizations.tsx (×2), PathExplainers.tsx | These refer to competitors' insurance plans — "insurance memberships" would be wrong |
| "payment plan(s)" (×2), "treatment plan(s)" (×3) | healthcareFeaturesData.ts | Different meaning of "plan" |
| State-mandated legal wording | StateNotices.tsx, TermsAndConditions.tsx, PrivacyPolicy.tsx | Legal text — needs counsel |
| Third-party insurance copy (dental/vision/accident) | voluntaryBenefitsData.ts | "Plan" is the correct industry term for those policies |
| All routes/URLs/slugs/anchors: /plans, /compare-plans, /plan-categories, /permission-to-discuss-plan, #plans | everywhere | URL changes break links/SEO; separate decision |
| Code identifiers (usePlans, planId, plansService, staticFormLabels entries, analytics field names) | everywhere | Internal names; not user-visible |

## 7. Not covered (needs separate passes)

1. **CMS database content** — pages overridden by CMS-managed content in Supabase may still say "plan"; needs a CMS content pass.
2. **Plan catalog in the database** — names/taglines on /plans and in the rate calculators come from Supabase, not code.
3. **Blog/resource/event articles** — CMS content.
4. **Member handbook PDFs/flipbooks** — external documents (their SEO descriptions were updated; the documents themselves still say "plan").

## 8. Copy-quality flags worth a human read

- `/plans` SEO title is now "Affordable Healthcare Memberships | Health Sharing Memberships | MPB" — slightly repetitive; may deserve a manual rewrite.
- "Employers & Membership Administrators" (Support page) — check this is the intended term.
- "Health Membership with Health Savings Account" (Secure HSA menu description) — check phrasing.
