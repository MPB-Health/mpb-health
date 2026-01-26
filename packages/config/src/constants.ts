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
  crm: 'crm.mpb.health',
  advisors: 'advisors.mpb.health',
  admin: 'admin.mpb.health',
  training: 'training.mpb.health',
} as const;

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
