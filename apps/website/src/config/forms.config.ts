export type FormCategory = 'employer' | 'member';

export interface FormEntry {
  slug: string;
  label: string;
  category: FormCategory;
  description: string;
  icon: string;
  estimatedMinutes?: number;
  requiresAuth?: boolean;
  cognitoEmbed?: string;
}

export const FORMS: FormEntry[] = [
  {
    slug: '/list-bill-setup/',
    label: 'List-Bill Setup',
    category: 'employer',
    description: 'Set up list-billing for your organization with MPB Health. Submit employer roster and billing details through our secure online list-bill setup form.',
    icon: 'Briefcase',
    estimatedMinutes: 10,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/343" allow="payment" style="border:0;width:100%" height="1540"></iframe>',
  },
  {
    slug: '/list-bill-conversion/',
    label: 'List-Bill Conversion',
    category: 'employer',
    description: 'Convert your organization to list-bill billing format with MPB Health. Complete this secure employer form to transition your group health sharing billing.',
    icon: 'RefreshCw',
    estimatedMinutes: 10,
    requiresAuth: false,
    cognitoEmbed: '',
  },
  {
    slug: '/list-bill-update/',
    label: 'List-Bill Update',
    category: 'employer',
    description: 'Update your organization list-billing information with MPB Health. Change roster details, billing contacts, or group account settings online.',
    icon: 'Edit',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '',
  },
  {
    slug: '/employee-removal/',
    label: 'Employee Removal',
    category: 'employer',
    description: 'Process an employee removal from your MPB Health group plan. Submit this secure employer form to update your organization roster and billing.',
    icon: 'UserMinus',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '',
  },
  {
    slug: '/adult-dependent-information/',
    label: 'Adult Dependent Information',
    category: 'member',
    description: 'Add or update adult dependent information on your MPB Health membership. Complete this secure member form with dependent details and coverage preferences.',
    icon: 'Users',
    estimatedMinutes: 8,
    requiresAuth: false,
    cognitoEmbed: '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="452"></script>',
  },
  {
    slug: '/permission-to-discuss-plan/',
    label: 'Authorization to Share Information',
    category: 'member',
    description: 'Grant permission for MPB Health to discuss your plan details with an authorized family member or representative using this secure authorization form.',
    icon: 'Shield',
    estimatedMinutes: 3,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/405" allow="payment" style="border:0;width:100%" height="1400"></iframe>',
  },
  {
    slug: '/cancel-membership/',
    label: 'Cancel Membership',
    category: 'member',
    description: 'Submit a membership cancellation request to MPB Health. Use this secure online form to request ending your health sharing membership coverage.',
    icon: 'XCircle',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/20" allow="payment" style="border:0;width:100%;" height="1979"></iframe>',
  },
  {
    slug: '/member-feedback/',
    label: 'Member Feedback',
    category: 'member',
    description: 'Share your MPB Health experience and suggestions with our member support team. Your feedback helps us improve health sharing services and support.',
    icon: 'MessageSquare',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/425" allow="payment" style="border:0;width:100%" height="685"></iframe>',
  },
  {
    slug: '/membership-changes/',
    label: 'Member Updates',
    category: 'member',
    description: 'Update your MPB Health membership information online. Change address, dependents, plan details, or account preferences through this secure member form.',
    icon: 'Edit3',
    estimatedMinutes: 7,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/411" allow="payment" style="border:0;width:100%;" height="2484"></iframe>',
  },
  {
    slug: '/refer-a-friend/',
    label: 'Refer a Friend',
    category: 'member',
    description: 'Refer friends and family to MPB Health health sharing. Share affordable medical cost sharing with people you care about through this referral form.',
    icon: 'UserPlus',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/395" allow="payment" style="border:0;width:100%" height="1400"></iframe>',
  },
  {
    slug: '/request-rx-quote/',
    label: 'Request RX Quote',
    category: 'member',
    description: 'Get a prescription medication quote through MPB Health. Submit your Rx details for pricing, pharmacy savings options, and prescription benefit information.',
    icon: 'Pill',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/421" allow="payment" style="border:0;width:100%" height="1400"></iframe>',
  },
  {
    slug: '/request-to-schedule-an-appointment/',
    label: 'Request to Schedule an Appointment',
    category: 'member',
    description: 'Schedule an appointment with the MPB Health member support team. Request a call or meeting for help with your health sharing membership questions.',
    icon: 'Calendar',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/420" allow="payment" style="border:0;width:100%" height="1400"></iframe>',
  },
  {
    slug: '/update-form-of-payment/',
    label: 'Update Payment Information',
    category: 'member',
    description: 'Securely update your MPB Health payment method online. Change credit card or bank details for your health sharing membership billing through our payment portal.',
    icon: 'CreditCard',
    estimatedMinutes: 5,
    requiresAuth: false,
  },
  {
    slug: '/dependent-over-18-information/',
    label: 'Dependent Over 18 Information',
    category: 'member',
    description: 'Provide required information for dependents over 18 on your MPB Health membership. Complete this secure form with dependent details and eligibility information.',
    icon: 'UserPlus',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/MPoweringBenefits1/DependentSpouseOver18Information" allow="payment" style="border:0;width:100%;" height="483"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
  },
];

