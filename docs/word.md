# "Plan / Plans" → "Membership / Memberships" — Wording Audit

**Date:** 2026-08-13
**Scope:** Public visitor-facing copy on the production website (`apps/website`), including SEO metadata and structured data. Admin screens, member-portal dashboards, and code identifiers are excluded.
**Purpose:** Inventory every user-visible occurrence of the whole word "plan"/"plans" before replacing it with "membership"/"memberships". No changes have been made yet.

**How to read this file:** each section is a production page (with its URL). Each bullet is the exact sentence or string as it appears in the source, with the file and line number. The target word is shown in **bold**.

---

## 1. Homepage `/`

> Production homepage (main branch) — hero calculator and testimonials.

`apps/website/src/components/HeroCalculator.tsx` (rendered inside the hero):
- Line 383: "Compare all **plans** in 30 seconds" (and, after results: "`{n}` **plans** compared instantly")
- Line 518: "We'll match you to your best **plan**"
- Line 583: "Comparing **plans**..."
- Line 613: "`{n}` **plans** compared"

`apps/website/src/components/blocks/SocialProof.tsx` (also used on /individuals-and-families, /businesses-and-organizations, /advisors-and-brokers):
- Line 132: "I greatly appreciate Christine introducing me to MPB Health. She did an excellent job explaining the **plan** and has been available to answer questions whenever they come up. Very happy with the coverage!" — **member testimonial; consider leaving quotes verbatim**

---

## 2. Plans page `/plans`

The plan cards on this page (names, taglines, "Best for" text) are loaded from the **Supabase database** at runtime — see "Not covered by this audit" below.

`apps/website/src/lib/page-seo-data.json` (SEO title/description):
- Line 22: "Affordable Healthcare Memberships | Health Sharing **Plans** | MPB" (title + ogTitle, line 25)
- Line 23: "Compare affordable healthcare memberships and health sharing **plans** with HSA options, preventive care, and flexible monthly costs at MPB Health." (description + ogDescription, line 26)
- Line 24: keywords: "…health sharing **plans**, healthcare pricing, **plan** comparison, essentials **plan**…"

`apps/website/src/lib/dynamicMetaTags.ts`:
- Line 101: "Health Sharing **Plans** | Compare Options | MPB Health"
- Line 102: "Explore MPB Health sharing **plans** starting at $49.95/month. Find the perfect **plan** for your family with flexible IUA options."
- Line 103: keywords: "health sharing **plans**, affordable health **plans**, MPB **plans**, healthcare options"

---

## 3. Compare Plans page `/compare-plans`

`apps/website/src/pages/PlanComparison.tsx`:
- Line 244: "Complete **Plan** Comparison Guide"
- Line 245: "View all **plans** and features at a glance"

`apps/website/src/lib/page-seo-data.json`:
- Line 121: "Compare Health Sharing **Plans** vs Traditional Insurance | MPB" (title + ogTitle, line 124)
- Line 122: "Compare health sharing **plans** side by side and see how they differ from traditional insurance in cost, benefits, HSA options, and provider flexibility." (description + ogDescription, line 125)
- Line 123: keywords: "compare health sharing **plans**, … **plan** comparison, … **plan** pricing"

Note: the page URL itself is `/compare-plans` — changing the route is a separate (riskier) decision; this audit covers wording only.

---

## 4. Plan category pages `/plan-categories/:slug`

`apps/website/src/pages/PlanCategoryDetail.tsx`:
- Line 62: "Loading **plan** details..."
- Line 73: "**Plan** Not Found"
- Line 74: "The **plan** you are looking for does not exist."
- Line 105: "Back to All **Plans**"
- Line 179: "Who This **Plan** Is For"
- Line 255: "Compare All **Plans**"
- Line 271: "Our healthcare advisors are here to help you choose the perfect **plan** for your needs."

---

## 5. How It Works `/how-it-works`

