import {
  getPlanEnrollmentConfig,
  getPlanEnrollmentEmbedUrl,
  getPlanEnrollmentPagePath,
  PLAN_ENROLLMENT_CONFIGS,
} from './planEnrollmentConfig';

/** @deprecated Use getPlanEnrollmentEmbedUrl — external portal URLs for iframe embeds only. */
export const PLAN_ENROLL_URLS: Record<string, string> = Object.fromEntries(
  PLAN_ENROLLMENT_CONFIGS.flatMap((c) => [
    [c.id, c.embedUrl],
    ...(c.id === 'care-plus' ? [['careplus', c.embedUrl] as const] : []),
  ]),
);

export const PLAN_ENROLL_OPTIONS = PLAN_ENROLLMENT_CONFIGS.map((c) => ({
  id: c.id,
  label: c.label,
}));

/** On-site enrollment page path (keeps header/footer and trusted MPB branding). */
export function getPlanEnrollUrl(planIdOrSlug: string): string {
  return getPlanEnrollmentPagePath(planIdOrSlug);
}

export function getPlanEnrollLabel(planIdOrSlug: string): string {
  return getPlanEnrollmentConfig(planIdOrSlug)?.label ?? planIdOrSlug;
}

export { getPlanEnrollmentEmbedUrl, getPlanEnrollmentPagePath };
