/**
 * Static 301 redirects for legacy WordPress URLs and path aliases.
 * Used by root middleware.js and merged into vercel.json at deploy.
 *
 * @type {Array<{ from: string, to: string, status?: number }>}
 */
export const LEGACY_REDIRECTS = [
  // Wrong /benefits/* paths (features live under /features/*)
  { from: '/benefits/preventive-care', to: '/features/preventive-care' },
  { from: '/benefits/telehealth', to: '/features/primary-care' },
  { from: '/benefits/maternity', to: '/features/maternity-care' },

  // Dental benefit hidden until further notice (July 2026) — temporary redirect,
  // remove when the page is re-enabled in page-seo-extra.mjs / voluntaryBenefitsData.ts
  { from: '/benefits/dental', to: '/features', status: 302 },

  // Dead form slug → active member updates form
  { from: '/forms/member-change-request', to: '/membership-changes' },

  // Legacy WordPress pages
  { from: '/healthshare-faq', to: '/faq' },
  { from: '/all-about-heatlh-share-programs', to: '/how-it-works' },
  { from: '/medical-cost-sharing', to: '/how-it-works' },
  { from: '/affordable-health-insurance-alternatives', to: '/individuals-and-families' },
  { from: '/mental-health-coverage-health-plans', to: '/features/mental-health' },
  {
    from: '/the-best-alternative-to-health-insurance-medical-cost-sharing',
    to: '/how-it-works',
  },
  {
    from: '/health-sharing-community-groups-how-they-create-affordable-healthcare-alternatives',
    to: '/how-it-works',
  },
  {
    from: '/exploring-affordable-and-flexible-health-insurance-alternatives-for-small-businesses',
    to: '/businesses-and-organizations',
  },
  {
    from: '/the-importance-and-benefits-of-group-health-medical-plans',
    to: '/businesses-and-organizations',
  },
  { from: '/why-choose-telehealth', to: '/features/primary-care' },

  // WordPress "case" custom post type
  { from: '/case/direct-member-handbook', to: '/3d-flip-book/direct-handbook' },
  { from: '/case/guideline-changes-effective-01-01-25', to: '/resources' },
  { from: '/case/how-to-go-shopping', to: '/resources' },

  // Misc legacy paths
  { from: '/concierge-playbook', to: '/features/membership-concierge' },
  { from: '/member-guidelines', to: '/3d-flip-book/zion-guidelines' },
  { from: '/phones', to: '/contact' },
  { from: '/support-ticket', to: '/support' },
  { from: '/account', to: 'https://app.mpb.health/login' },
  { from: '/product/essentials', to: '/plans' },
  { from: '/3d-flip-book/ebooktravis', to: '/3d-flip-book/direct-handbook' },
  { from: '/events/women-s-networking-event-with-sa-de-max', to: '/events' },

  // Old blog slugs → current CMS slugs
  {
    from: '/blog/Earth-Day-From-Environmental-Awareness-to-Personal-Wellbeing',
    to: '/blog/Earth-Day',
  },
  {
    from: '/blog/medical-cost-sharing-an-affordable-and-transparent-alternative-to-health-insurance',
    to: '/blog/what-is-health-sharing',
  },

  // Dated WordPress posts with no CMS article — send to blog index
  { from: '/blog/ribbon-cutting', to: '/blog' },
  {
    from: '/blog/functional-integrative-medicine-in-2025-redefining-how-americans-approach-health',
    to: '/blog',
  },
  {
    from: '/blog/the-silent-storm-why-older-men-struggle-with-mental-health-and-how-to-help',
    to: '/blog',
  },
];

/** WordPress dated permalinks: /2025/04/24/slug/ → /blog/slug */
export const WP_DATE_PATH = /^\/(20\d{2})\/(\d{2})\/(\d{2})\/(.+?)\/?$/;
