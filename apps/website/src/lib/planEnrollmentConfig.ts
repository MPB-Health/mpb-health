export interface PlanEnrollmentConfig {
  id: string;
  slug: string;
  label: string;
  title: string;
  description: string;
  embedUrl: string;
  estimatedMinutes: number;
  audience: string;
}

export const PLAN_ENROLLMENT_CONFIGS: PlanEnrollmentConfig[] = [
  {
    id: 'essentials',
    slug: 'essentials',
    label: 'Essentials',
    title: 'Enroll in Essentials',
    description: 'Hospital debt relief and virtual care — start your Essentials membership online.',
    embedUrl: 'https://essentials.enrollmpb.com/',
    estimatedMinutes: 10,
    audience: 'Individuals & families',
  },
  {
    id: 'care-plus',
    slug: 'care-plus',
    label: 'Care+',
    title: 'Enroll in Care+',
    description: 'Medical cost sharing for unexpected expenses — complete your Care+ enrollment securely.',
    embedUrl: 'https://careplus.enrollmpb.com/',
    estimatedMinutes: 12,
    audience: 'Individuals & families',
  },
  {
    id: 'direct',
    slug: 'direct',
    label: 'Direct',
    title: 'Enroll in Direct',
    description: 'Preventive sharing and comprehensive medical cost protection — enroll in Direct today.',
    embedUrl: 'https://direct.enrollmpb.com/',
    estimatedMinutes: 12,
    audience: 'Individuals & families',
  },
  {
    id: 'mec-essentials',
    slug: 'mec-essentials',
    label: 'HSA Essentials',
    title: 'Enroll in HSA Essentials',
    description: 'ACA MEC coverage with debt dismissal and HSA options — enroll your business or 1099 team.',
    embedUrl: 'https://mec.enrollmpb.com/',
    estimatedMinutes: 15,
    audience: 'Businesses & 1099 professionals',
  },
  {
    id: 'secure-hsa',
    slug: 'secure-hsa',
    label: 'Secure HSA',
    title: 'Enroll in Secure HSA',
    description: 'HSA-compatible membership with tax advantages and medical cost sharing — enroll online.',
    embedUrl: 'https://securehsa.enrollmpb.com/',
    estimatedMinutes: 15,
    audience: 'Self-employed & business owners',
  },
];

const configById = new Map(PLAN_ENROLLMENT_CONFIGS.map((c) => [c.id, c]));
const configBySlug = new Map(PLAN_ENROLLMENT_CONFIGS.map((c) => [c.slug, c]));

/** Alias slugs used in pricing data */
configById.set('careplus', configById.get('care-plus')!);

export function getPlanEnrollmentConfig(planIdOrSlug: string): PlanEnrollmentConfig | undefined {
  return configById.get(planIdOrSlug) ?? configBySlug.get(planIdOrSlug);
}

export function getPlanEnrollmentPagePath(planIdOrSlug: string): string {
  const config = getPlanEnrollmentConfig(planIdOrSlug);
  return config ? `/enroll/${config.slug}` : '/plans';
}

export function getPlanEnrollmentEmbedUrl(planIdOrSlug: string): string | undefined {
  return getPlanEnrollmentConfig(planIdOrSlug)?.embedUrl;
}

/** HTTPS-only enrollment partner hosts we allow in iframes and postMessage handlers. */
export function isAllowedEnrollmentEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.enrollmpb.com');
  } catch {
    return false;
  }
}

export function isAllowedEnrollmentMessageOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.enrollmpb.com');
  } catch {
    return false;
  }
}