`apps/website/src/pages/HowItWorks.tsx`:
- Lines 320–324: "When included, these services are available at no additional cost when received from an in-network provider, in accordance with **plan** guidelines."

`apps/website/src/components/blocks/MobileJourney.tsx` (mobile journey block on this page):
- Line 176: "Compare **Plans**" (button; aria-label line 174: "Compare available **plans**")

---

## 6. Features `/features` and `/features/:featureId`

`apps/website/src/pages/FeatureDetail.tsx`:
- Line 93: "Find My Perfect **Plan**" (CTA button; also line 573)
- Line 381: "Compare All **Plans**"
- Line 559: "Answer a few quick questions to find the perfect **plan** that includes `{feature name}` and other features you need."

`apps/website/src/data/healthcareFeaturesData.ts` (feature copy + FAQs rendered on the feature pages):
- Line 86: "The IUA is similar to a deductible—it's the amount you pay out-of-pocket (per medical need) before the community begins sharing your eligible expenses. Different **plans** have different IUA levels, ranging from $1,250 to $5,000 per person."
- Line 143: "Eligible emergency expenses are reviewed and shared according to your **plan** benefits"
- Line 494: "HSA-qualified **plans** that let you save pre-tax dollars for current and future healthcare expenses"
- Line 496: "Health Savings Accounts provide powerful tax advantages when paired with HSA-qualified health sharing **plans**. …"
- Line 504: "HSA funds are yours to keep regardless of employment or **plan** changes"
- Line 516: "Enroll in an HSA-qualified health sharing **plan** (Secure HSA)"
- Line 543: "What makes a **plan** HSA-qualified?"
- Line 544: "HSA-qualified **plans** must meet IRS requirements including minimum deductibles and maximum out-of-pocket limits. Our Secure HSA **plan** is specifically designed to meet these requirements for HSA eligibility."
- Line 547: "Can I take my HSA with me if I change **plans**?"
- Line 548: "Yes! Your HSA is yours forever. Even if you change health **plans**, employers, or retire, your HSA stays with you. …"
- Line 633: "…Check with your **plan** about membership for travel vaccinations."
- Line 637: "…those follow-up services may have cost-sharing according to your **plan's** medical benefits."
- Line 697: "Billing and payment **plan** assistance" — **"payment plan" is a different meaning; likely keep**
- Line 712: "…We can also help negotiate bills and set up payment **plans** when appropriate." — **"payment plans"; likely keep**
- Line 764: "Second opinions on diagnoses or treatment **plans**" — **"treatment plans"; likely keep**
- Line 789: "No, pet telehealth is included as a membership benefit on eligible **plans**. …"
- Line 800: "Second opinion on treatment **plan** recommended by regular vet" — **"treatment plan"; likely keep**
- Line 824: "Virtual providers can manage dosing, monitor progress, and provide follow-up care throughout your treatment **plan**." — **"treatment plan"; likely keep**

---

## 7. Individuals & Families `/individuals-and-families`

`apps/website/src/pages/IndividualsAndFamilies.tsx`:
- Line 28 (JSON-LD product description): "Enhanced health sharing **plan** with direct provider payment and comprehensive family coverage options."
- Line 36 (JSON-LD product description): "HSA-compatible health sharing **plan** for tax-advantaged healthcare savings combined with medical cost sharing."
- Line 39 (JSON-LD feature list): "Family **Plans**"
- Line 85: "Need Help Comparing **Plans**?"
- Line 88: "View all **plans** side-by-side to find the perfect fit for your family's healthcare needs."
- Line 96: "Compare **Plans** Online"
- Line 115: "Compare All **Plans** Side-by-Side"
- Line 116: "See exactly what each **plan** offers to find the perfect fit for your family"

`apps/website/src/components/blocks/TailoredJourney.tsx` (on this page):
- Line 11: "Get matched with **plans** that fit your unique needs and budget"
- Line 23: "See side-by-side comparisons of **plans** tailored to you"
- Line 47: "Find Your Perfect **Plan** in Minutes"
- Line 50: "Skip the confusion of comparing dozens of **plans**. Answer a few quick questions and we'll recommend the perfect health sharing solution for your family."
- Line 116: "Our interactive journey asks targeted questions about your health needs, lifestyle, and budget to match you with the ideal **plan**. No more guessing or comparing endless options—we do the work for you."

