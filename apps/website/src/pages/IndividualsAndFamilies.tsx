import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SocialProof } from '../components/blocks/SocialProof';
import { RadialBenefits } from '../components/blocks/RadialBenefits';
import { TailoredJourney } from '../components/blocks/TailoredJourney';
import { EnhancedPricingSection } from '../components/blocks/EnhancedPricingSection';
import { PlanFeaturesGrid } from '../components/blocks/PlanFeaturesGrid';
import RateCalculator from '../components/RateCalculator';
import { AffiliateProvider } from '../components/AffiliateProvider';
import { IndividualsFamiliesHero } from '../components/blocks/IndividualsFamiliesHero';
import { PlanComparisonGuide } from '../components/blocks/PlanComparisonGuide';
import { generateHealthSharePlanSchema, generateOrganizationSchema } from '../lib/schemaMarkup';
import { Link } from 'react-router-dom';
import { GitCompare, FileText } from 'lucide-react';

const IndividualsAndFamilies = () => {
  // Generate product schemas for individual/family plans
  const carePlusSchema = generateHealthSharePlanSchema(
    'Care Plus',
    'Comprehensive health sharing for individuals and families with medical cost sharing, maternity, and prescription benefits.',
    166,
    947,
    ['Medical Cost Sharing', 'Maternity Sharing', 'Prescription Sharing', 'Virtual Behavioral Health', 'No Network Restrictions']
  );

  const directSchema = generateHealthSharePlanSchema(
    'Direct',
    'Enhanced health sharing plan with direct provider payment and comprehensive family coverage options.',
    201,
    1006,
    ['Direct Provider Payment', 'Lower IUA Options', 'Family Coverage', 'Specialist Access', 'Comprehensive Benefits']
  );

  const secureHSASchema = generateHealthSharePlanSchema(
    'Secure HSA',
    'HSA-compatible health sharing plan for tax-advantaged healthcare savings combined with medical cost sharing.',
    239,
    1070,
    ['HSA Compatible', 'Tax Advantages', 'Medical Cost Sharing', 'Family Plans', 'Flexible IUA Options']
  );

  const orgSchema = generateOrganizationSchema();

  return (
    <>
      <Helmet>
        <title>Health Sharing for Individuals & Families | MPB Health</title>
        <meta
          name="description"
          content="Save up to 60% on healthcare with MPB Health sharing plans for individuals and families. No network restrictions, transparent pricing, and comprehensive coverage options."
        />
        <meta name="keywords" content="family health sharing, individual health plan, affordable healthcare, medical cost sharing, health share alternative" />
        <link rel="canonical" href="https://mpb.health/individuals-and-families" />

        {/* Open Graph */}
        <meta property="og:title" content="Health Sharing for Individuals & Families | MPB Health" />
        <meta property="og:description" content="Save up to 60% on healthcare with MPB Health sharing plans for individuals and families." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mpb.health/individuals-and-families" />
        <meta property="og:site_name" content="MPB Health" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Health Sharing for Individuals & Families | MPB Health" />
        <meta name="twitter:description" content="Save up to 60% on healthcare with MPB Health sharing plans." />

        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>

        {/* Product Schemas */}
        <script type="application/ld+json">
          {JSON.stringify(carePlusSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(directSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(secureHSASchema)}
        </script>
      </Helmet>

      <IndividualsFamiliesHero />

      {/* Personalized Journey Section */}
      <TailoredJourney />

      {/* Why Families Choose Health Sharing Section */}
      <RadialBenefits />

      {/* Choose Your Membership - Enhanced Version */}
      <EnhancedPricingSection />

      {/* Plan Comparison CTA */}
      <section className="py-16 bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-primary-100 p-8 md:p-12">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                <GitCompare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-900">
                Need Help Comparing Plans?
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                View all plans side-by-side to find the perfect fit for your family's healthcare needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  to="/compare-plans"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform hover:scale-105"
                >
                  <GitCompare className="w-5 h-5 mr-2" />
                  Compare Plans Online
                </Link>
                <a
                  href="/docs/plan-comparison-guide.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-primary-300 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 hover:border-primary-400 transition-all duration-300"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Download Comparison Guide
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Plan Comparison Guide */}
      <PlanComparisonGuide 
        title="Compare All Plans Side-by-Side"
        subtitle="See exactly what each plan offers to find the perfect fit for your family"
      />

      {/* Features of the Plan Section */}
      <PlanFeaturesGrid />

      {/* Rate Calculator Section */}
      <AffiliateProvider>
        <RateCalculator />
      </AffiliateProvider>

      {/* Social Proof Section */}
      <SocialProof />
    </>
  );
};

export { IndividualsAndFamilies };
export default IndividualsAndFamilies;
