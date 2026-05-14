// Per-route SEO metadata. Single source of truth lives in `page-seo-data.json`
// so the build-time prerender script (apps/website/scripts/prerender-seo.mjs)
// can consume the exact same values when generating `dist/<route>/index.html`
// files. Edit the JSON, not this file.
import pageSeoData from './page-seo-data.json';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  robots?: string;
}

export const pageSEO: Record<string, SEOMetadata> = pageSeoData as Record<string, SEOMetadata>;

export const defaultSEO: SEOMetadata = pageSEO['/'];

export function getSEOForPage(pathname: string): SEOMetadata {
  return pageSEO[pathname] || defaultSEO;
}

export function getStructuredData(type: 'organization' | 'faq' | 'article', data?: any) {
  const baseUrl = 'https://mpb.health';

  if (type === 'organization') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'MPB Health',
      description: 'Community-based health sharing organization offering affordable alternatives to traditional health insurance',
      url: baseUrl,
      logo: `${baseUrl}/assets/MPB-Health-No-background.png?v=2`,
      telephone: '(855) 816-4650',
      email: 'info@mympb.com',
      foundingDate: '2011',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '5301 N Federal Hwy, Suite 155',
        addressLocality: 'Boca Raton',
        addressRegion: 'FL',
        postalCode: '33487',
        addressCountry: 'US'
      },
      sameAs: [
        'https://www.facebook.com/mpbhealth',
        'https://www.linkedin.com/company/mpb-health',
        'https://twitter.com/mpbhealth'
      ]
    };
  }

  if (type === 'faq' && data?.questions) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.questions.map((q: any) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.answer
        }
      }))
    };
  }

  if (type === 'article' && data) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.description,
      image: data.image || `${baseUrl}/assets/MPB-Health-No-background.png?v=2`,
      author: {
        '@type': 'Organization',
        name: 'MPB Health'
      },
      publisher: {
        '@type': 'Organization',
        name: 'MPB Health',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/assets/MPB-Health-No-background.png?v=2`
        }
      },
      datePublished: data.publishedDate,
      dateModified: data.modifiedDate || data.publishedDate
    };
  }

  return {};
}
