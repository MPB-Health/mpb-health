/** Canonical enrollment portal URLs — single source of truth for plan CTAs. */
export const PLAN_ENROLL_URLS: Record<string, string> = {
  essentials: 'https://essentials.enrollmpb.com/',
  'care-plus': 'https://careplus.enrollmpb.com/',
  careplus: 'https://careplus.enrollmpb.com/',
  direct: 'https://direct.enrollmpb.com/',
  'mec-essentials': 'https://mec.enrollmpb.com/',
  'secure-hsa': 'https://securehsa.enrollmpb.com/',
};

export const PLAN_ENROLL_OPTIONS = [
  { id: 'essentials', label: 'Essentials' },
  { id: 'care-plus', label: 'Care+' },
  { id: 'direct', label: 'Direct' },
  { id: 'mec-essentials', label: 'MEC+ Essentials' },
  { id: 'secure-hsa', label: 'Secure HSA' },
] as const;

export function getPlanEnrollUrl(planIdOrSlug: string): string {
  return PLAN_ENROLL_URLS[planIdOrSlug] ?? '/get-started';
}

export function getPlanEnrollLabel(planIdOrSlug: string): string {
  return PLAN_ENROLL_OPTIONS.find((p) => p.id === planIdOrSlug)?.label ?? planIdOrSlug;
}
