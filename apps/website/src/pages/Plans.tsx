import React from 'react';
import { CleanPricingSection } from '../components/blocks/CleanPricingSection';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getSEOForPage } from '../lib/seoService';
import { generateAllPlansSchema, generateOrganizationSchema, generateFAQSchema, plansFaqQuestions } from '../lib/schemaMarkup';

const Plans: React.FC = () => {
  const seo = getSEOForPage('/plans');

  // Generate structured data for all health share plans
  const plansSchema = generateAllPlansSchema();
  const orgSchema = generateOrganizationSchema();
  const plansFaqSchema = generateFAQSchema(plansFaqQuestions);

  return (
    <>
      <MarketingHydrationSeo robots={seo.robots}>
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>
        {plansSchema.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
        <script type="application/ld+json">
          {JSON.stringify(plansFaqSchema)}
        </script>
      </MarketingHydrationSeo>

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <CleanPricingSection />
        </div>
      </div>
    </>
  );
};

export { Plans };
export default Plans;
