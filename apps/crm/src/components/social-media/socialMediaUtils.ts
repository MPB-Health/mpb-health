import type { WebForm } from '@mpbhealth/crm-core';
import type { FormSettingsWithSocial, SocialPlatform } from './socialMediaTypes';

/**
 * Origin used for /forms/{slug} share links. Set VITE_PUBLIC_WEB_FORM_BASE_URL when the CRM
 * app is accessed from a different host than the public form route (e.g. admin on a subdomain).
 */
export function getPublicWebFormOrigin(): string {
  const fromEnv = typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_WEB_FORM_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'form'
  );
}

export function buildUtmQuery(params: {
  platform: SocialPlatform;
  campaignSlug: string;
  content?: string;
}): string {
  const q = new URLSearchParams({
    utm_source: params.platform === 'twitter' ? 'twitter' : params.platform,
    utm_medium: 'social',
    utm_campaign: params.campaignSlug,
  });
  if (params.content) q.set('utm_content', params.content);
  return q.toString();
}

export function buildSocialQuoteFormUrl(origin: string, slug: string, query: string): string {
  const base = `${origin.replace(/\/$/, '')}/forms/${encodeURIComponent(slug)}`;
  return query ? `${base}?${query}` : base;
}

export function parseSocialQuoteFromForm(form: WebForm): {
  platform: SocialPlatform;
  utmCampaignSlug: string;
  headline: string;
  ctaLabel: string;
} | null {
  const s = form.settings as FormSettingsWithSocial | undefined;
  const sq = s?.socialQuote;
  if (!sq?.platform) return null;
  return {
    platform: sq.platform,
    utmCampaignSlug: sq.utmCampaignSlug || slugify(form.name),
    headline: sq.headline || form.styling?.headerText || '',
    ctaLabel: sq.ctaLabel || form.styling?.buttonText || 'Get a quote',
  };
}

export function isSocialQuoteWebForm(form: WebForm): boolean {
  return Boolean(parseSocialQuoteFromForm(form));
}