`apps/website/src/components/blocks/PlanComparison.tsx` (comparison modal opened from the pricing section; also used on /businesses-and-organizations):
- Line 44: "Compare **Plans**"
- Line 50: "Side-by-side comparison of `{n}` selected **plan**(s)"

`apps/website/src/lib/page-seo-data.json`:
- Line 87: keywords: "…individual health **plan**…"

---

## 8. Businesses & Organizations `/businesses-and-organizations`

`apps/website/src/pages/BusinessesOrganizations.tsx`:
- Line 17 (JSON-LD product description): "Minimum Essential Care **plan** satisfying ACA employer mandate requirements. Affordable preventive care solution for businesses."
- Line 46: "Replace hefty premiums with a fixed monthly share that pools funds for eligible medical costs—saving 40–60% versus typical **plans**."
- Line 96: "Unlike many traditional **plans**, MPB Health's cost-sharing programs don't impose yearly or lifetime maximums on eligible expenses."
- Line 272: "Need Help Comparing **Plans**?"
- Line 275: "View all **plans** side-by-side to find the perfect fit for your business healthcare needs."
- Line 283: "Compare **Plans** Online"
- Line 302: "Compare All **Plans** Side-by-Side"
- Line 303: "See exactly what each **plan** offers to find the perfect fit for your business"

`apps/website/src/lib/page-seo-data.json`:
- Line 94: "HSA Compatible Health Sharing **Plans** for Self Employed | MPB" (title + ogTitle, line 97)
- Line 95: "Discover HSA compatible health sharing **plans** and medical cost sharing for self employed professionals, 1099 contractors, and small businesses." (description + ogDescription, line 98)
- Line 96: keywords: "HSA compatible health sharing **plans**, … 1099 health **plan**…"

---

## 9. Get Started `/get-started`

`apps/website/src/pages/GetStarted.tsx`:
- Line 18: "Find Your Perfect **Plan**"
- Line 21: "Answer a few quick questions and we'll recommend the best health sharing **plan** for your needs."

---

## 10. Enrollment `/enrollment` and `/enroll/:planSlug`

`apps/website/src/components/blocks/EnrollmentHero.tsx`:
- Line 29: "Compare **Plans**"

`apps/website/src/pages/enroll/PlanEnrollmentPage.tsx`:
- Line 27: "Back to **Plans**"

`apps/website/src/lib/page-seo-data.json` (`/enrollment`):
- Line 13: "Enroll Now | MPB Health Sharing **Plans**" (title)
- Line 14: "Enroll in MPB Health today. Simple online enrollment, flexible **plans**, and savings up to 60%. No medical underwriting required." (description)
- Line 15: keywords: "…sign up health **plan**…"

---

## 11. Education & Enrollment `/education-enrollment`

`apps/website/src/pages/EducationEnrollment.tsx`:
- Line 15: "Explore our interactive guides and videos to understand how medical cost sharing works and which **plan** fits your needs."
- Line 29: "Compare **plan** features side-by-side with clear explanations of coverage, IUA levels, and monthly contributions."
- Line 57: "Family **Plan** Member" (testimonial byline)
- Line 58: "I appreciated being able to compare **plans** side-by-side and see exactly what each option covered. The transparency made choosing the right **plan** easy." (testimonial)

---

## 12. Advisor Directory `/advisor-directory`

`apps/website/src/pages/AdvisorDirectory.tsx`:
- Line 126: "Connect with licensed advisors ready to help you find the right health sharing **plan**"

`apps/website/src/lib/page-seo-data.json`:
- Line 104: "Connect with experienced health sharing advisors in your area. Get personalized guidance on **plans**, enrollment, and healthcare solutions." (description)
- Line 105: keywords: "…health **plan** consultant…"

