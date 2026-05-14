import React, { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { EnhancedHero } from '../components/blocks/EnhancedHero';
import { EnhancedTrustBar } from '../components/blocks/EnhancedTrustBar';
import { SolutionsSection } from '../components/blocks/SolutionsSection';
import { UnifiedPathSelector } from '../components/blocks/UnifiedPathSelector';
import { MedicalCostSharingInfo } from '../components/blocks/MedicalCostSharingInfo';
import RateCalculator from '../components/RateCalculator';
import { AffiliateProvider } from '../components/AffiliateProvider';
import { StickyMobileCTA } from '../components/layout/StickyMobileCTA';
// Site-wide JSON-LD (Organization, MedicalOrganization+LocalBusiness, WebSite)
// is now emitted statically from apps/website/index.html so it is visible to
// non-JS crawlers and so we don't double-emit after hydration. Per-page schemas
// (Article/FAQ/HowTo/etc.) still come from lib/schemaMarkup.ts via Helmet
// inside the relevant page components.

// Lazy load below-the-fold components
const ObjectionBlocks = lazy(() => import('../components/blocks/ObjectionBlocks').then(m => ({ default: m.ObjectionBlocks })));
const SocialProof = lazy(() => import('../components/blocks/SocialProof').then(m => ({ default: m.SocialProof })));

const Loading = () => (
  <div className="animate-pulse bg-neutral-100 rounded-lg h-64" />
);

const Landing: React.FC = () => {
  // Canonical is intentionally NOT set inside <Helmet> below. The static
  // <link rel="canonical" href="https://mpb.health/" /> in
  // apps/website/index.html is the source of truth. Setting another canonical
  // here would result in two <link rel="canonical"> tags in the DOM after
  // hydration (react-helmet-async appends — it does not remove static head
  // tags), which SEO auditors flag as duplicates.
  return (
    <>
      <Helmet>
        <title>Affordable HealthShare Memberships | MPB Health</title>
        <meta
          name="description"
          content="MPB Health offers flexible, affordable HealthShare memberships for individuals and families. Save on healthcare costs with our community-driven solutions."
        />
        <meta name="keywords" content="healthshare memberships, health sharing, healthcare costs, insurance alternative, community health, medical cost sharing, affordable healthcare" />

        {/* Preload critical resources */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" as="style" />

        {/* Open Graph */}
        <meta property="og:title" content="Affordable HealthShare Memberships | MPB Health" />
        <meta property="og:description" content="MPB Health offers flexible, affordable HealthShare memberships for individuals and families. Save on healthcare costs with our community-driven solutions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mpb.health/" />
        <meta property="og:site_name" content="MPB Health" />
        <meta property="og:image" content="https://mpb.health/assets/MPB-Health-No-background.png?v=2" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
      </Helmet>

      {/* Above the fold - critical render path */}
      <EnhancedHero />
      <SolutionsSection />
      <MedicalCostSharingInfo />
      <UnifiedPathSelector />
      <AffiliateProvider>
        <div id="calculator" className="scroll-mt-24 bg-white py-0">
          <RateCalculator />
        </div>
      </AffiliateProvider>

      {/* Below the fold - lazy loaded */}
      <Suspense fallback={<Loading />}>
        <ObjectionBlocks />
      </Suspense>

      <EnhancedTrustBar />

      <Suspense fallback={<Loading />}>
        <SocialProof />
      </Suspense>

      {/* Mobile sticky CTA */}
      <StickyMobileCTA />
    </>
  );
};

export { Landing };
export default Landing;