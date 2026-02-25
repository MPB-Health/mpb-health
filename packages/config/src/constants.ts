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