---

## 13. About Us `/about-us`

`apps/website/src/pages/AboutUs.tsx`:
- Line 175: "Our innovative medical cost sharing model helps members save up to 50% on medical expenses versus traditional insurance **plans**. Based in the United States, we prioritize transparency, compassionate support, and comprehensive membership options—so you can make informed healthcare decisions and enjoy true peace of mind."
- Line 373: "View **Plans**" (CTA button)

---

## 14. Welcome `/welcome`

`apps/website/src/pages/Welcome.tsx`:
- Lines 52–56: "Individual programs typically range from $160 to $350 per month, while family **plans** range from $400 to $1,050 monthly, depending on your specific medical needs."

---

## 15. Support `/support`

`apps/website/src/pages/Support.tsx`:
- Line 123: "Employers & **Plan** Administrators" (section heading)

---

## 16. Insights & Analytics `/insights-analytics`

`apps/website/src/pages/InsightsAnalytics.tsx`:
- Line 35: "Understand your member population by age, location, **plan** type, and household composition."
- Line 441: "Learn About Group **Plans**"

---

## 17. Landing MVP `/mvp` (alternate landing page)

`apps/website/src/pages/LandingMVP.tsx`:
- Line 15: "MPB Health Sharing **Plans** | Save 30-60% on Healthcare" (page title)
- Line 20: meta keywords: "health sharing **plans**, affordable healthcare…"

`apps/website/src/components/blocks/HeroMVP.tsx`:
- Line 36: "Compare **Plans**"
- Line 97: "This is a quick estimate. See **plan** details for specifics."

`apps/website/src/components/blocks/PlanCardsMVP.tsx`:
- Line 46: "Compare **plans** →" (also line 82)
- Line 71: "See **plan** details"

`apps/website/src/components/layout/StickyHeaderMVP.tsx`:
- Line 19: "HealthShare **Plans** Built for You"

---

## 18. Employer forms `/employer-forms` and public form pages

`apps/website/src/pages/EmployerFormsIndex.tsx`:
- Line 25 (meta description): "Access all employer forms for managing your organization's health sharing **plan** with MPB Health."
- Line 47: "Manage your organization's health sharing **plan** with our streamlined employer forms"

`apps/website/src/config/forms.config.ts` (descriptions shown on public form pages):
- Line 49 (`/employee-removal`): "Process an employee removal from your MPB Health group **plan**. Submit this secure employer form to update your organization roster and billing."
- Line 69 (`/permission-to-discuss-plan`): "Grant permission for MPB Health to discuss your **plan** details with an authorized family member or representative using this secure authorization form." — note: the page URL itself contains "plan"
- Line 99 (`/membership-changes`): "Update your MPB Health membership information online. Change address, dependents, **plan** details, or account preferences through this secure member form."

---

## 19. Site-wide navigation (header, footer, search)

`apps/website/src/lib/useSiteNav.ts` (shared nav — global header and staging landing header):
- Line 198: "Comprehensive health sharing **plans** for you and your loved ones" (Memberships → For Individuals & Families description)
- Line 215: "Health **Plan** with Health Savings Account" (Secure HSA description)
- Line 372: "Grant permission to discuss your **plan** details" (Members menu)
- Lines 566–614: handbook menu descriptions — "View the Care+ **plan** member handbook", "View the Direct **plan** member handbook", "View the Secure HSA **plan** member handbook", "View the Premium Care **plan** member handbook", "View the Premium HSA **plan** member handbook", "View the Essentials **plan** member handbook", "View the MEC+ Essentials **plan** member handbook"

`apps/website/src/contexts/NavigationContext.tsx` (footer/nav config):
- Line 362: "**Plans** & Pricing" (nav label)
- Line 374: "Comprehensive health sharing **plans** for you and your loved ones"
- Line 385: "Health **Plan** with Health Savings Account"
- Line 394: "Compare **Plans**" (label)
- Line 396: "Side-by-side comparison of all available **plans**"
- Lines 222–255: handbook descriptions — "View the Care+ **plan** member handbook", "View the Direct **plan** member handbook", "View the Secure HSA **plan** member handbook", "View the Essentials **plan** member handbook"

