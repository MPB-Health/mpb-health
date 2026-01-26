export interface MetaTagsConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

export const updateMetaTags = (config: MetaTagsConfig): void => {
  document.title = config.title;

  updateOrCreateMeta('description', config.description);

  if (config.keywords) {
    updateOrCreateMeta('keywords', config.keywords);
  }

  updateOrCreateMeta('og:title', config.ogTitle || config.title, 'property');
  updateOrCreateMeta('og:description', config.ogDescription || config.description, 'property');
  updateOrCreateMeta('og:type', 'website', 'property');

  if (config.ogImage) {
    updateOrCreateMeta('og:image', config.ogImage, 'property');
  }

  if (config.ogUrl) {
    updateOrCreateMeta('og:url', config.ogUrl, 'property');
  }

  updateOrCreateMeta('twitter:card', config.twitterCard || 'summary_large_image');
  updateOrCreateMeta('twitter:title', config.twitterTitle || config.title);
  updateOrCreateMeta('twitter:description', config.twitterDescription || config.description);

  if (config.twitterImage) {
    updateOrCreateMeta('twitter:image', config.twitterImage);
  }

  if (config.canonicalUrl) {
    updateOrCreateLink('canonical', config.canonicalUrl);
  }

  if (config.noindex) {
    updateOrCreateMeta('robots', 'noindex, nofollow');
  } else {
    updateOrCreateMeta('robots', 'index, follow');
  }
};

const updateOrCreateMeta = (
  name: string,
  content: string,
  attribute: 'name' | 'property' = 'name'
): void => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

const updateOrCreateLink = (rel: string, href: string): void => {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

export const generatePageMetaTags = (
  pageName: string,
  customConfig?: Partial<MetaTagsConfig>
): MetaTagsConfig => {
  const baseUrl = 'https://mpb.health';
  const defaultImage = `${baseUrl}/assets/cover-image.jpg`;

  const defaults: Record<string, MetaTagsConfig> = {
    home: {
      title: 'MPB Health | Affordable Health Sharing Programs',
      description: 'Join 50,000+ members saving on healthcare with MPB Health. Get affordable health sharing for individuals, families, and businesses.',
      keywords: 'health sharing, affordable healthcare, medical cost sharing, health insurance alternative',
      ogImage: defaultImage,
      ogUrl: baseUrl,
    },
    plans: {
      title: 'Health Sharing Plans | Compare Options | MPB Health',
      description: 'Explore MPB Health sharing plans starting at $49.95/month. Find the perfect plan for your family with flexible IUA options.',
      keywords: 'health sharing plans, affordable health plans, MPB plans, healthcare options',
      ogImage: defaultImage,
      ogUrl: `${baseUrl}/plans`,
    },
    quote: {
      title: 'Get Your Free Quote | MPB Health',
      description: 'Get a personalized health sharing quote in under 2 minutes. See how much you can save with MPB Health.',
      keywords: 'health sharing quote, free quote, healthcare quote, estimate savings',
      ogImage: defaultImage,
      ogUrl: `${baseUrl}/get-started`,
    },
    'how-it-works': {
      title: 'How Health Sharing Works | MPB Health',
      description: 'Learn how medical cost sharing works and why thousands of families trust MPB Health for affordable healthcare.',
      keywords: 'how health sharing works, medical cost sharing explained, healthcare sharing',
      ogImage: defaultImage,
      ogUrl: `${baseUrl}/how-it-works`,
    },
  };

  const baseConfig = defaults[pageName] || defaults.home;

  return {
    ...baseConfig,
    ...customConfig,
  };
};

export const generateArticleMetaTags = (
  title: string,
  excerpt: string,
  imageUrl?: string,
  slug?: string
): MetaTagsConfig => ({
  title: `${title} | MPB Health Blog`,
  description: excerpt,
  ogTitle: title,
  ogDescription: excerpt,
  ogImage: imageUrl || 'https://mpb.health/assets/cover-image.jpg',
  ogUrl: `https://mpb.health/blog/${slug}`,
  twitterCard: 'summary_large_image',
  canonicalUrl: `https://mpb.health/blog/${slug}`,
});
