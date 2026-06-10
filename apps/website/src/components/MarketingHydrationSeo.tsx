import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MarketingHydrationSeoProps {
  children?: React.ReactNode;
  robots?: string;
}

/**
 * Hydration-only head tags for marketing routes in page-seo-data.json.
 *
 * Title, description, canonical, keywords, robots, and core OG/Twitter tags
 * are already in the static HTML from prerender-seo.mjs. Repeating them in
 * Helmet creates duplicate tags after hydration.
 */
export function MarketingHydrationSeo({
  children,
  robots = 'index, follow',
}: MarketingHydrationSeoProps) {
  return (
    <Helmet>
      <meta name="googlebot" content={robots} />
      <meta name="bingbot" content={robots} />
      <meta property="og:site_name" content="MPB Health" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {children}
    </Helmet>
  );
}