`apps/website/src/lib/navigationConfig.ts`:
- Line 39: "Comprehensive **plans** for you and your loved ones"
- Line 58: "Compare **Plans**" (label)
- Line 60: "Side-by-side **plan** comparison"
- Line 104: "**Plan** Comparison" (label)
- Line 106: "Compare **plans** side-by-side"
- Line 318: "**Plans**" (quick-nav label)
- Line 339: "**Plans**" (footer column title)

`apps/website/src/components/layout/Header.tsx` (legacy header, check if still rendered anywhere):
- Line 148: "Comprehensive health sharing **plans** for you and your loved ones"
- Line 165: "Health **Plan** with Health Savings Account"

`apps/website/src/components/layout/GlobalSearch.tsx`:
- Line 117: "**Plans** & Pricing" (search result title)

---

## 20. SEO structured data (JSON-LD, visible to search engines)

`apps/website/src/lib/schemaMarkup.ts`:
- Line 421: "`{planName}` Health Sharing **Plan**" (product schema name)
- Line 428: category: "Health Sharing **Plan**"
- Line 461: "Basic health sharing **plan** with preventive care, telemedicine, and prescription discounts. Perfect for individuals seeking affordable healthcare coverage." (Essentials)
- Line 475: "Enhanced health sharing **plan** with lower IUA options and comprehensive coverage for families. Includes direct provider payment options." (Care+; features include "Family **Plans**", line 478)
- Line 482: "HSA-compatible health sharing **plan** allowing tax-advantaged savings. Perfect for those wanting to combine health sharing with HSA benefits." (Secure HSA)
- Line 489: "Minimum Essential Care **plan** satisfying ACA employer mandate requirements. Ideal for businesses seeking compliant, affordable options." (MEC)
- Line 578: "Health Sharing **Plans**" (offer catalog name)
- Line 584: "Individual & Family **Plans**"
- Line 585: "Health sharing **plans** for individuals and families seeking affordable healthcare solutions."
- Line 592: "Business & Organization **Plans**"
- Line 657: "Affordable health sharing **plans** for individuals, families, and businesses. Save up to 60% compared to traditional health insurance." (organization schema description)
- Line 761: "Step-by-step guide to enrolling in an affordable health sharing **plan** with MPB Health."
- Line 765: "Enter your ZIP code and household information to see personalized **plan** options and pricing."
- Line 769: "Compare **Plans**" (how-to step name)
- Line 770: "Review available health sharing **plans** including Essentials, Care Plus, Direct, and Secure HSA options."
- Line 774: "Select Your **Plan**" (how-to step name)
- Line 775: "Choose the **plan** that best fits your healthcare needs and budget. Select your IUA (Initial Unshareable Amount) level."
- FAQ schema (homepage + /faq), lines 849–941: "What types of health sharing **plans** are available?", "Can families use health sharing **plans**?", "Can self-employed individuals use health sharing **plans**?", "What are HSA compatible health sharing **plans**?", "HSA compatible health sharing **plans** allow eligible members to combine medical cost sharing with a Health Savings Account…", "What expenses can an HSA cover with a health sharing **plan**?", "Are health sharing **plans** good for small businesses?", "What are the pros and cons of health share **plans**?", "Can I use any doctor with a health sharing **plan**?", "Are health sharing **plans** considered insurance?", "No. Health sharing **plans** are membership-based healthcare sharing programs rather than traditional insurance policies…", "Health sharing **plans** operate through community medical expense sharing…"
- Line 968: "How to Choose a Health Sharing **Plan**"
- Line 969: "Guide to selecting the right MPB Health sharing **plan** for your needs."
- Line 973: "Review **Plan** Features" / "Compare telemedicine, prescription sharing, and specialty coverage options."

