import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroMVP } from '../components/blocks/HeroMVP';
import { PlanCardsMVP } from '../components/blocks/PlanCardsMVP';
import { RadialBenefitsMVP } from '../components/blocks/RadialBenefitsMVP';
import { HowItWorksMVP } from '../components/blocks/HowItWorksMVP';
import { FAQMVPSection } from '../components/blocks/FAQMVPSection';
import { ComplianceNoteMVP } from '../components/blocks/ComplianceNoteMVP';
import { StickyHeaderMVP } from '../components/layout/StickyHeaderMVP';

function LandingMVP() {
  return (
    <>
      <Helmet>
        <title>MPB Health Sharing Plans | Save 30-60% on Healthcare</title>
        <meta
          name="description"
          content="Save 30-60% vs. traditional insurance with community-powered health sharing. Clear costs, any provider, nationwide support. Join thousands of families today."
        />
        <meta name="keywords" content="health sharing plans, affordable healthcare, community health, insurance alternative, medical cost sharing, healthcare savings" />
      </Helmet>

      <StickyHeaderMVP />
      <HeroMVP />
      <PlanCardsMVP />
      <RadialBenefitsMVP />
      <HowItWorksMVP />
      <FAQMVPSection />
      <ComplianceNoteMVP />
    </>
  );
}

export default LandingMVP;
