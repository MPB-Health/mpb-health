import type { UTMData } from './types';

/**
 * Extract UTM parameters from the current page URL.
 */
export function getUTMParams(): UTMData {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: UTMData = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

/**
 * Validate an email address.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