`apps/website/src/lib/page-seo-data.json` — other pages:
- `/contact`, line 59: "Contact MPB Health for questions about health sharing **plans**, enrollment, or member support. Call (855) 816-4650 or message us online."
- `/faq`, line 68: "Get answers about healthcare sharing memberships, medical cost sharing, **plan** benefits, enrollment timing, and pros and cons of health share **plans**." (description + ogDescription, line 71)
- `/advisors-and-brokers`, line 140: "Grow your practice with MPB Health. Offer clients affordable health sharing **plans**. Competitive commissions, training, and dedicated support for advisors."
- `/3d-flip-book/premium-care`, line 203: "View the Premium Care member handbook with **plan** benefits, Sedera guidelines, provider resources, and member forms."
- `/3d-flip-book/premium-hsa`, line 212: "View the Premium HSA member handbook with HSA-compatible **plan** benefits, guidelines, and member resources."

---

## 21. Member handbook pages (public URLs, product documentation)

SEO descriptions on public handbook viewer pages. The handbooks themselves are PDFs/flipbooks whose content this change cannot touch — consider whether renaming these descriptions creates a mismatch with the handbook contents.

- `apps/website/src/pages/handbooks/EssentialsHandbook.tsx`, lines 10, 15: "View and download the MPB Health Essentials **plan** member handbook" / "Complete guide for Essentials **plan** members"
- `apps/website/src/pages/handbooks/DirectHandbook.tsx`, lines 10, 15: same pattern for the Direct **plan**
- `apps/website/src/pages/handbooks/CarePlusHandbook.tsx`, lines 10, 15: same pattern for the Care+ **plan**
- `apps/website/src/pages/handbooks/MECEssentialsHandbook.tsx`, lines 10, 15: same pattern for the MEC+ Essentials **plan**
- `apps/website/src/pages/handbooks/SecureHSAHandbook.tsx`, lines 10, 15: same pattern for the Secure HSA **plan**
- `apps/website/src/pages/handbooks/DynamicHandbookPage.tsx`, line 93: "Download the `{handbook name}` from MPB Health. View **plan** benefits, member guidelines, provider resources, and enrollment details in this member handbook."

---

## 22. Other data files rendered on public pages

`apps/website/src/data/voluntaryBenefitsData.ts` (voluntary benefit pages — note these describe **third-party insurance policies** where "plan" is the correct industry term; review individually before renaming):
- Line 200: "…Membership varies by policy, so review your specific **plan** details."
- Line 272: "Most vision **plans** provide a new frame allowance once per year and new lenses once per year. Some **plans** offer more frequent benefits for contact lenses."
- Line 276: "You will save the most using in-network providers, but most **plans** offer out-of-network benefits with reimbursement options. Check your **plan's** provider network."
- Line 280: "Yes, most **plans** cover contact lenses in lieu of glasses. You typically choose between glasses or contacts each benefit period, though some **plans** offer both with different allowances."
- Lines 413, 418: "Standard **Plan**" / "Enhanced **Plan**" (tier names)
- Line 514: "No age restrictions for most **plans**"
- Line 527: "Yes! Family **plans** cover accidental injuries to all covered family members, including sports-related injuries at school, practice, or organized activities."
- Lines 569, 578: "Orthodontics (braces/aligners) on select **plans**" / "Orthodontics (on select **plans**)"
- Line 601: "The annual maximum is the most your dental **plan** will pay for covered services in a year, typically $1,000-$2,000 per person. …"
- Line 605: "Most **plans** have a network of dentists offering the best rates. You can often use out-of-network dentists but may pay higher out-of-pocket costs. PPO **plans** offer the most flexibility."

`apps/website/src/data/benefitsData.ts`:
- Line 136: "Hospital delivery and associated costs shared according to **plan** terms"

