// @vitest-environment jsdom
// This module reads window.location / document.referrer / sessionStorage, so it
// needs a DOM. Scoped here rather than flipping the suite-wide node default.
import { beforeEach, describe, expect, it } from 'vitest';
import { captureLeadAttribution, getLeadAttribution } from './leadAttribution';

const STORAGE_KEY = 'mpb_lead_attribution';

/** Point window.location at a URL without navigating (jsdom). */
function visit(url: string, referrer = ''): void {
  const parsed = new URL(url);
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search: parsed.search, hostname: parsed.hostname, href: url },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(document, 'referrer', {
    value: referrer,
    writable: true,
    configurable: true,
  });
}

describe('leadAttribution', () => {
  beforeEach(() => {
    sessionStorage.clear();
    visit('https://mpb.health/');
  });

  it('captures all five utm params from the landing URL', () => {
    visit(
      'https://mpb.health/?utm_source=google&utm_medium=cpc&utm_campaign=aug&utm_term=health+share&utm_content=v2',
    );
    expect(captureLeadAttribution()).toMatchObject({
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'aug',
      utmTerm: 'health share',
      utmContent: 'v2',
    });
  });

  it('persists attribution after navigating to a URL with no params', () => {
    visit('https://mpb.health/?utm_source=google&utm_campaign=aug');
    captureLeadAttribution();

    // The visitor browses to the quote page; the query string is gone. This is
    // the exact case that left every historical lead with NULL attribution.
    visit('https://mpb.health/get-a-quote');
    expect(getLeadAttribution()).toMatchObject({ utmSource: 'google', utmCampaign: 'aug' });
  });

  it('keeps first touch but replaces on a genuinely new campaign', () => {
    visit('https://mpb.health/?utm_source=google&utm_campaign=aug');
    captureLeadAttribution();

    visit('https://mpb.health/plans');
    captureLeadAttribution();
    expect(getLeadAttribution().utmSource).toBe('google');

    visit('https://mpb.health/?utm_source=facebook&utm_campaign=sep');
    expect(captureLeadAttribution()).toMatchObject({ utmSource: 'facebook', utmCampaign: 'sep' });
  });

  it('records an external referrer but ignores internal navigation', () => {
    visit('https://mpb.health/', 'https://www.google.com/search?q=health+share');
    expect(captureLeadAttribution().referrer).toBe('https://www.google.com/search?q=health+share');

    sessionStorage.clear();
    visit('https://mpb.health/get-a-quote', 'https://mpb.health/plans');
    expect(captureLeadAttribution().referrer).toBeUndefined();
  });

  it('ignores blank params and caps absurdly long values', () => {
    visit(`https://mpb.health/?utm_source=&utm_campaign=${'x'.repeat(400)}`);
    const attribution = captureLeadAttribution();
    expect(attribution.utmSource).toBeUndefined();
    expect(attribution.utmCampaign).toHaveLength(255);
  });

  it('degrades to empty rather than throwing when storage is unavailable', () => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    visit('https://mpb.health/?utm_source=google');
    expect(() => captureLeadAttribution()).not.toThrow();
    Storage.prototype.setItem = setItem;
  });
});
