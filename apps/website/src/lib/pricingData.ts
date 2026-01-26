import rateTablesConfigV2 from '../../content/rate_tables.config.v2.json';

export interface ProductPricing {
  productId: string;
  productLabel: string;
  enrollmentFee: number;
  annualMembershipFee: number;
  tobaccoSurcharge: number;
  benefitTiers: BenefitTierPricing[];
}

export interface BenefitTierPricing {
  benefitId: string;
  benefitLabel: string;
  displayLabel: string;
  iua: string;
  householdType: 'individual' | 'couple' | 'family';
  ageRanges: AgePricing[];
}

export interface AgePricing {
  ageMin: number;
  ageMax: number;
  price: number;
}

type RatePlanId = 'care-plus' | 'direct' | 'secure-hsa';

type HouseholdType = 'individual' | 'couple' | 'family';

interface _RateTablesAgeBand {
  '18-29': number;
  '30-49': number;
  '50-64': number;
}

interface RateTablesProduct {
  iua_options: number[];
  rate_tables: Record<string, Record<'18-29' | '30-49' | '50-64', Record<'MemberOnly' | 'MemberSpouse' | 'MemberChild' | 'MemberFamily', number>>>;
}

interface RateTablesVersion {
  id: string;
  effective_date: string;
  products: Record<string, RateTablesProduct>;
}

interface RateTablesConfig {
  schema: string;
  tobacco_household_monthly_surcharge: number;
  versions: RateTablesVersion[];
}

interface TierMeta {
  benefitId: string;
  iua: number;
  householdType: HouseholdType;
  displayLabel?: string;
  iuaLabel?: string;
}

