export const COMPANY = {
  name: 'MPB Health',
  legalName: 'MPB Health, Inc.',
  supportEmail: 'support@mpb.health',
  salesEmail: 'sales@mpb.health',
  phone: '1-800-MPB-HLTH',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
  },
} as const;

export const DOMAINS = {
  website: 'www.mpb.health',
  app: 'app.mpb.health',
  crm: 'crm.mpb.health',
  advisors: 'advisor.mpb.health',
  admin: 'admin.mpb.health',
  training: 'training.mpb.health',
} as const;

export const DEV_PORTS = {
  website: 5173,
  app: 5173,
  admin: 5176,
  crm: 5174,
  advisors: 5175,
  training: 5177,
} as const;

export type PortalKey = 'admin' | 'crm' | 'advisors';

export interface PortalInfo {
  key: PortalKey;
  name: string;
  description: string;
}

export const PORTALS: Record<PortalKey, PortalInfo> = {
  admin: {
    key: 'admin',
    name: 'Admin Portal',
    description: 'Manage users, enrollments, and content',
  },
  crm: {
    key: 'crm',
    name: 'CRM',
    description: 'Manage leads and sales pipeline',
  },
  advisors: {
    key: 'advisors',
    name: 'Advisor Portal',
    description: 'Training, meetings, and resources',
  },
} as const;

/**
 * Get the URL for a portal based on the current environment
 * In development, uses localhost with the appropriate port
 * In production, uses the configured domain
 */
export function getPortalUrl(portal: keyof typeof DOMAINS): string {
  const isDev = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  if (isDev) {
    const port = DEV_PORTS[portal as keyof typeof DEV_PORTS];
    if (port) {
      return `${window.location.protocol}//${window.location.hostname}:${port}`;
    }
  }
  
  return `https://${DOMAINS[portal]}`;
}

/**
 * Canonical auth redirect URLs — single source of truth for all password recovery flows.
 *
 * Rules:
 * - NEVER construct redirectTo with window.location.origin in auth forms; use these constants.
 * - All values must be listed in AUTH_SAFE_REDIRECT_DESTINATIONS to pass the allowlist guard.
 * - Production URLs only. Dev/localhost flows use window.location.origin as a fallback
 *   (must be allowlisted separately in the Supabase dashboard for local development).
 */
export const AUTH_URLS = {
  advisor: {
    origin: 'https://advisor.mpb.health',
    resetPassword: 'https://advisor.mpb.health/reset-password',
    login: 'https://advisor.mpb.health/login',
  },
  admin: {
    origin: 'https://admin.mpb.health',
    resetPassword: 'https://admin.mpb.health/reset-password',
    login: 'https://admin.mpb.health/login',
  },
  crm: {
    origin: 'https://crm.mpb.health',
    resetPassword: 'https://crm.mpb.health/reset-password',
    login: 'https://crm.mpb.health/login',
  },
  member: {
    origin: 'https://mpb.health',
    resetPassword: 'https://mpb.health/reset-password',
    login: 'https://mpb.health/login',
    authConfirm: 'https://mpb.health/auth/confirm',
  },
} as const;

/**
 * Open-redirect allowlist.
 * AuthConfirm and any code that acts on a redirectTo/next parameter must verify
 * the destination is in this set before issuing a window.location.replace() or router redirect.
 */
export const AUTH_SAFE_REDIRECT_DESTINATIONS: ReadonlySet<string> = new Set([
  AUTH_URLS.advisor.resetPassword,
  AUTH_URLS.advisor.login,
  AUTH_URLS.admin.resetPassword,
  AUTH_URLS.admin.login,
  AUTH_URLS.crm.resetPassword,
  AUTH_URLS.crm.login,
  AUTH_URLS.member.resetPassword,
  AUTH_URLS.member.login,
  AUTH_URLS.member.authConfirm,
]);

export const FEATURES = {
  // CRM Features
  CRM_AI_INSIGHTS: 'crm_ai_insights',
  CRM_AUTOMATION: 'crm_automation',
  CRM_ZOHO_SYNC: 'crm_zoho_sync',

  // Advisor Features
  ADVISOR_VIDEO_MEETINGS: 'advisor_video_meetings',
  ADVISOR_TRAINING_LMS: 'advisor_training_lms',

  // Member Features
  MEMBER_PORTAL: 'member_portal',
  MEMBER_CLAIMS: 'member_claims',

  // Admin Features
  ADMIN_ANALYTICS: 'admin_analytics',
  ADMIN_ENROLLMENT: 'admin_enrollment',
} as const;
