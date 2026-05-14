// Schema.org Structured Data Generators for SEO
// MPB Health - Health Sharing Plans

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  '@id'?: string;
  name: string;
  url: string;
  logo: string | { '@type': 'ImageObject'; url: string; width?: number; height?: number };
  description: string;
  foundingDate?: string;
  address?: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint: {
    '@type': 'ContactPoint';
    telephone: string;
    contactType: string;
    areaServed: string | string[];
    availableLanguage: string | string[];
    contactOption?: string[];
  }[];
  sameAs: string[];
  numberOfEmployees?: {
    '@type': 'QuantitativeValue';
    minValue?: number;
    maxValue?: number;
  };
  slogan?: string;
}

export interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  brand: {
    '@type': 'Organization';
    name: string;
  };
  offers: {
    '@type': 'Offer' | 'AggregateOffer';
    priceCurrency: string;
    price?: string;
    lowPrice?: string;
    highPrice?: string;
    availability: string;
    priceValidUntil?: string;
    url?: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
    bestRating?: string;
    worstRating?: string;
  };
  category?: string;
  sku?: string;
}

export interface HealthSharePlanSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  '@id'?: string;
  name: string;
  description: string;
  brand: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  category: string;
  offers: {
    '@type': 'AggregateOffer';
    priceCurrency: string;
    lowPrice: string;
    highPrice: string;
    offerCount: number;
    availability: string;
    priceValidUntil: string;
    url: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
    bestRating: string;
    worstRating: string;
  };
  additionalProperty?: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string;
  }>;
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  author: {
    '@type': 'Person' | 'Organization';
    name: string;
    url?: string;
  };
  datePublished: string;
  dateModified?: string;
  image?: string | string[];
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export interface ServiceSchema {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  serviceType: string;
  areaServed: {
    '@type': 'Country';
    name: string;
  };
  hasOfferCatalog?: {
    '@type': 'OfferCatalog';
    name: string;
    itemListElement: Array<{
      '@type': 'Offer';
      itemOffered: {
        '@type': 'Service';
        name: string;
        description: string;
      };
    }>;
  };
}

export interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  '@id': string;
  name: string;
  description: string;
  url: string;
  isPartOf: {
    '@type': 'WebSite';
    '@id': string;
    name: string;
    url: string;
  };
  breadcrumb?: {
    '@type': 'BreadcrumbList';
    itemListElement: Array<{
      '@type': 'ListItem';
      position: number;
      name: string;
      item: string;
    }>;
  };
}

// ============================================
// AI/GEO OPTIMIZED SCHEMAS
// ============================================

export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  '@id': string;
  name: string;
  url: string;
  description: string;
  publisher: {
    '@id': string;
  };
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
  inLanguage: string;
}

export interface SpeakableSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  speakable: {
    '@type': 'SpeakableSpecification';
    cssSelector: string[];
  };
  url: string;
}

export interface LocalBusinessSchema {
  '@context': 'https://schema.org';
  /**
   * Dual @type: `MedicalOrganization` (more specific medical category that AI
   * crawlers and Google understand for healthcare entities) combined with
   * `LocalBusiness` (so we keep the GEO/Local SEO properties: geo,
   * openingHoursSpecification, priceRange, aggregateRating). Schema.org and
   * Google both support an array of types on a single node.
   */
  '@type': ['MedicalOrganization', 'LocalBusiness'];
  '@id': string;
  name: string;
  description: string;
  url: string;
  telephone: string;
  email?: string;
  /** Indicates whether the org accepts new clients (helpful for medical org SEO). */
  isAcceptingNewPatients?: boolean;
  /** schema.org medicalSpecialty enum value (e.g., "PrimaryCare", "Generic"). */
  medicalSpecialty?: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
  priceRange?: string;
  areaServed?: {
    '@type': 'Country';
    name: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
  };
  sameAs: string[];
}

export interface HowToSchema {
  '@context': 'https://schema.org';
  '@type': 'HowTo';
  name: string;
  description: string;
  image?: string;
  totalTime?: string;
  estimatedCost?: {
    '@type': 'MonetaryAmount';
    currency: string;
    value: string;
  };
  step: Array<{
    '@type': 'HowToStep';
    name: string;
    text: string;
    url?: string;
    image?: string;
  }>;
}

export interface ReviewSchema {
  '@context': 'https://schema.org';
  '@type': 'Review';
  itemReviewed: {
    '@type': 'Organization' | 'Product' | 'Service';
    name: string;
  };
  author: {
    '@type': 'Person';
    name: string;
  };
  reviewRating: {
    '@type': 'Rating';
    ratingValue: string;
    bestRating: string;
  };
  reviewBody: string;
  datePublished: string;
}

