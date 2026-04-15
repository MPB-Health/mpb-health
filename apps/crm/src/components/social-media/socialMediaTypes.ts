import type { FormSettings, FormStyling } from '@mpbhealth/crm-core';

/** Platforms for social quote links and ad previews */
export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';

export const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string; utmSource: string }[] = [
  { id: 'facebook', label: 'Facebook', utmSource: 'facebook' },
  { id: 'instagram', label: 'Instagram', utmSource: 'instagram' },
  { id: 'linkedin', label: 'LinkedIn', utmSource: 'linkedin' },
  { id: 'twitter', label: 'X (Twitter)', utmSource: 'twitter' },
  { id: 'tiktok', label: 'TikTok', utmSource: 'tiktok' },
];

/** Stored inside `crm_web_forms.settings` JSON (jsonb allows extra keys) */
export interface SocialQuoteExtension {
  socialQuote?: {
    platform: SocialPlatform;
    utmCampaignSlug: string;
    headline: string;
    ctaLabel: string;
  };
}

export type FormSettingsWithSocial = FormSettings & SocialQuoteExtension;

export type FormStylingWithSocial = FormStyling & {
  /** Primary CTA / brand */
  accentHex?: string;
};

export type AdObjective = 'awareness' | 'traffic' | 'leads' | 'conversions';

export type AdCtaType = 'learn_more' | 'get_quote' | 'sign_up' | 'contact_us' | 'apply_now';

export const AD_CTA_LABELS: Record<AdCtaType, string> = {
  learn_more: 'Learn more',
  get_quote: 'Get quote',
  sign_up: 'Sign up',
  contact_us: 'Contact us',
  apply_now: 'Apply now',
};

/** Character limits for ad copy (approximate platform guidance) */
export const AD_COPY_LIMITS = {
  headline: {
    facebook: 40,
    instagram: 0,
    linkedin: 70,
    twitter: 70,
    tiktok: 34,
  },
  primary: {
    facebook: 125,
    instagram: 2200,
    linkedin: 150,
    twitter: 280,
    tiktok: 100,
  },
} as const;

export interface SocialAdDraftState {
  adName: string;
  objective: AdObjective;
  linkedCampaignId: string;
  platforms: SocialPlatform[];
  headline: string;
  primaryText: string;
  description: string;
  cta: AdCtaType;
  imageNote: string;
  ageMin: number;
  ageMax: number;
  gender: 'all' | 'women' | 'men';
  states: string[];
  interests: string[];
  audienceName: string;
  budgetType: 'daily' | 'lifetime';
  budgetAmount: string;
  startDate: string;
  endDate: string;
  bidStrategy: 'lowest_cost' | 'cost_cap';
  createStatus: 'draft' | 'active';
}

export const US_STATES_FOCUS = [
  'FL',
  'TX',
  'CA',
  'AZ',
  'NC',
  'GA',
  'TN',
  'OH',
  'PA',
  'NY',
  'IL',
  'WA',
  'CO',
  'NV',
  'SC',
] as const;

export const HEALTH_INTEREST_TAGS = [
  'Health insurance',
  'Medicare',
  'Family coverage',
  'Self-employed',
  'Small business benefits',
  'ACA marketplace',
  'Dental & vision',
  'Prescription savings',
] as const;
