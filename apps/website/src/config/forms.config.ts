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
    description: 'Set up list-billing for your organization',
    icon: 'Briefcase',
    estimatedMinutes: 10,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/343" allow="payment" style="border:0;width:100%" height="1540"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
  },
  {
    slug: '/list-bill-conversion/',
    label: 'List-Bill Conversion',
    category: 'employer',
    description: 'Convert your billing to list-bill format',
    icon: 'RefreshCw',
    estimatedMinutes: 10,
    requiresAuth: false,
    cognitoEmbed: '',
  },
  {
    slug: '/list-bill-update/',
    label: 'List-Bill Update',
    category: 'employer',
    description: 'Update your list-billing information',
    icon: 'Edit',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '',
  },
  {
    slug: '/employee-removal/',
    label: 'Employee Removal',
    category: 'employer',
    description: 'Process employee removal from plan',
    icon: 'UserMinus',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '',
  },
  {
    slug: '/adult-dependent-information/',
    label: 'Adult Dependent Information',
    category: 'member',
    description: 'Add or update adult dependent information',
    icon: 'Users',
    estimatedMinutes: 8,
    requiresAuth: false,
    cognitoEmbed: '',
  },
  {
    slug: '/permission-to-discuss-plan/',
    label: 'Authorization to Share Information',
    category: 'member',
    description: 'Grant permission to discuss your plan details',
    icon: 'Shield',
    estimatedMinutes: 3,
    requiresAuth: false,
    cognitoEmbed: '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="405"></script>',
  },
  {
    slug: '/cancel-membership/',
    label: 'Cancel Membership',
    category: 'member',
    description: 'Submit a membership cancellation request',
    icon: 'XCircle',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/20" allow="payment" style="border:0;width:100%;" height="1979"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
  },
  {
    slug: '/member-feedback/',
    label: 'Member Feedback',
    category: 'member',
    description: 'Share your experience and suggestions',
    icon: 'MessageSquare',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/425" allow="payment" style="border:0;width:100%" height="685"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
  },
  {
    slug: '/membership-changes/',
    label: 'Member Updates',
    category: 'member',
    description: 'Update your membership information',
    icon: 'Edit3',
    estimatedMinutes: 7,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/411" allow="payment" style="border:0;width:100%;" height="2484"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
  },
  {
    slug: '/refer-a-friend/',
    label: 'Refer a Friend',
    category: 'member',
    description: 'Refer someone to MPB Health',
    icon: 'UserPlus',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="395"></script>',
  },
  {
    slug: '/healthcare-advisor-review-change/',
    label: 'Review or Change Health Advisor',
    category: 'member',
    description: 'Update your health advisor preferences',
    icon: 'UserCheck',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '',
  },
  {
    slug: '/request-rx-quote/',
    label: 'Request RX Quote',
    category: 'member',
    description: 'Get a quote for prescription medications',
    icon: 'Pill',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="421"></script>',
  },
  {
    slug: '/request-to-schedule-an-appointment/',
    label: 'Request to Schedule an Appointment',
    category: 'member',
    description: 'Schedule an appointment with our team',
    icon: 'Calendar',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="420"></script>',
  },
  {
    slug: '/update-form-of-payment/',
    label: 'Update Form of Payment',
    category: 'member',
    description: 'Update your payment method',
    icon: 'CreditCard',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<script src="https://www.cognitoforms.com/f/seamless.js" data-key="K4Fk3PtQHE-6M-fMiX2fVA" data-form="347"></script>',
  },
  {
    slug: '/dependent-over-18-information/',
    label: 'Dependent Over 18 Information',
    category: 'member',
    description: 'Provide information for dependents over 18 years old',
    icon: 'UserPlus',
    estimatedMinutes: 5,
    requiresAuth: false,
    cognitoEmbed: '<iframe src="https://www.cognitoforms.com/MPoweringBenefits1/DependentOver18Information" style="border:0;width:100%" height="800"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
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
      '/healthcare-advisor-review-change/',
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
