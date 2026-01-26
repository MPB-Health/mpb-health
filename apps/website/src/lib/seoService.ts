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

export const defaultSEO: SEOMetadata = {
  title: 'MPB Health - Affordable Health Sharing Plans | Save Up to 60%',
  description: 'Join 50,000+ families saving up to 60% on healthcare with MPB Health\'s community health sharing. No network restrictions, transparent pricing, nationwide coverage.',
  keywords: 'health sharing, healthcare costs, insurance alternative, medical cost sharing, affordable healthcare, community health',
  ogTitle: 'MPB Health - Affordable Health Sharing Plans',
  ogDescription: 'Save up to 60% on healthcare costs with trusted community health sharing. No network restrictions, transparent pricing.',
  ogImage: 'https://mpb.health/assets/MPB-Health-No-background.png',
  canonicalUrl: 'https://mpb.health',
  robots: 'index, follow'
};

export const pageSEO: Record<string, SEOMetadata> = {
  '/': {
    title: 'MPB Health - Affordable Health Sharing Plans | Save Up to 60%',
    description: 'Join 50,000+ families saving up to 60% on healthcare with MPB Health\'s community health sharing. No network restrictions, transparent pricing.',
    keywords: 'health sharing, healthcare costs, insurance alternative, affordable healthcare, medical cost sharing',
    ogTitle: 'MPB Health - Affordable Health Sharing Plans',
    ogDescription: 'Save up to 60% on healthcare with trusted community health sharing.',
    ogImage: 'https://mpb.health/assets/MPB-Health-No-background.png',
    canonicalUrl: 'https://mpb.health',
    robots: 'index, follow'
  },
  '/enrollment': {
    title: 'Enroll Now | MPB Health Sharing Plans',
    description: 'Enroll in MPB Health today. Simple online enrollment, flexible plans, and savings up to 60%. No medical underwriting required.',
    keywords: 'enroll health sharing, health sharing enrollment, sign up health plan, join MPB Health',
    ogTitle: 'Enroll in MPB Health',
    ogDescription: 'Simple enrollment process. Start saving on healthcare today.',
    canonicalUrl: 'https://mpb.health/enrollment',
    robots: 'index, follow'
  },
  '/plans': {
    title: 'Health Sharing Plans & Pricing | MPB Health 2026',
    description: 'Compare MPB Health sharing plans: Essentials, Care Plus, Direct, and Secure HSA. Transparent pricing, flexible membership options. Find your perfect plan.',
    keywords: 'health sharing plans, healthcare pricing, plan comparison, essentials plan, care plus, secure HSA, medical cost sharing options',
    ogTitle: 'Compare Health Sharing Plans | MPB Health',
    ogDescription: 'Transparent pricing, flexible options. Find the right plan for your family.',
    canonicalUrl: 'https://mpb.health/plans',
    robots: 'index, follow'
  },
  '/quote': {
    title: 'Get Your Free Quote - Rate Calculator | MPB Health',
    description: 'Calculate your monthly health sharing cost in seconds. Free, no-obligation quote. See potential savings compared to traditional insurance.',
    keywords: 'health sharing quote, cost calculator, rate estimate, healthcare pricing calculator, quick quote',
    ogTitle: 'Free Health Sharing Quote Calculator',
    ogDescription: 'Calculate your rate in seconds. See how much you could save.',
    canonicalUrl: 'https://mpb.health/quote',
    robots: 'index, follow'
  },
  '/how-it-works': {
    title: 'How Health Sharing Works | MPB Health Explained',
    description: 'Discover how community-based health sharing works. Members share medical expenses through a proven, faith-based model. Learn the step-by-step process.',
    keywords: 'how health sharing works, medical cost sharing explained, community health, healthcare alternative, health sharing process',
    ogTitle: 'How Health Sharing Works | MPB Health',
    ogDescription: 'Community members share medical expenses. Simple, transparent, affordable.',
    canonicalUrl: 'https://mpb.health/how-it-works',
    robots: 'index, follow'
  },
  '/about-us': {
    title: 'About MPB Health - 14+ Years of Healthcare Solutions',
    description: 'MPB Health has served 50,000+ families since 2011. Learn about our mission to provide affordable, community-based healthcare alternatives.',
    keywords: 'about MPB Health, health sharing organization, healthcare mission, company history, healthcare alternative provider',
    ogTitle: 'About MPB Health - Our Story',
    ogDescription: '17+ years serving families with affordable healthcare solutions.',
    canonicalUrl: 'https://mpb.health/about-us',
    robots: 'index, follow'
  },
  '/contact': {
    title: 'Contact MPB Health - Get Help & Support | (855) 816-4650',
    description: 'Contact MPB Health for questions about health sharing plans, enrollment, or member support. Call (855) 816-4650 or message us online.',
    keywords: 'contact MPB Health, customer support, enrollment help, health sharing questions, phone number',
    ogTitle: 'Contact MPB Health',
    ogDescription: 'Get answers to your health sharing questions. Call us at (855) 816-4650.',
    canonicalUrl: 'https://mpb.health/contact',
    robots: 'index, follow'
  },
  '/faq': {
    title: 'Frequently Asked Questions - Health Sharing | MPB Health',
    description: 'Get answers to common questions about health sharing, enrollment, coverage, costs, and more. Comprehensive FAQ for MPB Health members.',
    keywords: 'health sharing FAQ, common questions, health sharing answers, enrollment questions, membership FAQ',
    ogTitle: 'Health Sharing FAQ | MPB Health',
    ogDescription: 'Find answers to your health sharing questions.',
    canonicalUrl: 'https://mpb.health/faq',
    robots: 'index, follow'
  },
  '/blog': {
    title: 'Health & Wellness Blog - Expert Tips | MPB Health',
    description: 'Expert healthcare tips, wellness advice, cost-saving strategies, and health sharing insights. Stay informed with the MPB Health blog.',
    keywords: 'health blog, wellness tips, healthcare advice, medical cost saving, health sharing insights',
    ogTitle: 'MPB Health Blog - Healthcare Tips & Insights',
    ogDescription: 'Expert advice on health, wellness, and affordable healthcare.',
    canonicalUrl: 'https://mpb.health/blog',
    robots: 'index, follow'
  },
  '/individuals-families': {
    title: 'Health Sharing for Individuals & Families | MPB Health',
    description: 'Affordable health sharing plans designed for individuals and families. Save up to 60% compared to traditional insurance. No network restrictions.',
    keywords: 'family health sharing, individual health plan, family healthcare, affordable health membership, family medical sharing',
    ogTitle: 'Health Sharing for Families | MPB Health',
    ogDescription: 'Affordable plans for individuals and families. Save up to 60%.',
    canonicalUrl: 'https://mpb.health/individuals-families',
    robots: 'index, follow'
  },
  '/businesses-organizations': {
    title: 'Business Health Sharing Solutions | Employer Healthcare | MPB Health',
    description: 'Affordable health sharing for businesses and organizations. MEC+ Essentials satisfies ACA mandate. Secure HSA-compatible options. Save on group healthcare.',
    keywords: 'business health sharing, employer healthcare, group health plan, ACA compliance, MEC plans, business healthcare solutions',
    ogTitle: 'Business Health Sharing Solutions | MPB Health',
    ogDescription: 'Affordable group healthcare for businesses. ACA-compliant options.',
    canonicalUrl: 'https://mpb.health/businesses-organizations',
    robots: 'index, follow'
  },
  '/advisor-directory': {
    title: 'Find a Health Sharing Advisor Near You | MPB Health',
    description: 'Connect with experienced health sharing advisors in your area. Get personalized guidance on plans, enrollment, and healthcare solutions.',
    keywords: 'health sharing advisor, healthcare advisor, insurance agent, health plan consultant, find advisor',
    ogTitle: 'Find a Health Sharing Advisor | MPB Health',
    ogDescription: 'Connect with experienced advisors in your area.',
    canonicalUrl: 'https://mpb.health/advisor-directory',
    robots: 'index, follow'
  },
  '/benefits': {
    title: 'Member Benefits & Voluntary Membership | MPB Health',
    description: 'Explore additional benefits: dental, vision, telemedicine, prescription assistance, and wellness programs. Comprehensive healthcare solutions.',
    keywords: 'health benefits, dental membership, vision insurance, telemedicine, prescription assistance, wellness programs',
    ogTitle: 'Member Benefits | MPB Health',
    ogDescription: 'Dental, vision, telemedicine, and more supplemental benefits.',
    canonicalUrl: 'https://mpb.health/benefits',
    robots: 'index, follow'
  },
  '/resource-library': {
    title: 'Health Sharing Resources & Guides | MPB Health',
    description: 'Access helpful resources, guides, forms, and educational materials about health sharing. Download member handbooks and enrollment guides.',
    keywords: 'health sharing resources, member guides, enrollment forms, healthcare education, member handbook',
    ogTitle: 'Resource Library | MPB Health',
    ogDescription: 'Helpful guides, forms, and educational resources.',
    canonicalUrl: 'https://mpb.health/resource-library',
    robots: 'index, follow'
  }
};

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
      logo: `${baseUrl}/assets/MPB-Health-No-background.png`,
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
      image: data.image || `${baseUrl}/assets/MPB-Health-No-background.png`,
      author: {
        '@type': 'Organization',
        name: 'MPB Health'
      },
      publisher: {
        '@type': 'Organization',
        name: 'MPB Health',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/assets/MPB-Health-No-background.png`
        }
      },
      datePublished: data.publishedDate,
      dateModified: data.modifiedDate || data.publishedDate
    };
  }

  return {};
}
