import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CleanPricingSection } from '../components/blocks/CleanPricingSection';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { getSEOForPage } from '../lib/seoService';
import { generateAllPlansSchema, generateOrganizationSchema } from '../lib/schemaMarkup';

const Plans: React.FC = () => {
  const seo = getSEOForPage('/plans');

  // Generate structured data for all health share plans
  const plansSchema = generateAllPlansSchema();
  const orgSchema = generateOrganizationSchema();

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
        <link rel="canonical" href={seo.canonicalUrl} />
        <meta name="robots" content={seo.robots} />

        <meta property="og:title" content={seo.ogTitle} />
        <meta property="og:description" content={seo.ogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={seo.canonicalUrl} />
        <meta property="og:site_name" content="MPB Health" />
        {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.ogTitle} />
        <meta name="twitter:description" content={seo.ogDescription} />
        {seo.ogImage && <meta name="twitter:image" content={seo.ogImage} />}

        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>

        {/* Product Schemas for each plan */}
        {plansSchema.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

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
