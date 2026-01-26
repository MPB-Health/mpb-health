import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getSEOForPage, getStructuredData } from '../lib/seoService';
import {
  generateOrganizationSchema,
  generateFAQSchema,
  generateArticleSchema,
  generateHealthSharePlanSchema,
  generateAllPlansSchema,
  generateServiceSchema,
  generateWebPageSchema,
  generateWebSiteSchema,
  generateLocalBusinessSchema,
  generateSpeakableSchema,
  generateHomepageSchemaBundle,
  generatePlansPageSchemaBundle,
  generateEnrollmentHowToSchema,
} from '../lib/schemaMarkup';

interface SEOHeadProps {
  pathname?: string;
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string;
  structuredDataType?: 'organization' | 'faq' | 'article' | 'product' | 'plans' | 'service' | 'webpage' | 'homepage' | 'howto';
  structuredDataContent?: {
    // FAQ content
    questions?: Array<{ question: string; answer: string }>;
    // Article content
    title?: string;
    description?: string;
    author?: string;
    publishedDate?: string;
    modifiedDate?: string;
    image?: string;
    url?: string;
    // Product content
    planName?: string;
    planDescription?: string;
    lowPrice?: number;
    highPrice?: number;
    features?: string[];
    // WebPage content
    pageName?: string;
    pageDescription?: string;
    pageUrl?: string;
    breadcrumbs?: Array<{ name: string; url: string }>;
    // HowTo content
    howToSteps?: Array<{ name: string; text: string; url?: string }>;
  };
  // Include organization schema (typically on homepage)
  includeOrganization?: boolean;
  // Include service schema
  includeService?: boolean;
  // Include WebSite schema (for sitelinks in search)
  includeWebSite?: boolean;
  // Include LocalBusiness schema (for local SEO)
  includeLocalBusiness?: boolean;
  // Include Speakable schema (for voice assistants)
  includeSpeakable?: boolean;
  // AI-specific optimization flags
  aiOptimized?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  pathname,
  customTitle,
  customDescription,
  customKeywords,
  structuredDataType,
  structuredDataContent,
  includeOrganization = false,
  includeService = false,
  includeWebSite = false,
  includeLocalBusiness = false,
  includeSpeakable = false,
  aiOptimized = false,
}) => {
  const seo = pathname ? getSEOForPage(pathname) : null;

  const title = customTitle || seo?.title || 'MPB Health - Affordable Health Sharing Plans';
  const description =
    customDescription ||
    seo?.description ||
    'Join thousands of families saving on healthcare with MPB Health sharing plans.';
  const keywords =
    customKeywords || seo?.keywords || 'health sharing, healthcare costs, insurance alternative';
  const canonicalUrl = seo?.canonicalUrl || 'https://mpb.health';
  const ogTitle = seo?.ogTitle || title;
  const ogDescription = seo?.ogDescription || description;
  const ogImage = seo?.ogImage || 'https://mpb.health/assets/MPB-Health-No-background.png';
  const robots = seo?.robots || 'index, follow';

  // AI-optimized content snippets for featured snippets and AI summaries
  const aiSummary = `MPB Health offers affordable health sharing plans starting at $49.95/month. Save up to 60% vs traditional insurance. Plans include: Essentials (preventive care), Care Plus (comprehensive), Direct (enhanced), Secure HSA (tax-advantaged). Serving all 50 US states. Call 855-816-4650.`;

  // Generate structured data based on type
  const getStructuredDataForType = () => {
    if (!structuredDataType) return null;

    switch (structuredDataType) {
      case 'organization':
        return generateOrganizationSchema();

      case 'faq':
        if (structuredDataContent?.questions) {
          return generateFAQSchema(structuredDataContent.questions);
        }
        return getStructuredData('faq', structuredDataContent);

      case 'article':
        if (structuredDataContent) {
          return generateArticleSchema(
            structuredDataContent.title || title,
            structuredDataContent.description || description,
            structuredDataContent.author || 'MPB Health',
            structuredDataContent.publishedDate || new Date().toISOString(),
            structuredDataContent.image,
            structuredDataContent.url
          );
        }
        return getStructuredData('article', structuredDataContent);

      case 'product':
        if (structuredDataContent?.planName) {
          return generateHealthSharePlanSchema(
            structuredDataContent.planName,
            structuredDataContent.planDescription || '',
            structuredDataContent.lowPrice || 0,
            structuredDataContent.highPrice || 0,
            structuredDataContent.features || []
          );
        }
        return null;

      case 'plans':
        // Returns array of all plan schemas
        return generateAllPlansSchema();

      case 'service':
        return generateServiceSchema();

      case 'webpage':
        return generateWebPageSchema(
          structuredDataContent?.pageName || title,
          structuredDataContent?.pageDescription || description,
          structuredDataContent?.pageUrl || pathname || '/',
          structuredDataContent?.breadcrumbs
        );

      case 'homepage':
        // Returns comprehensive bundle for homepage (AI-optimized)
        return generateHomepageSchemaBundle();

      case 'howto':
        return generateEnrollmentHowToSchema();

      default:
        return null;
    }
  };

  const structuredData = getStructuredDataForType();

  // Build array of all schemas to include
  const allSchemas: unknown[] = [];

  if (includeOrganization) {
    allSchemas.push(generateOrganizationSchema());
  }

  if (includeService) {
    allSchemas.push(generateServiceSchema());
  }

  if (includeWebSite) {
    allSchemas.push(generateWebSiteSchema());
  }

  if (includeLocalBusiness) {
    allSchemas.push(generateLocalBusinessSchema());
  }

  if (includeSpeakable && pathname) {
    allSchemas.push(generateSpeakableSchema(title, pathname));
  }

  if (structuredData) {
    if (Array.isArray(structuredData)) {
      allSchemas.push(...structuredData);
    } else {
      allSchemas.push(structuredData);
    }
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robots} />

      {/* AI/GEO Optimization Meta Tags */}
      {aiOptimized && (
        <>
          <meta name="ai-summary" content={aiSummary} />
          <meta name="abstract" content={description} />
        </>
      )}

      {/* Google-specific */}
      <meta name="google" content="notranslate" />
      <meta name="googlebot" content={robots} />
      <meta name="bingbot" content={robots} />

      {/* Content categorization for AI */}
      <meta name="category" content="Health Sharing, Healthcare, Insurance Alternative" />
      <meta name="classification" content="Healthcare Services" />
      <meta name="coverage" content="United States" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      <meta name="revisit-after" content="7 days" />
      <meta name="target" content="all" />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="MPB Health" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@mpbhealth" />

      {/* Additional SEO tags */}
      <meta name="author" content="MPB Health" />
      <meta name="publisher" content="MPB Health" />
      <meta name="copyright" content="MPB Health" />
      <meta name="language" content="en-US" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="Boca Raton, Florida" />
      <meta name="geo.position" content="26.3683;-80.0811" />
      <meta name="ICBM" content="26.3683, -80.0811" />

      {/* Structured Data */}
      {allSchemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
