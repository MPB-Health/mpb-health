/**
 * Dental Savings & Teledentistry — approved copy for /features/dental.
 * Source: "Dental - MPB Website Features Page" (approved Aug 19, 2026).
 * Keep wording verbatim; the disclosures are compliance copy.
 */

export const DENTAL_FEATURE = {
  id: 'dental',
  name: 'Dental Savings & Teledentistry',
  tagline: 'More ways to care for your smile.',
  metaTitle: 'Dental Savings & Teledentistry – Healthcare Features | MPB Health',
  metaDescription:
    'Select MPB Health memberships include access to the Careington POS dental network and DialCare Teledentistry, giving you more ways to save on dental care and connect with a licensed dental provider 24/7/365.',
  shortDescription:
    'Save 20% to 50% on most dental procedures through the Careington POS dental network, and talk to a licensed dentist 24/7/365 with DialCare Teledentistry.',
  heroImage: '/assets/feature-dental.jpg',
  cardImage: '/assets/feature-dental-card.jpg',
  intro: [
    'Good oral health is an important part of your overall well-being. That is why select MPB Health memberships include access to the Careington POS dental network and DialCare Teledentistry, giving you more ways to save on dental care and connect with a licensed dental provider whenever you need one.',
    'Whether it is time for your next cleaning, you are planning dental work, or you have an unexpected toothache, these services are here to help.',
  ],
  eligiblePlans: ['MPB Membership', 'MPB HSA Membership'],
} as const;

export const CAREINGTON = {
  name: 'Careington POS Dental Network',
  tagline: 'Save on everyday dental care.',
  body: 'The Careington POS dental network gives members access to savings on many common dental services through one of the nation’s largest dental networks.',
  features: [
    {
      title: '20% to 50% Savings',
      description:
        'Members may save 20% to 50% on most dental procedures, including routine oral exams, unlimited cleanings, crowns, root canals, dentures, and more.',
    },
    {
      title: 'Orthodontic Savings',
      description: 'Receive 20% savings on orthodontic services, including braces and retainers for children and adults.',
    },
    {
      title: 'Specialist Savings',
      description:
        'Receive 20% reduction on specialist’s normal fees, including endodontics, oral surgery, pediatric dentistry, periodontics, and prosthodontics where available.',
    },
    {
      title: 'Cosmetic Dentistry',
      description: 'Savings are also available on services such as bonding and veneers.',
    },
    {
      title: 'Nationwide Network',
      description: 'Choose from one of the largest dental networks nationally and visit any participating provider.',
    },
  ],
} as const;

/**
 * Savings scale: the three Careington features that state a percentage,
 * plotted to scale. Descriptions are the approved feature copy.
 */
export const SAVINGS_SCALE = [
  { label: 'Most dental procedures', detail: CAREINGTON.features[0].description, from: 20, to: 50 },
  { label: 'Orthodontic services', detail: CAREINGTON.features[1].description, from: 20, to: 20 },
  { label: 'Specialist fees', detail: CAREINGTON.features[2].description, from: 20, to: 20 },
] as const;

/** Careington features not already drawn on the savings scale. */
export const CAREINGTON_MORE = CAREINGTON.features.slice(SAVINGS_SCALE.length);

export const DIALCARE = {
  name: 'DialCare Teledentistry',
  tagline: 'Expert dental guidance, 24/7/365.',
  body: [
    'With DialCare Teledentistry, members are provided with convenient, robust care 24/7/365 through virtual consults for nonemergency dental needs. This unique program virtually connects members anywhere in the U.S. with licensed dental providers not only over the phone, but via video consults as well.',
    'DialCare Teledentistry dental providers can advise and diagnose members with oral pain, broken, chipped, sensitive or misaligned teeth, gum swelling and bleeding, sores, lesions, infections, second opinions and more.',
  ],
  features: [
    { title: '24/7/365 Access', description: 'Connect with a licensed dentist anytime, day or night.' },
    { title: 'Phone or Video Visits', description: 'Choose the option that’s most convenient for you.' },
    {
      title: 'Professional Dental Guidance',
      description:
        'Receive advice and diagnoses for a wide variety of oral health concerns, urgent dental questions, and second opinions.',
    },
  ],
  disclaimer:
    'When medically appropriate, a DialCare Teledentistry provider may prescribe a short-term, non-DEA controlled medication that members can pick up at the pharmacy of their choice. Prescriptions are not available for mood-altering drugs, including antidepressants, antianxiety or lifestyle medications. Prescriptions are not guaranteed.',
} as const;

export const COMMON_USES = {
  savings: [
    'Routine oral exams',
    'Unlimited cleanings',
    'Crowns',
    'Root canals',
    'Dentures',
    'Cosmetic dentistry',
    'Orthodontic services',
    'Specialist dental care where available',
  ],
  teledentistry: [
    'Oral pain',
    'Chipped or broken teeth',
    'Swollen or bleeding gums',
    'Sores or oral infections',
    'Dental-related questions',
    'Orthodontic needs',
    'Second opinions',
    'And more',
  ],
} as const;

export const HOW_IT_WORKS = [
  {
    title: 'Log in to your MPB Health App or Member Portal.',
    text: 'Access your Dental ID card, provider search, and dental program information.',
  },
  {
    title: 'Find a participating dentist.',
    text: 'Use the provider search located in the App to locate a participating dentist near you.',
  },
  {
    title: 'Schedule your appointment.',
    text: 'When scheduling your appointment, let the dental office know you’re a member of the Careington dental network.',
  },
  {
    title: 'Present your Dental ID Card.',
    text: 'Show your Dental ID card from the MPB Health App or Member Portal when you arrive for your appointment.',
  },
  {
    title: 'Receive your savings.',
    text: 'Receive available savings through the Careington POS dental network and pay the provider directly at the time of service, less the applicable savings.',
  },
] as const;

export const DENTAL_FAQS = [
  {
    question: 'Is this dental insurance?',
    answer:
      'No. This is a health care discount plan, not insurance. Your membership provides access to discounted rates from participating dental providers, and you pay for services directly at those discounted rates.',
  },
  {
    question: 'How much can I save?',
    answer:
      'Members may save 20% to 50% on most dental procedures through participating Careington providers. Savings vary by service and provider.',
  },
  {
    question: 'Can I choose my own dentist?',
    answer:
      'Yes. Members may visit any participating provider in the Careington POS dental network and choose a different participating provider at any time. Use the provider search in the MPB Health App or Member Portal to locate a participating dentist near you.',
  },
  {
    question: 'How soon can I use my Dental Savings Plan?',
    answer: 'Your dental savings are ready to use as soon as your membership is active!',
  },
  {
    question: 'Are there limits on how often I can use it?',
    answer:
      'No. There are no limits on use. You can use your dental discounts and Teledentistry services as often as you need.',
  },
  {
    question: 'Can I receive a prescription through DialCare Teledentistry?',
    answer:
      'When medically appropriate, a provider may prescribe a short-term, non-DEA controlled medication for pickup at your preferred pharmacy.',
  },
] as const;