`apps/website/src/components/lead-capture/MultiStepQuoteForm.tsx` (quote form used in lead capture):
- Line 345: "Don't worry - this won't disqualify you. It helps us recommend the best **plan**."
- Line 442: "By submitting, you agree to be contacted about MPB Health **plans**. Your information is secure and will never be sold."

`apps/website/src/components/blocks/MembershipBenefits.tsx`:
- Line 161: "All features subject to **plan** eligibility"

`apps/website/src/components/blocks/PathExplainers.tsx`:
- Line 54: "Individuals between employer **plans**"
- Line 126: "Explore detailed information about each **plan** family to find the perfect fit for your healthcare needs."

---

## 23. Staging-only (new landing page, not yet in production)

`apps/website/src/components/landing-redesign/QuickRateEstimateForm.tsx`:
- Line 291: "Compare all **plans** in 30 seconds"
- Line 424: "We'll match you to your best **plan**"
- Line 426: "Tap to select — pick 1–3 that matter most. All **plans** include $0 virtual care."

`apps/website/src/components/landing-redesign/LandingRedesign.tsx`:
- Line 128: same Christine testimonial as SocialProof (member quote — consider leaving verbatim)

---

## 24. Flagged — recommend NOT changing

| Location | Why |
|---|---|
| `apps/website/src/pages/StateNotices.tsx` (lines 84–219, ~19 occurrences) | Legally mandated state disclosure language ("…neither its guidelines nor **plan of operation** is an insurance policy…"). This exact wording is prescribed by state statutes. **Do not reword without legal counsel.** |
| `apps/website/src/pages/TermsAndConditions.tsx` line 102 ("Healthcare Plans.") and `PrivacyPolicy.tsx` lines 133, 178 | Legal documents — review with counsel before rewording. |
| `apps/website/src/pages/JoinOurTeam.tsx` line 149 | "…in the state(s) where you **plan** to sell…" — verb, not the product noun. Skip. |
| "payment plan", "treatment plan" occurrences (healthcareFeaturesData lines 697, 712, 764, 800, 824) | Different meaning of "plan"; renaming would be wrong. |
| `voluntaryBenefitsData.ts` occurrences | Describe third-party insurance policies (dental/vision/accident), where "plan" is the accurate term. Review individually. |
| Member testimonials (SocialProof line 132, EducationEnrollment line 58, LandingRedesign line 128) | Real customer quotes — editing them changes what the person said. |
| Routes and slugs (`/plans`, `/compare-plans`, `/plan-categories/:slug`, `/permission-to-discuss-plan`, `#plans` anchors) | URL changes break links/SEO and need redirects — separate decision from copy changes. |
| All code identifiers (`usePlans`, `planId`, `plansService`, `PlanCard`, etc.) | Internal names; renaming risks breakage with zero user benefit. |

---

## 25. Not covered by this audit (needs separate passes)

1. **CMS database content** — most marketing pages can be overridden by CMS-managed content in Supabase (`ManagedPage`). Live production copy for those pages may differ from the code fallbacks listed here. A read-only query against the CMS tables is needed to audit that content.
2. **Plan catalog in the database** — plan names, taglines, "Best for" text, and descriptions shown on `/plans`, `/compare-plans`, and in the rate calculators come from Supabase tables (via `plansService` / `usePlans`) and the rate-engine config, not from code.
3. **Blog posts / resources / events** — article content lives in the CMS.
4. **Prerendered SEO HTML** — regenerate after copy changes so crawlers see updated text.
5. **Member handbook PDFs / flipbook contents** — external documents.
6. **Admin and member-portal screens** — excluded per scope (internal audiences), e.g. `admin/MembershipManagement.tsx`, member dashboards.
7. **Apparently unused legacy components** that contain the word but seem unimported (verify before bothering): `components/blocks/mpb_hero_radial_benefits_and_advisors_mvp_react_tailwind.jsx`, `PricingOverview.tsx`, `PricingGrid.tsx`, `HowItWorksTimeline.tsx`, `GuidedPath.tsx`, `accordionItems.ts`, `pages/Advisors.tsx`.
