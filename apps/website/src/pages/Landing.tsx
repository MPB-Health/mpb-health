import React, { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { generateFAQSchema, homepageFaqQuestions } from '../lib/schemaMarkup';
import { EnhancedHero } from '../components/blocks/EnhancedHero';
import { EnhancedTrustBar } from '../components/blocks/EnhancedTrustBar';
import { SolutionsSection } from '../components/blocks/SolutionsSection';
import { UnifiedPathSelector } from '../components/blocks/UnifiedPathSelector';
import { MedicalCostSharingInfo } from '../components/blocks/MedicalCostSharingInfo';
import { AffiliateProvider } from '../components/AffiliateProvider';
import { StickyMobileCTA } from '../components/layout/StickyMobileCTA';

// Lazy load below-the-fold / interaction-gated components
const RateCalculator = lazy(() => import('../components/RateCalculator'));
const ObjectionBlocks = lazy(() => import('../components/blocks/ObjectionBlocks').then(m => ({ default: m.ObjectionBlocks })));
const SocialProof = lazy(() => import('../components/blocks/SocialProof').then(m => ({ default: m.SocialProof })));

const Loading = () => (
  <div className="animate-pulse bg-neutral-100 rounded-lg h-64" />
);

const Landing: React.FC = () => {
  const homepageFaqSchema = generateFAQSchema(homepageFaqQuestions);

  // Canonical is intentionally NOT set inside <Helmet> below. The static
  // <link rel="canonical" href="https://mpb.health/" /> in
  // apps/website/index.html is the source of truth. Setting another canonical
  // here would result in two <link rel="canonical"> tags in the DOM after
  // hydration (react-helmet-async appends — it does not remove static head
  // tags), which SEO auditors flag as duplicates.
  return (
    <>
      <Helmet>
        <title>Healthsharing Memberships & Medical Cost Sharing | MPB</title>
        <meta
          name="description"
          content="Explore healthsharing memberships with medical cost sharing, no network limits, and clear monthly costs. Get a smarter alternative to traditional insurance."
        />
        <meta name="keywords" content="healthsharing memberships, medical cost sharing, health sharing, healthcare costs, insurance alternative, community health, affordable healthcare" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content="Healthsharing Memberships & Medical Cost Sharing | MPB" />
        <meta property="og:description" content="Explore healthsharing memberships with medical cost sharing, no network limits, and clear monthly costs. Get a smarter alternative to traditional insurance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mpb.health/" />
        <meta property="og:site_name" content="MPB Health" />
        <meta property="og:image" content="https://mpb.health/assets/MPB-Health-No-background.png?v=2" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />

        {/* PAA FAQ Schema */}
        <script type="application/ld+json">{JSON.stringify(homepageFaqSchema)}</script>
      </Helmet>

      {/* Above the fold - critical render path */}
      <EnhancedHero />
      <SolutionsSection />
      <MedicalCostSharingInfo />
      <UnifiedPathSelector />
      <AffiliateProvider>
        <div id="calculator" className="scroll-mt-24 bg-white py-0">
          <Suspense fallback={<Loading />}>
            <RateCalculator />
          </Suspense>
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