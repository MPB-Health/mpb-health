/**
 * Additional per-route SEO entries merged into page-seo-data.json at build time.
 * Keeps hand-curated marketing pages in JSON while forms, features, benefits,
 * and handbooks live here as structured data.
 */

const SITE = 'https://mpb.health';

/** Root paths with dedicated static prerender (not /forms/:slug). */
export const STATIC_FORM_ROUTE_PATHS = new Set();

/** @param {string} route @param {object} meta */
function entry(route, meta) {
  const canonical = meta.canonicalUrl || `${SITE}${route}`;
  return [
    route,
    {
      robots: 'index, follow',
      ogImage: `${SITE}/assets/MPB-Health-No-background.png?v=2`,
      canonicalUrl: canonical,
      ogTitle: meta.ogTitle || meta.title,
      ogDescription: meta.ogDescription || meta.description,
      ...meta,
    },
  ];
}

/** @param {string} slug @param {string} label @param {string} description */
function form(slug, label, description) {
  const path = slug.replace(/\/$/, '');
  STATIC_FORM_ROUTE_PATHS.add(path);
  const title = `${label} | MPB Health Member Form`;
  const base = description.replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
  const desc =
    base.length >= 140
      ? base
      : `${base}. Complete this secure MPB Health member form online. Quick, easy submission with confirmation — no phone call required.`;
  return entry(path, {
    title,
    h1: label,
    description: desc.length > 160 ? `${desc.slice(0, 157).trimEnd()}…` : desc,
  });
}

/** @param {string} id @param {string} name @param {string} tagline @param {string} shortDescription */
function feature(id, name, tagline, shortDescription) {
  const path = `/features/${id}`;
  const title = `${name} | MPB Health Features`;
  const desc = `${tagline}. ${shortDescription} Learn how this MPB Health sharing benefit works, eligible plans, and member access.`;
  const trimmed = desc.length > 160 ? `${desc.slice(0, 157).trimEnd()}…` : desc;
  return entry(path, {
    title,
    h1: name,
    description: trimmed,
    keywords: `MPB Health, ${name}, health sharing, medical cost sharing`,
  });
}

/** @param {string} id @param {string} name @param {string} tagline @param {string} description */
function benefit(id, name, tagline, description) {
  const path = `/benefits/${id}`;
  const title = `${name} Insurance | Voluntary Benefits | MPB Health`;
  const desc = `${tagline}. ${description} Explore voluntary ${name.toLowerCase()} coverage options available to MPB Health members and families.`;
  const trimmed = desc.length > 160 ? `${desc.slice(0, 157).trimEnd()}…` : desc;
  return entry(path, {
    title,
    h1: `${name} Insurance`,
    description: trimmed,
  });
}

/** @param {string} slug @param {string} name @param {string} description */
function handbook(slug, name, description) {
  const path = `/3d-flip-book/${slug}`;
  const title = `${name} | MPB Health Member Handbook`;
  const base = description.replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
  const desc =
    base.length >= 140
      ? base
      : `${base} Download or view the ${name} with plan benefits, guidelines, provider resources, and member forms from MPB Health.`;
  const trimmed = desc.length > 160 ? `${desc.slice(0, 157).trimEnd()}…` : desc;
  return entry(path, {
    title,
    h1: name,
    description: trimmed,
  });
}