/**
 * Get form by slug (synchronous - uses static config)
 * For new code, prefer getFormBySlugAsync() which fetches from database
 */
export const getFormBySlug = (slug: string): FormEntry | undefined => {
  return FORMS.find(form => form.slug === slug || form.slug === `${slug}/`);
};

/**
 * Get form by slug (async - fetches from database with static fallback)
 * This is the preferred method for form pages
 */
export const getFormBySlugAsync = async (slug: string): Promise<FormEntry | undefined> => {
  try {
    // Dynamic import to avoid circular dependencies
    const { formsService, recordToFormEntry } = await import('../lib/formsService');
    const record = await formsService.getFormBySlug(slug);
    if (record) {
      return recordToFormEntry(record);
    }
  } catch (error) {
    console.warn('Failed to fetch form from database, using static fallback:', error);
  }
  // Fallback to static config
  return getFormBySlug(slug);
};

/**
 * Get all forms (async - fetches from database with static fallback)
 */
export const getAllFormsAsync = async (): Promise<FormEntry[]> => {
  try {
    const { formsService, recordToFormEntry } = await import('../lib/formsService');
    const records = await formsService.getActiveForms();
    if (records && records.length > 0) {
      return records.map(recordToFormEntry);
    }
  } catch (error) {
    console.warn('Failed to fetch forms from database, using static fallback:', error);
  }
  return FORMS;
};

export const getEmployerForms = (): FormEntry[] => {
  return FORMS.filter(form => form.category === 'employer');
};

export const getMemberForms = (): FormEntry[] => {
  return FORMS.filter(form => form.category === 'member');
};

/**
 * Get employer forms (async - fetches from database)
 */
export const getEmployerFormsAsync = async (): Promise<FormEntry[]> => {
  try {
    const { formsService, recordToFormEntry } = await import('../lib/formsService');
    const records = await formsService.getFormsByCategory('employer');
    if (records && records.length > 0) {
      return records.filter(r => r.is_active).map(recordToFormEntry);
    }
  } catch (error) {
    console.warn('Failed to fetch employer forms from database:', error);
  }
  return getEmployerForms();
};

/**
 * Get member forms (async - fetches from database)
 */
export const getMemberFormsAsync = async (): Promise<FormEntry[]> => {
  try {
    const { formsService, recordToFormEntry } = await import('../lib/formsService');
    const records = await formsService.getFormsByCategory('member');
    if (records && records.length > 0) {
      return records.filter(r => r.is_active).map(recordToFormEntry);
    }
  } catch (error) {
    console.warn('Failed to fetch member forms from database:', error);
  }
  return getMemberForms();
};

export const MEMBER_FORM_CATEGORIES = [
  {
    title: 'Account Management',
    description: 'Manage your membership and account settings',
    formSlugs: ['/cancel-membership/', '/membership-changes/', '/update-form-of-payment/'],
  },
  {
    title: 'Healthcare & Support',
    description: 'Access healthcare services and support',
    formSlugs: [
      '/request-rx-quote/',
      '/request-to-schedule-an-appointment/',
      '/schedule-a-call/',
    ],
  },
  {
    title: 'Family & Dependents',
    description: 'Manage family member information',
    formSlugs: ['/adult-dependent-information/', '/permission-to-discuss-plan/', '/dependent-over-18-information/'],
  },
  {
    title: 'Feedback & Referrals',
    description: 'Share your experience and refer others',
    formSlugs: ['/member-feedback/', '/review-us/', '/refer-a-friend/'],
  },
  {
    title: 'Onboarding',
    description: 'Complete your welcome process',
    formSlugs: ['/welcome-call-survey/'],
  },
];