const PRICING_DATA_BASE: Record<string, ProductPricing> = {
  'essentials': {
    productId: '42463',
    productLabel: 'ESSENTIALS',
    enrollmentFee: 25,
    annualMembershipFee: 0,
    tobaccoSurcharge: 0,
    benefitTiers: [
      {
        benefitId: '449',
        benefitLabel: 'Member Only',
        displayLabel: 'Member Only',
        iua: '',
        householdType: 'individual',
        ageRanges: [{ ageMin: 18, ageMax: 64, price: 49.95 }]
      },
      {
        benefitId: '145',
        benefitLabel: 'Member plus One (Spouse or Child)',
        displayLabel: 'Member + One',
        iua: '',
        householdType: 'couple',
        ageRanges: [{ ageMin: 18, ageMax: 64, price: 59.95 }]
      },
      {
        benefitId: '3391',
        benefitLabel: 'Member + Family',
        displayLabel: 'Member + Family',
        iua: '',
        householdType: 'family',
        ageRanges: [{ ageMin: 18, ageMax: 64, price: 69.95 }]
      }
    ]
  },
  'care-plus': {
    productId: '42464',
    productLabel: 'CARE PLUS',
    enrollmentFee: 0,
    annualMembershipFee: 25,
    tobaccoSurcharge: 50,
    benefitTiers: [
      {
        benefitId: '3281',
        benefitLabel: 'Member Only - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 268 },
          { ageMin: 30, ageMax: 49, price: 298 },
          { ageMin: 50, ageMax: 64, price: 381 }
        ]
      },
      {
        benefitId: '3279',
        benefitLabel: 'Member Only - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 203 },
          { ageMin: 30, ageMax: 49, price: 216 },
          { ageMin: 50, ageMax: 64, price: 318 }
        ]
      },
      {
        benefitId: '3278',
        benefitLabel: 'Member Only - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 166 },
          { ageMin: 30, ageMax: 49, price: 193 },
          { ageMin: 50, ageMax: 64, price: 247 }
        ]
      },
      {
        benefitId: '3283',
        benefitLabel: 'Member + Spouse - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 467 },
          { ageMin: 30, ageMax: 49, price: 494 },
          { ageMin: 50, ageMax: 64, price: 668 }
        ]
      },
      {
        benefitId: '3285',
        benefitLabel: 'Member + Spouse - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 344 },
          { ageMin: 30, ageMax: 49, price: 387 },
          { ageMin: 50, ageMax: 64, price: 537 }
        ]
      },
      {
        benefitId: '3286',
        benefitLabel: 'Member + Spouse - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 284 },
          { ageMin: 30, ageMax: 49, price: 341 },
          { ageMin: 50, ageMax: 64, price: 442 }
        ]
      },
      {
        benefitId: '3293',
        benefitLabel: 'Member + Family - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 702 },
          { ageMin: 30, ageMax: 49, price: 713 },
          { ageMin: 50, ageMax: 64, price: 947 }
        ]
      },
      {
        benefitId: '3295',
        benefitLabel: 'Member + Family - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 563 },
          { ageMin: 30, ageMax: 49, price: 575 },
          { ageMin: 50, ageMax: 64, price: 748 }
        ]
      },
      {
        benefitId: '3296',
        benefitLabel: 'Member + Family - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 445 },
          { ageMin: 30, ageMax: 49, price: 503 },
          { ageMin: 50, ageMax: 64, price: 647 }
        ]
      }
    ]
  },
  'direct': {
    productId: '42465',
    productLabel: 'DIRECT',
    enrollmentFee: 100,
    annualMembershipFee: 25,
    tobaccoSurcharge: 50,
    benefitTiers: [
      {
        benefitId: '3281',
        benefitLabel: 'Member Only - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 295 },
          { ageMin: 30, ageMax: 49, price: 321 },
          { ageMin: 50, ageMax: 64, price: 415 }
        ]
      },
      {
        benefitId: '3279',
        benefitLabel: 'Member Only - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 229 },
          { ageMin: 30, ageMax: 49, price: 280 },
          { ageMin: 50, ageMax: 64, price: 353 }
        ]
      },
      {
        benefitId: '3278',
        benefitLabel: 'Member Only - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 201 },
          { ageMin: 30, ageMax: 49, price: 250 },
          { ageMin: 50, ageMax: 64, price: 282 }
        ]
      },
      {
        benefitId: '3283',
        benefitLabel: 'Member + Spouse - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 504 },
          { ageMin: 30, ageMax: 49, price: 540 },
          { ageMin: 50, ageMax: 64, price: 698 }
        ]
      },
      {
        benefitId: '3285',
        benefitLabel: 'Member + Spouse - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 390 },
          { ageMin: 30, ageMax: 49, price: 490 },
          { ageMin: 50, ageMax: 64, price: 580 }
        ]
      },
      {
        benefitId: '3286',
        benefitLabel: 'Member + Spouse - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 325 },
          { ageMin: 30, ageMax: 49, price: 415 },
          { ageMin: 50, ageMax: 64, price: 480 }
        ]
      },
      {
        benefitId: '3293',
        benefitLabel: 'Member + Family - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 762 },
          { ageMin: 30, ageMax: 49, price: 773 },
          { ageMin: 50, ageMax: 64, price: 1006 }
        ]
      },
      {
        benefitId: '3295',
        benefitLabel: 'Member + Family - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 623 },
          { ageMin: 30, ageMax: 49, price: 700 },
          { ageMin: 50, ageMax: 64, price: 855 }
        ]
      },
      {
        benefitId: '3296',
        benefitLabel: 'Member + Family - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 505 },
          { ageMin: 30, ageMax: 49, price: 630 },
          { ageMin: 50, ageMax: 64, price: 707 }
        ]
      }
    ]
  },
  'mec-essentials': {
    productId: '45388',
    productLabel: 'MEC+ ESSENTIALS',
    enrollmentFee: 100,
    annualMembershipFee: 25,
    tobaccoSurcharge: 0,
    benefitTiers: [
      {
        benefitId: '449',
        benefitLabel: 'Member Only',
        displayLabel: 'Member Only',
        iua: '',
        householdType: 'individual',
        ageRanges: [{ ageMin: 18, ageMax: 64, price: 125 }]
      },
      {
        benefitId: '4874',
        benefitLabel: 'Member + Spouse',
        displayLabel: 'Member + Spouse',
        iua: '',
        householdType: 'couple',
        ageRanges: [{ ageMin: 18, ageMax: 64, price: 160 }]
      },
      {
        benefitId: '3391',
        benefitLabel: 'Member + Family',
        displayLabel: 'Member + Family',
        iua: '',
        householdType: 'family',
        ageRanges: [{ ageMin: 18, ageMax: 64, price: 195 }]
      },
      {
        benefitId: '2025',
        benefitLabel: 'Member + Children',
        displayLabel: 'Member + Children',
        iua: '',
        householdType: 'family',
        ageRanges: [{ ageMin: 18, ageMax: 64, price: 160 }]
      }
    ]
  },
  'secure-hsa': {
    productId: '45800',
    productLabel: 'SECURE HSA',
    enrollmentFee: 100,
    annualMembershipFee: 25,
    tobaccoSurcharge: 50,
    benefitTiers: [
      {
        benefitId: '3281',
        benefitLabel: 'Member Only - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 326 },
          { ageMin: 30, ageMax: 49, price: 359 },
          { ageMin: 50, ageMax: 64, price: 448 }
        ]
      },
      {
        benefitId: '3279',
        benefitLabel: 'Member Only - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 257 },
          { ageMin: 30, ageMax: 49, price: 289 },
          { ageMin: 50, ageMax: 64, price: 391 }
        ]
      },
      {
        benefitId: '3278',
        benefitLabel: 'Member Only - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'individual',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 239 },
          { ageMin: 30, ageMax: 49, price: 266 },
          { ageMin: 50, ageMax: 64, price: 320 }
        ]
      },
      {
        benefitId: '3283',
        benefitLabel: 'Member + Spouse - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 576 },
          { ageMin: 30, ageMax: 49, price: 603 },
          { ageMin: 50, ageMax: 64, price: 774 }
        ]
      },
      {
        benefitId: '3285',
        benefitLabel: 'Member + Spouse - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 448 },
          { ageMin: 30, ageMax: 49, price: 488 },
          { ageMin: 50, ageMax: 64, price: 646 }
        ]
      },
      {
        benefitId: '3286',
        benefitLabel: 'Member + Spouse - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'couple',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 393 },
          { ageMin: 30, ageMax: 49, price: 450 },
          { ageMin: 50, ageMax: 64, price: 551 }
        ]
      },
      {
        benefitId: '3293',
        benefitLabel: 'Member + Family - $1250 IUA',
        displayLabel: '$1,250 IUA',
        iua: '$1,250',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 816 },
          { ageMin: 30, ageMax: 49, price: 817 },
          { ageMin: 50, ageMax: 64, price: 1070 }
        ]
      },
      {
        benefitId: '3295',
        benefitLabel: 'Member + Family - $2500 IUA',
        displayLabel: '$2,500 IUA',
        iua: '$2,500',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 642 },
          { ageMin: 30, ageMax: 49, price: 679 },
          { ageMin: 50, ageMax: 64, price: 852 }
        ]
      },
      {
        benefitId: '3296',
        benefitLabel: 'Member + Family - $5000 IUA',
        displayLabel: '$5,000 IUA',
        iua: '$5,000',
        householdType: 'family',
        ageRanges: [
          { ageMin: 18, ageMax: 29, price: 564 },
          { ageMin: 30, ageMax: 49, price: 598 },
          { ageMin: 50, ageMax: 64, price: 753 }
        ]
      }
    ]
  }
};