const entries = [
  // ── Member & employer forms ──────────────────────────────────────────
  form('/list-bill-setup', 'List-Bill Setup', 'Set up list-billing for your organization with MPB Health employer forms.'),
  form('/list-bill-conversion', 'List-Bill Conversion', 'Convert your organization to list-bill billing format with step-by-step MPB Health employer support.'),
  form('/list-bill-update', 'List-Bill Update', 'Update your organization list-billing details and roster information through our secure employer portal form.'),
  form('/employee-removal', 'Employee Removal', 'Process an employee removal from your group health sharing plan with MPB Health employer forms.'),
  form('/adult-dependent-information', 'Adult Dependent Information', 'Add or update adult dependent information on your MPB Health membership using our secure member form.'),
  form('/permission-to-discuss-plan', 'Authorization to Share Information', 'Grant permission for MPB Health to discuss your plan details with an authorized family member or representative.'),
  form('/cancel-membership', 'Cancel Membership', 'Submit a membership cancellation request to MPB Health. Secure online form with confirmation for members ending coverage.'),
  form('/member-feedback', 'Member Feedback', 'Share your MPB Health experience and suggestions. Your feedback helps us improve member support and health sharing services.'),
  form('/membership-changes', 'Member Updates', 'Update your MPB Health membership information — address, dependents, plan changes, and account details in one secure form.'),
  form('/refer-a-friend', 'Refer a Friend', 'Refer friends and family to MPB Health health sharing. Share affordable medical cost sharing with people you care about.'),
  form('/request-rx-quote', 'Request RX Quote', 'Get a prescription medication quote through MPB Health. Submit your Rx details for pricing and pharmacy savings options.'),
  form('/request-to-schedule-an-appointment', 'Request to Schedule an Appointment', 'Schedule an appointment with the MPB Health member support team. Choose a time that works for your healthcare questions.'),
  form('/update-form-of-payment', 'Update Payment Information', 'Securely update your MPB Health payment method online. Change credit card or bank details for your health sharing membership billing.'),
  form('/dependent-over-18-information', 'Dependent Over 18 Information', 'Provide required information for dependents over 18 on your MPB Health membership using our secure online form.'),
  form('/schedule-a-call', 'Schedule a Welcome Call', 'Schedule a welcome call with MPB Health. Get personalized onboarding help for your new health sharing membership.'),
  form('/welcome-call-survey', 'Welcome Call Survey', 'Complete your MPB Health welcome call survey. Share feedback on your onboarding experience and membership setup.'),
  form('/review-us', 'Review MPB Health', 'Leave a review of your MPB Health experience. Share how health sharing has helped your family save on healthcare costs.'),
  form(
    '/healthcare-advisor-review-change',
    'Review or Change Healthcare Advisor',
    'Review or update your assigned MPB Health healthcare advisor. Submit preferences to change your advisor or confirm your current assignment.',
  ),

  // ── Features ─────────────────────────────────────────────────────────
  feature(
    'health-sharing',
    'Health Sharing for Large Medical Expenses',
    'Community support when you need it most',
    'Protection from major medical needs including hospitalizations, surgeries, and serious illnesses.',
  ),
  feature(
    'primary-care',
    'Primary Care & Virtual Health',
    'Everyday care without the waiting room',
    'Access virtual primary care and telehealth for routine health concerns, prescriptions, and follow-up visits.',
  ),
  feature(
    'urgent-care',
    'Virtual Urgent Care',
    '24/7 care for non-emergency needs',
    '$0, unlimited 24/7/365 virtual urgent care visits for non-emergency health concerns.',
  ),
  feature(
    'mental-health',
    'Virtual Behavioral Health',
    'Support for emotional wellness',
    'Virtual-only access to licensed counselors and therapists for behavioral health support and emotional wellness.',
  ),
  feature(
    'maternity-care',
    'Maternity & Newborn Care',
    'Support through pregnancy and beyond',
    'Comprehensive sharing for pregnancy, delivery, and newborn care for growing families.',
  ),
  feature(
    'rx-benefits',
    'Prescription (Rx) Benefits',
    'Save on medications nationwide',
    'Significant discounts on prescription medications at thousands of pharmacies nationwide through MPB Health.',
  ),
  feature(
    'hsa-compatibility',
    'HSA Compatible Plans',
    'Tax-advantaged healthcare savings',
    'HSA-qualified health sharing plans that let you save pre-tax dollars for current and future healthcare expenses.',
  ),
  feature(
    'preventive-care',
    'Preventive Care',
    'No-cost wellness services',
    'No-cost preventative care services including screenings, immunizations, and wellness visits as part of your membership.',
  ),
  feature(
    'membership-concierge',
    'Membership Concierge',
    'Personal guidance when you need it',
    '24/7 access to knowledgeable support staff who help you navigate healthcare and maximize your MPB Health benefits.',
  ),
  feature(
    'pet-telehealth',
    'Pet Telehealth',
    'Virtual vet care for your pets',
    '$0, unlimited 24/7/365 access to virtual pet telehealth for dogs, cats, and household pets.',
  ),
  feature(
    'medical-weight-loss-support',
    'Medical Weight Loss Support',
    'GLP-1 and virtual weight loss care',
    'Medical weight loss support including GLP-1 prescriptions through virtual care visits with licensed providers.',
  ),

  // ── Voluntary benefits ───────────────────────────────────────────────
  benefit('disability', 'Disability', 'Protect your income if you cannot work', 'Income protection when illness or injury prevents you from working.'),
  benefit('critical-illness', 'Critical Illness', 'Lump-sum benefit for serious diagnoses', 'Financial support when diagnosed with a covered critical illness like cancer, heart attack, or stroke.'),
  benefit('vision', 'Vision', 'Clear sight, clear savings', 'Vision care membership for eye exams, glasses, contacts, and corrective procedures.'),
  benefit('life', 'Life', 'Financial protection for your loved ones', 'Provide financial security for your family in the event of your passing with life insurance options.'),
  benefit('hospital', 'Hospital', 'Cash benefits for hospital stays', 'Fixed cash payments for hospital admissions, surgeries, and inpatient stays to supplement your sharing plan.'),
  benefit('accident', 'Accident', 'Coverage for unexpected injuries', 'Financial assistance for emergency care, fractures, and accident-related medical expenses.'),
  benefit('dental', 'Dental', 'Complete oral health membership', 'Membership for preventive dental care, fillings, crowns, and major dental procedures.'),
  benefit('pet', 'Pet', 'Healthcare for your pets', 'Veterinary expense membership for pet accidents, illnesses, surgeries, and optional wellness care.'),

  // ── Member handbooks ─────────────────────────────────────────────────
  handbook('careplus', 'Care Plus Member Handbook', 'Care Plus member handbook with plan benefits, Sedera guidelines, and member resources.'),
  handbook('direct-handbook', 'Direct Member Handbook', 'Direct plan member handbook with benefits overview, guidelines, and enrollment information.'),
  handbook('direct', 'Direct Member Handbook', 'Direct plan member handbook with benefits overview, guidelines, and enrollment information.'),
  handbook('secure-hsa', 'Secure HSA Member Handbook', 'Secure HSA member handbook with HSA-compatible plan benefits, guidelines, and tax-advantaged savings details.'),
  handbook('essentials', 'Essentials Member Handbook', 'Essentials plan member handbook with core health sharing benefits, guidelines, and member forms.'),
  handbook('mecessentials-handbook', 'MEC Essentials Handbook', 'MEC Essentials handbook with minimum essential coverage details and member benefit guidelines.'),
  handbook('zion-guidelines', 'Zion HealthShare Guidelines', 'Zion HealthShare member guidelines handbook with sharing rules, eligibility, and program details.'),

  // ── Legal & informational ──────────────────────────────────────────────
  entry('/privacy-policy', {
    title: 'Privacy Policy | MPB Health',
    h1: 'Privacy Policy',
    description:
      'Read the MPB Health privacy policy. Learn how we collect, use, and protect your personal information when you use our health sharing services and member portal.',
  }),
  entry('/terms-and-conditions', {
    title: 'Terms and Conditions | MPB Health',
    h1: 'Terms and Conditions',
    description:
      'Review MPB Health terms and conditions for health sharing memberships. Understand member responsibilities, program rules, and service agreements before enrolling.',
  }),
  entry('/state-notices', {
    title: 'State Notices | MPB Health Medical Cost Sharing',
    h1: 'State Notices',
    description:
      'View state-specific notices for MPB Health medical cost sharing and health care sharing ministries. Important regulatory disclosures for members by state of residence.',
  }),
  entry('/washington-statement', {
    title: 'Washington State Statement | MPB Health',
    h1: 'Washington State Statement',
    description:
      'Washington state disclosure statement for MPB Health. Important information for Washington residents regarding health sharing program availability and regulations.',
  }),
  entry('/welcome', {
    title: 'Welcome to MPB Health | New Member Resources',
    h1: 'Welcome to MPB Health',
    description:
      'Welcome to MPB Health! Access new member resources, onboarding guides, and next steps to get the most from your health sharing membership and concierge support.',
  }),
  entry('/member-forms', {
    title: 'Member Forms | MPB Health',
    h1: 'Member Forms',
    description:
      'Browse MPB Health member forms for account updates, dependent information, payment changes, and support requests. Secure online forms for active members.',
  }),
  entry('/employer-forms', {
    title: 'Employer Forms | MPB Health',
    h1: 'Employer Forms',
    description:
      'Access MPB Health employer forms for list-bill setup, employee changes, and group health sharing administration. Secure forms for business administrators.',
  }),

  // ── Noindex: auth/admin (unique titles still help Bing disambiguate) ───
  entry('/admin/login', {
    title: 'Admin Login | MPB Health',
    h1: 'Admin Login',
    description:
      'Secure administrator login for MPB Health internal staff. Authorized personnel only — not a public member or enrollment page.',
    robots: 'noindex, follow',
  }),
  entry('/login', {
    title: 'Member Login | MPB Health',
    h1: 'Welcome to MPB Health',
    description:
      'Sign in to your MPB Health member account or get started with a personalized health sharing plan. Member portal access for existing members.',
    robots: 'noindex, follow',
  }),
  entry('/forgot-password', {
    title: 'Forgot Password | MPB Health',
    h1: 'Forgot Password',
    description:
      'Reset your MPB Health member account password. Enter your email to receive a secure password reset link.',
    robots: 'noindex, follow',
  }),
  entry('/reset-password', {
    title: 'Reset Password | MPB Health',
    h1: 'Reset Password',
    description:
      'Create a new password for your MPB Health member account using your secure reset link.',
    robots: 'noindex, follow',
  }),
  entry('/auth/confirm', {
    title: 'Confirm Account | MPB Health',
    h1: 'Confirm Account',
    description:
      'Confirm your MPB Health account or complete a secure password reset from your email link.',
    robots: 'noindex, follow',
  }),
  entry('/mfa-enrollment', {
    title: 'MFA Enrollment | MPB Health',
    h1: 'Multi-Factor Authentication',
    description:
      'Set up multi-factor authentication for your MPB Health member account to add an extra layer of sign-in security.',
    robots: 'noindex, follow',
  }),
];

export const EXTRA_PAGE_SEO = Object.fromEntries(entries);