// ============================================
// GENERATOR FUNCTIONS
// ============================================

/**
 * Generate enhanced Organization schema for MPB Health
 */
export const generateOrganizationSchema = (): OrganizationSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://mpb.health/#organization',
  name: 'MPB Health',
  url: 'https://mpb.health',
  logo: {
    '@type': 'ImageObject',
    url: 'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
    width: 400,
    height: 100,
  },
  description: 'MPB Health offers affordable health sharing programs for individuals, families, and businesses. Not insurance — a smarter, more affordable health share alternative with transparent pricing and no network restrictions.',
  foundingDate: '2011',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5301 N Federal Hwy, Suite 155',
    addressLocality: 'Boca Raton',
    addressRegion: 'FL',
    postalCode: '33487',
    addressCountry: 'US',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+1-855-816-4650',
      contactType: 'Customer Service',
      areaServed: 'US',
      availableLanguage: ['English', 'Spanish'],
      contactOption: ['TollFree'],
    },
    {
      '@type': 'ContactPoint',
      telephone: '+1-855-816-4650',
      contactType: 'Sales',
      areaServed: 'US',
      availableLanguage: ['English', 'Spanish'],
      contactOption: ['TollFree'],
    },
  ],
  sameAs: [
    'https://www.facebook.com/mpbhealth',
    'https://twitter.com/mpbhealth',
    'https://www.linkedin.com/company/mpb-health',
    'https://www.youtube.com/@mpbhealth',
  ],
  slogan: 'Not Insurance — The Smarter, More Affordable Way to Pay for Healthcare Costs',
});

/**
 * Generate Product schema for a health sharing plan
 */
export const generateProductSchema = (
  name: string,
  description: string,
  price: number
): ProductSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name,
  description,
  brand: {
    '@type': 'Organization',
    name: 'MPB Health',
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: price.toString(),
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '3500',
    bestRating: '5',
    worstRating: '1',
  },
});

/**
 * Generate Health Share Plan schema with price range for plan tiers
 */
export const generateHealthSharePlanSchema = (
  planName: string,
  description: string,
  lowPrice: number,
  highPrice: number,
  features: string[]
): HealthSharePlanSchema => {
  // Price valid until end of next year
  const nextYear = new Date().getFullYear() + 1;
  const priceValidUntil = `${nextYear}-12-31`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://mpb.health/plans#${planName.toLowerCase().replace(/\s+/g, '-')}`,
    name: `${planName} Health Sharing Plan`,
    description,
    brand: {
      '@type': 'Organization',
      name: 'MPB Health',
      url: 'https://mpb.health',
    },
    category: 'Health Sharing Plan',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: lowPrice.toString(),
      highPrice: highPrice.toString(),
      offerCount: 9, // Typically 9 tier combinations
      availability: 'https://schema.org/InStock',
      priceValidUntil,
      url: 'https://mpb.health/plans',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '3500',
      bestRating: '5',
      worstRating: '1',
    },
    additionalProperty: features.map((feature) => ({
      '@type': 'PropertyValue',
      name: 'Feature',
      value: feature,
    })),
  };
};

/**
 * Generate multiple plan schemas for all MPB Health plans
 */
export const generateAllPlansSchema = () => {
  const plans = [
    {
      name: 'Essentials',
      description: 'Basic health sharing plan with preventive care, telemedicine, and prescription discounts. Perfect for individuals seeking affordable healthcare coverage.',
      lowPrice: 49.95,
      highPrice: 69.95,
      features: ['Preventive Care', 'Telemedicine', 'Prescription Discounts', 'Vision & Dental Discounts'],
    },
    {
      name: 'Care Plus',
      description: 'Comprehensive health sharing with medical cost sharing for accidents, illnesses, and hospital stays. Includes maternity sharing after waiting period.',
      lowPrice: 166,
      highPrice: 947,
      features: ['Medical Cost Sharing', 'Hospital Coverage', 'Maternity Sharing', 'Prescription Sharing', 'Virtual Behavioral Health Support'],
    },
    {
      name: 'Direct',
      description: 'Enhanced health sharing plan with lower IUA options and comprehensive coverage for families. Includes direct provider payment options.',
      lowPrice: 201,
      highPrice: 1006,
      features: ['Direct Provider Payment', 'Lower IUA Options', 'Comprehensive Coverage', 'Family Plans', 'Specialist Access'],
    },
    {
      name: 'Secure HSA',
      description: 'HSA-compatible health sharing plan allowing tax-advantaged savings. Perfect for those wanting to combine health sharing with HSA benefits.',
      lowPrice: 239,
      highPrice: 1070,
      features: ['HSA Compatible', 'Tax Advantages', 'Medical Cost Sharing', 'Flexible IUA Options', 'Family Coverage'],
    },
    {
      name: 'MEC+ Essentials',
      description: 'Minimum Essential Coverage plan satisfying ACA employer mandate requirements. Ideal for businesses seeking compliant, affordable options.',
      lowPrice: 125,
      highPrice: 195,
      features: ['ACA Compliant', 'Employer Mandate Satisfaction', 'Preventive Care', 'Affordable Business Solution'],
    },
  ];

  return plans.map((plan) =>
    generateHealthSharePlanSchema(plan.name, plan.description, plan.lowPrice, plan.highPrice, plan.features)
  );
};

