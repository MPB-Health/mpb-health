import { getPlanEnrollUrl } from '../../lib/planEnrollUrls';
import type { PlanCardData } from './page-kit';

/**
 * Plan copy for the redesigned membership pages. Pricing strings mirror
 * EnhancedPricingSection / EnhancedBusinessPricingSection (the legacy
 * blocks) so both surfaces stay in step until plans come from the DB.
 */

export const INDIVIDUAL_PLANS: ReadonlyArray<PlanCardData> = [
  {
    id: 'essentials',
    name: 'Essentials',
    price: '$50',
    tagline: 'Virtual care, pharmacy savings and debt relief. No medical cost sharing.',
    whoFor: 'Best for young, healthy individuals',
    enrollUrl: getPlanEnrollUrl('essentials'),
    learnUrl: '/compare-plans',
    features: [
      '$0 virtual urgent care, 24/7',
      'Virtual primary care',
      'Virtual behavioral health',
      'MPB concierge assistance',
      'Pharmacy and vitamin discounts',
      'Debt dismissal program',
    ],
    footnote: 'Eligibility requirements apply. Speak with a healthcare advisor for details.',
  },
  {
    id: 'care-plus',
    name: 'Care+',
    price: '$166',
    tagline: 'Medical cost sharing for the unexpected, with everyday virtual care built in.',
    whoFor: 'Best for families seeking balanced protection',
    enrollUrl: getPlanEnrollUrl('care-plus'),
    learnUrl: '/compare-plans',
    featured: true,
    badge: 'Most popular',
    features: [
      'Medical cost sharing after your IUA',
      '$0 virtual urgent care, 24/7',
      'Virtual primary and behavioral health',
      'MPB concierge assistance',
      'Pharmacy and vitamin discounts',
      'DNA test discounts and virtual pet care',
    ],
  },
  {
    id: 'direct',
    name: 'Direct',
    price: '$201',
    tagline: 'Preventive sharing plus comprehensive medical cost protection.',
    whoFor: 'Best for families who value preventive care',
    enrollUrl: getPlanEnrollUrl('direct'),
    learnUrl: '/compare-plans',
    features: [
      'Preventive care sharing',
      'Medical cost sharing after your IUA',
      '$0 virtual urgent care, 24/7',
      'Virtual primary and behavioral health',
      'MPB concierge assistance',
      'Pharmacy, vitamin and DNA test discounts',
    ],
    footnote: 'Screening mammography and colonoscopy carry a 6-month waiting period on Direct.',
  },
];

export const BUSINESS_PLANS: ReadonlyArray<PlanCardData> = [
  {
    id: 'mec-essentials',
    name: 'HSA Essentials',
    price: '$125',
    tagline: 'Minimum Essential Care, debt dismissal and HSA compatibility for teams of 2 to 50.',
    whoFor: 'Best for cost-conscious businesses and 1099 professionals',
    enrollUrl: getPlanEnrollUrl('mec-essentials'),
    learnUrl: '/compare-plans',
    features: [
      'Satisfies the ACA employer mandate',
      'HSA compatible with tax advantages',
      'Debt dismissal program',
      '$0 virtual urgent, primary and behavioral care',
      'MPB concierge assistance',
      'Pharmacy, vitamin and DNA test discounts',
    ],
  },
  {
    id: 'secure-hsa',
    name: 'Secure HSA',
    price: '$239',
    tagline: 'HSA-compatible membership with high-deductible protection and full medical cost sharing.',
    whoFor: 'Best for self-employed owners seeking tax advantages',
    enrollUrl: getPlanEnrollUrl('secure-hsa'),
    learnUrl: '/compare-plans',
    featured: true,
    badge: 'Most complete',
    features: [
      'Medical cost sharing after your IUA',
      'ACA-mandated preventive care at $0',
      'Annual wellness visit at $0',
      'Rx benefits from $0 to $15',
      'HSA compatible with tax advantages',
      '$0 virtual urgent, primary and behavioral care',
    ],
  },
];

export const INDIVIDUAL_COMPARE = {
  columns: ['Essentials', 'Care+', 'Direct'],
  groups: [
    {
      title: 'Virtual healthcare',
      rows: [
        { label: '24/7 virtual urgent care', values: [true, true, true] },
        { label: 'Virtual primary care', values: [true, true, true] },
        { label: 'Virtual behavioral health', values: [true, true, true] },
      ],
    },
    {
      title: 'Medical sharing',
      rows: [
        { label: 'Medical cost sharing', values: [false, true, true] },
        { label: 'Preventive sharing', values: [false, false, true] },
        {
          label: 'Screening mammography and colonoscopy',
          note: '6-month waiting period on Direct',
          values: [false, false, true],
        },
      ],
    },
    {
      title: 'Financial benefits',
      rows: [
        { label: 'Pharmacy discounts', values: [true, true, true] },
        { label: 'Vitamin discounts', values: [true, true, true] },
        { label: 'Debt dismissal program', values: [true, false, false] },
      ],
    },
    {
      title: 'Support and extras',
      rows: [
        { label: 'MPB concierge assistance', values: [true, true, true] },
        { label: 'Virtual pet care', values: [true, true, true] },
        { label: 'DNA test discounts', values: [false, true, true] },
      ],
    },
  ],
} as const;

export const BUSINESS_COMPARE = {
  columns: ['HSA Essentials', 'Secure HSA'],
  groups: [
    {
      title: 'Compliance and tax',
      rows: [
        { label: 'Minimum Essential Care', values: [true, true] },
        { label: 'HSA compatible', values: [true, true] },
        { label: 'Tax advantages', values: [true, true] },
        { label: 'Debt dismissal program', values: [true, false] },
      ],
    },
    {
      title: 'Medical sharing',
      rows: [
        { label: 'Medical cost sharing', values: [false, true] },
        { label: 'ACA preventive care', values: [false, true] },
        { label: 'High-deductible protection', values: [false, true] },
      ],
    },
    {
      title: 'Virtual healthcare',
      rows: [
        { label: 'Virtual urgent care', values: [true, true] },
        { label: 'Virtual primary care', values: [true, true] },
        { label: 'Virtual behavioral health', values: [true, true] },
      ],
    },
    {
      title: 'Support and extras',
      rows: [
        { label: 'MPB concierge assistance', values: [true, true] },
        { label: 'Pharmacy and vitamin discounts', values: [true, true] },
        { label: 'DNA test discounts and virtual pet care', values: [true, true] },
      ],
    },
  ],
} as const;
