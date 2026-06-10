import React, { lazy, Suspense } from 'react';
import { generateFAQSchema, homepageFaqQuestions } from '../lib/schemaMarkup';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
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

  // Title, description, canonical, keywords, robots, and OG/Twitter tags live in
  // the prerendered static HTML (page-seo-data.json + prerender-seo.mjs).
  return (
    <>
      <MarketingHydrationSeo>
        <script type="application/ld+json">{JSON.stringify(homepageFaqSchema)}</script>
      </MarketingHydrationSeo>

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