/**
 * Generate FAQ schema from question/answer pairs
 */
export const generateFAQSchema = (
  questions: Array<{ question: string; answer: string }>
): FAQSchema => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: questions.map((q) => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q.answer,
    },
  })),
});

/**
 * Generate Article schema for blog posts
 */
export const generateArticleSchema = (
  title: string,
  description: string,
  author: string,
  datePublished: string,
  image?: string,
  url?: string
): ArticleSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  author: {
    '@type': 'Organization',
    name: author || 'MPB Health',
    url: 'https://mpb.health',
  },
  datePublished,
  dateModified: datePublished,
  image: image || 'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
  publisher: {
    '@type': 'Organization',
    name: 'MPB Health',
    logo: {
      '@type': 'ImageObject',
      url: 'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
    },
  },
  mainEntityOfPage: url
    ? {
        '@type': 'WebPage',
        '@id': url,
      }
    : undefined,
});

/**
 * Generate Service schema for health sharing services
 */
export const generateServiceSchema = (): ServiceSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Health Sharing Programs',
  description: 'Community-based health sharing programs offering affordable alternatives to traditional health insurance. Members share medical expenses together.',
  provider: {
    '@type': 'Organization',
    name: 'MPB Health',
    url: 'https://mpb.health',
  },
  serviceType: 'Health Sharing',
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Health Sharing Plans',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Individual & Family Plans',
          description: 'Health sharing plans for individuals and families seeking affordable healthcare solutions.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Business & Organization Plans',
          description: 'Group health sharing solutions for businesses and organizations.',
        },
      },
    ],
  },
});

/**
 * Generate Breadcrumb schema
 */
export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `https://mpb.health${crumb.url}`,
  })),
});

/**
 * Generate WebPage schema
 */
export const generateWebPageSchema = (
  name: string,
  description: string,
  url: string,
  breadcrumbs?: Array<{ name: string; url: string }>
): WebPageSchema => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `https://mpb.health${url}#webpage`,
  name,
  description,
  url: `https://mpb.health${url}`,
  isPartOf: {
    '@type': 'WebSite',
    '@id': 'https://mpb.health/#website',
    name: 'MPB Health',
    url: 'https://mpb.health',
  },
  breadcrumb: breadcrumbs
    ? {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: `https://mpb.health${crumb.url}`,
        })),
      }
    : undefined,
});

/**
 * Generate WebSite schema (important for AI search engines and sitelinks)
 */
export const generateWebSiteSchema = (): WebSiteSchema => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://mpb.health/#website',
  name: 'MPB Health',
  url: 'https://mpb.health',
  description: 'Affordable health sharing plans for individuals, families, and businesses. Save up to 60% compared to traditional health insurance.',
  publisher: {
    '@id': 'https://mpb.health/#organization',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://mpb.health/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: 'en-US',
});

/**
 * Generate Speakable schema for voice assistants (Google Assistant, Alexa, etc.)
 */
export const generateSpeakableSchema = (
  pageName: string,
  url: string,
  cssSelectors: string[] = ['h1', '.hero-text', '.main-content p:first-of-type']
): SpeakableSchema => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: pageName,
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: cssSelectors,
  },
  url: `https://mpb.health${url}`,
});

/**
 * Generate the LocalBusiness / MedicalOrganization schema for local + GEO SEO.
 *
 * Uses a dual @type so the node is simultaneously a `MedicalOrganization`
 * (semantic medical category — boosts AI / Google understanding of the
 * business) and a `LocalBusiness` (unlocks geo, openingHoursSpecification,
 * priceRange, aggregateRating for Local SEO scoring).
 */
