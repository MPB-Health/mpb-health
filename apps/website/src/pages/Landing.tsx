import React, { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { EnhancedHero } from '../components/blocks/EnhancedHero';
import { EnhancedTrustBar } from '../components/blocks/EnhancedTrustBar';
import { SolutionsSection } from '../components/blocks/SolutionsSection';
import { UnifiedPathSelector } from '../components/blocks/UnifiedPathSelector';
import { MedicalCostSharingInfo } from '../components/blocks/MedicalCostSharingInfo';
import { MemberExperienceSection } from '../components/blocks/MemberExperienceSection';
import RateCalculator from '../components/RateCalculator';
import { AffiliateProvider } from '../components/AffiliateProvider';
import { StickyMobileCTA } from '../components/layout/StickyMobileCTA';
import { generateOrganizationSchema, generateServiceSchema } from '../lib/schemaMarkup';

// Lazy load below-the-fold components
const ObjectionBlocks = lazy(() => import('../components/blocks/ObjectionBlocks').then(m => ({ default: m.ObjectionBlocks })));
const SocialProof = lazy(() => import('../components/blocks/SocialProof').then(m => ({ default: m.SocialProof })));

const Loading = () => (
  <div className="animate-pulse bg-neutral-100 rounded-lg h-64" />
);

const Landing: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>MPB Health - Affordable Health Sharing Plans | Save Up to 60%</title>
        <meta
          name="description"
          content="Join 50,000+ families saving up to 60% on healthcare with MPB Health's community health sharing. No network restrictions, transparent pricing, nationwide coverage."
        />
        <meta name="keywords" content="health sharing, healthcare costs, insurance alternative, community health, medical cost sharing, affordable healthcare, health sharing plans" />

        {/* Preload critical resources */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" as="style" />

        {/* Open Graph */}
        <meta property="og:title" content="MPB Health - Affordable Health Sharing Plans" />
        <meta property="og:description" content="Save up to 60% on healthcare costs with trusted community health sharing. No network restrictions, transparent pricing." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mpb.health" />
        <meta property="og:site_name" content="MPB Health" />
        <meta property="og:image" content="https://mpb.health/assets/MPB-Health-No-background.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />

        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify(generateOrganizationSchema())}
        </script>

        {/* Service Schema */}
        <script type="application/ld+json">
          {JSON.stringify(generateServiceSchema())}
        </script>
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
      <MemberExperienceSection />

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