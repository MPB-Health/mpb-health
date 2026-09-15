import React from 'react';
import { generateFAQSchema, homepageFaqQuestions } from '../lib/schemaMarkup';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import { LandingRedesign } from '../components/landing-redesign/LandingRedesign';

const Landing: React.FC = () => {
  const homepageFaqSchema = generateFAQSchema(homepageFaqQuestions);

  return (
    <>
      <MarketingHydrationSeo>
        <script type="application/ld+json">{JSON.stringify(homepageFaqSchema)}</script>
      </MarketingHydrationSeo>
      <LandingRedesign />
    </>
  );
};

export { Landing };
export default Landing;