export const generateLocalBusinessSchema = (): LocalBusinessSchema => ({
  '@context': 'https://schema.org',
  '@type': ['MedicalOrganization', 'LocalBusiness'],
  '@id': 'https://mpb.health/#localbusiness',
  name: 'MPB Health',
  description:
    'MPB Health offers flexible, affordable HealthShare memberships for individuals, families, and businesses across the United States — a community-driven alternative to traditional health insurance.',
  url: 'https://mpb.health/',
  telephone: '+1-855-816-4650',
  email: 'info@mympb.com',
  isAcceptingNewPatients: true,
  medicalSpecialty: 'PrimaryCare',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5301 N Federal Hwy, Suite 155',
    addressLocality: 'Boca Raton',
    addressRegion: 'FL',
    postalCode: '33487',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 26.3683,
    longitude: -80.0811,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
  ],
  priceRange: '$$',
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '3500',
  },
  sameAs: [
    'https://www.facebook.com/mpbhealth',
    'https://twitter.com/mpbhealth',
    'https://www.linkedin.com/company/mpb-health',
    'https://www.youtube.com/@mpbhealth',
  ],
});

/**
 * Generate HowTo schema for process pages (enrollment, how-it-works)
 */
export const generateHowToSchema = (
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; url?: string }>
): HowToSchema => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name,
  description,
  image: 'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
  totalTime: 'PT10M',
  step: steps.map((step, index) => ({
    '@type': 'HowToStep',
    name: step.name,
    text: step.text,
    url: step.url ? `https://mpb.health${step.url}` : undefined,
  })),
});

/**
 * Generate enrollment HowTo schema
 */
export const generateEnrollmentHowToSchema = (): HowToSchema =>
  generateHowToSchema(
    'How to Enroll in MPB Health Sharing',
    'Step-by-step guide to enrolling in an affordable health sharing plan with MPB Health.',
    [
      {
        name: 'Get a Free Quote',
        text: 'Enter your ZIP code and household information to see personalized plan options and pricing.',
        url: '/quote',
      },
      {
        name: 'Compare Plans',
        text: 'Review available health sharing plans including Essentials, Care Plus, Direct, and Secure HSA options.',
        url: '/plans',
      },
      {
        name: 'Select Your Plan',
        text: 'Choose the plan that best fits your healthcare needs and budget. Select your IUA (Initial Unshareable Amount) level.',
        url: '/enrollment',
      },
      {
        name: 'Complete Enrollment',
        text: 'Fill out the enrollment form with your personal and payment information. Your membership begins immediately.',
        url: '/enrollment',
      },
      {
        name: 'Receive Your Member Card',
        text: 'Get instant access to your digital member card and welcome materials via email.',
      },
    ]
  );

/**
 * Generate Review/Testimonial schema
 */
export const generateReviewSchema = (
  reviewerName: string,
  ratingValue: string,
  reviewBody: string,
  datePublished: string
): ReviewSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Review',
  itemReviewed: {
    '@type': 'Organization',
    name: 'MPB Health',
  },
  author: {
    '@type': 'Person',
    name: reviewerName,
  },
  reviewRating: {
    '@type': 'Rating',
    ratingValue,
    bestRating: '5',
  },
  reviewBody,
  datePublished,
});

/**
 * Generate comprehensive schema bundle for homepage (AI-optimized)
 */
export const generateHomepageSchemaBundle = () => [
  generateOrganizationSchema(),
  generateWebSiteSchema(),
  generateLocalBusinessSchema(),
  generateServiceSchema(),
  ...generateAllPlansSchema(),
];

/**
 * Generate schema bundle for plans page
 */
export const generatePlansPageSchemaBundle = () => [
  generateOrganizationSchema(),
  ...generateAllPlansSchema(),
  generateHowToSchema(
    'How to Choose a Health Sharing Plan',
    'Guide to selecting the right MPB Health sharing plan for your needs.',
    [
      { name: 'Assess Your Needs', text: 'Consider your healthcare usage, family size, and budget requirements.' },
      { name: 'Compare IUA Levels', text: 'Lower IUA means higher monthly contribution but lower out-of-pocket costs.' },
      { name: 'Review Plan Features', text: 'Compare telemedicine, prescription sharing, and specialty coverage options.' },
      { name: 'Calculate Total Cost', text: 'Factor in monthly contribution plus expected medical expenses.' },
    ]
  ),
];

/**
 * Inject schema into document head
 */
export const injectSchema = (schema: unknown): void => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
};

/**
 * Inject multiple schemas into document head
 */
export const injectSchemas = (schemas: unknown[]): void => {
  schemas.forEach((schema) => injectSchema(schema));
};

/**
 * Remove all schema scripts from document head
 */
export const clearSchemas = (): void => {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach((script) => script.remove());
};