const RATE_VERSION: string = '2026-01-01';

const ratePlanMeta: Record<RatePlanId, { productId: string; productLabel: string; enrollmentFee: number; annualMembershipFee: number; tobaccoSurcharge: number; productName: string }> = {
  'care-plus': {
    productId: '42464',
    productLabel: 'CARE PLUS',
    enrollmentFee: 0,
    annualMembershipFee: 25,
    tobaccoSurcharge: 50,
    productName: 'CarePlus'
  },
  'direct': {
    productId: '42465',
    productLabel: 'DIRECT',
    enrollmentFee: 100,
    annualMembershipFee: 25,
    tobaccoSurcharge: 50,
    productName: 'Direct'
  },
  'secure-hsa': {
    productId: '45800',
    productLabel: 'SECURE HSA',
    enrollmentFee: 100,
    annualMembershipFee: 25,
    tobaccoSurcharge: 50,
    productName: 'SecureHSA'
  }
};

const ratePlanTiers: Record<RatePlanId, TierMeta[]> = {
  'care-plus': [
    { benefitId: '3281', iua: 1250, householdType: 'individual', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3279', iua: 2500, householdType: 'individual', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3278', iua: 5000, householdType: 'individual', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' },
    { benefitId: '3283', iua: 1250, householdType: 'couple', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3285', iua: 2500, householdType: 'couple', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3286', iua: 5000, householdType: 'couple', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' },
    { benefitId: '3293', iua: 1250, householdType: 'family', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3295', iua: 2500, householdType: 'family', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3296', iua: 5000, householdType: 'family', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' }
  ],
  'direct': [
    { benefitId: '3281', iua: 1250, householdType: 'individual', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3279', iua: 2500, householdType: 'individual', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3278', iua: 5000, householdType: 'individual', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' },
    { benefitId: '3283', iua: 1250, householdType: 'couple', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3285', iua: 2500, householdType: 'couple', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3286', iua: 5000, householdType: 'couple', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' },
    { benefitId: '3293', iua: 1250, householdType: 'family', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3295', iua: 2500, householdType: 'family', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3296', iua: 5000, householdType: 'family', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' }
  ],
  'secure-hsa': [
    { benefitId: '3281', iua: 1250, householdType: 'individual', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3279', iua: 2500, householdType: 'individual', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3278', iua: 5000, householdType: 'individual', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' },
    { benefitId: '3283', iua: 1250, householdType: 'couple', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3285', iua: 2500, householdType: 'couple', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3286', iua: 5000, householdType: 'couple', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' },
    { benefitId: '3293', iua: 1250, householdType: 'family', displayLabel: '$1,250 IUA', iuaLabel: '$1,250' },
    { benefitId: '3295', iua: 2500, householdType: 'family', displayLabel: '$2,500 IUA', iuaLabel: '$2,500' },
    { benefitId: '3296', iua: 5000, householdType: 'family', displayLabel: '$5,000 IUA', iuaLabel: '$5,000' }
  ]
};

const AGE_BANDS = [
  { key: '18-29', ageMin: 18, ageMax: 29 },
  { key: '30-49', ageMin: 30, ageMax: 49 },
  { key: '50-64', ageMin: 50, ageMax: 64 }
] as const;

function getVersion(versionId: string): RateTablesVersion {
  const cfg = rateTablesConfigV2 as RateTablesConfig;
  const version = cfg.versions.find(v => v.id === versionId);
  if (!version) {
    throw new Error(`Rate version not found: ${versionId}`);
  }
  return version;
}

function formatIuaLabel(tier: TierMeta): { displayLabel: string; iua: string } {
  const iuaString = tier.iuaLabel ?? `$${tier.iua.toLocaleString()}`;
  const displayLabel = tier.displayLabel ?? `${iuaString} IUA`;
  return { displayLabel, iua: iuaString };
}

function buildTierPricing(product: RateTablesProduct, tier: TierMeta): BenefitTierPricing {
  const table = product.rate_tables[tier.iua.toString()];
  if (!table) {
    throw new Error(`Missing rate table for IUA ${tier.iua}`);
  }

  const { displayLabel, iua } = formatIuaLabel(tier);

  const ageRanges: AgePricing[] = AGE_BANDS.map(band => {
    const rates = table[band.key];
    if (!rates) {
      throw new Error(`Missing age band ${band.key} for IUA ${tier.iua}`);
    }

    const membershipKey =
      tier.householdType === 'individual'
        ? 'MemberOnly'
        : tier.householdType === 'couple'
          ? 'MemberSpouse'
          : 'MemberFamily';

    let price = tier.householdType === 'family' && rates.MemberFamily === undefined
      ? rates.MemberSpouse ?? rates.MemberOnly
      : rates[membershipKey as keyof typeof rates];

    if (price === undefined) {
      throw new Error(`Missing rate for membership type ${membershipKey} at band ${band.key}`);
    }

    return {
      ageMin: band.ageMin,
      ageMax: band.ageMax,
      price
    };
  });

  return {
    benefitId: tier.benefitId,
    benefitLabel: displayLabel,
    displayLabel,
    iua,
    householdType: tier.householdType,
    ageRanges
  };
}

function buildRateBasedProducts(): Record<string, ProductPricing> {
  const version = getVersion(RATE_VERSION);
  const products: Record<string, ProductPricing> = {};

  (Object.keys(ratePlanMeta) as RatePlanId[]).forEach(planId => {
    const meta = ratePlanMeta[planId];
    const product = version.products[meta.productName];
    if (!product) {
      throw new Error(`Rate tables missing product ${meta.productName} for version ${version.id}`);
    }

    const tiers = ratePlanTiers[planId].map(tier => buildTierPricing(product, tier));

    products[planId] = {
      productId: meta.productId,
      productLabel: meta.productLabel,
      enrollmentFee: meta.enrollmentFee,
      annualMembershipFee: meta.annualMembershipFee,
      tobaccoSurcharge: meta.tobaccoSurcharge,
      benefitTiers: tiers
    };
  });

  return products;
}

const rateBasedProducts = buildRateBasedProducts();

export const PRICING_DATA: Record<string, ProductPricing> = {
  ...PRICING_DATA_BASE,
  ...rateBasedProducts
};
