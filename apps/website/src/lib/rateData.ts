export interface RateRecord {
  productId: string;
  label: string;
  type: string;
  price: number;
  benefitId: string;
  benefitLabel: string;
  periodId: string;
  periodLabel: string;
  ageMin?: number;
  ageMax?: number;
  isSmoker: boolean;
}

export interface BenefitTier {
  id: string;
  label: string;
  displayLabel: string;
  iua: string;
}

export const planBenefitTiers: Record<string, BenefitTier[]> = {
  'essentials': [
    { id: '449', label: 'Member Only', displayLabel: 'Member Only', iua: '' },
    { id: '145', label: 'Member plus One (Spouse or Child)', displayLabel: 'Member + One', iua: '' },
    { id: '3391', label: 'Member + Family', displayLabel: 'Member + Family', iua: '' }
  ],
  'care-plus': [
    { id: '3281', label: 'Member Only - $1250 IUA', displayLabel: '$1,250 IUA', iua: '$1,250' },
    { id: '3279', label: 'Member Only - $2500 IUA', displayLabel: '$2,500 IUA', iua: '$2,500' },
    { id: '3278', label: 'Member Only - $5000 IUA', displayLabel: '$5,000 IUA', iua: '$5,000' }
  ],
  'direct': [
    { id: '3281', label: 'Member Only - $1250 IUA', displayLabel: '$1,250 IUA', iua: '$1,250' },
    { id: '3279', label: 'Member Only - $2500 IUA', displayLabel: '$2,500 IUA', iua: '$2,500' },
    { id: '3278', label: 'Member Only - $5000 IUA', displayLabel: '$5,000 IUA', iua: '$5,000' }
  ],
  'mec-essentials': [
    { id: '449', label: 'Member Only', displayLabel: 'Member Only', iua: '' },
    { id: '4874', label: 'Member + Spouse', displayLabel: 'Member + Spouse', iua: '' },
    { id: '2025', label: 'Member + Children', displayLabel: 'Member + Children', iua: '' },
    { id: '3391', label: 'Member + Family', displayLabel: 'Member + Family', iua: '' }
  ],
  'secure-hsa': [
    { id: '3281', label: 'Member Only - $1250 IUA', displayLabel: '$1,250 IUA', iua: '$1,250' },
    { id: '3279', label: 'Member Only - $2500 IUA', displayLabel: '$2,500 IUA', iua: '$2,500' },
    { id: '3278', label: 'Member Only - $5000 IUA', displayLabel: '$5,000 IUA', iua: '$5,000' }
  ]
};

export const rateData: RateRecord[] = [
  { productId: '42463', label: 'ESSENTIALS', type: 'Enrollment Fee', price: 25.00, benefitId: '', benefitLabel: '', periodId: '7', periodLabel: 'One-Time', isSmoker: false },
  { productId: '42463', label: 'ESSENTIALS', type: 'Product', price: 49.95, benefitId: '449', benefitLabel: 'Member Only', periodId: '1', periodLabel: 'Monthly', isSmoker: false },
  { productId: '42463', label: 'ESSENTIALS', type: 'Product', price: 59.95, benefitId: '145', benefitLabel: 'Member plus One (Spouse or Child)', periodId: '1', periodLabel: 'Monthly', isSmoker: false },
  { productId: '42463', label: 'ESSENTIALS', type: 'Product', price: 69.95, benefitId: '3391', benefitLabel: 'Member + Family', periodId: '1', periodLabel: 'Monthly', isSmoker: false },

  { productId: '42464', label: 'CARE PLUS', type: 'Tobacco Use', price: 50.00, benefitId: '', benefitLabel: '', periodId: '1', periodLabel: 'Monthly', isSmoker: true },
  { productId: '42464', label: 'CARE PLUS', type: 'Annual Membership', price: 25.00, benefitId: '9493', benefitLabel: '$25 Annual Membership Fee', periodId: '5', periodLabel: 'Annual', isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 245.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 273.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 352.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 185.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 205.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 300.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 160.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 185.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '42464', label: 'CARE PLUS', type: 'Product', price: 235.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },

  { productId: '42465', label: 'DIRECT', type: 'Tobacco Use', price: 50.00, benefitId: '', benefitLabel: '', periodId: '1', periodLabel: 'Monthly', isSmoker: true },
  { productId: '42465', label: 'DIRECT', type: 'Enrollment', price: 100.00, benefitId: '', benefitLabel: '', periodId: '7', periodLabel: 'One-Time', isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Annual Membership', price: 25.00, benefitId: '9493', benefitLabel: '$25 Annual Membership Fee', periodId: '5', periodLabel: 'Annual', isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 295.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 300.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 386.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 230.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 280.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 350.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 190.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 250.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '42465', label: 'DIRECT', type: 'Product', price: 275.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },

  { productId: '45388', label: 'MEC+ ESSENTIALS', type: 'Enrollment', price: 100.00, benefitId: '', benefitLabel: '', periodId: '7', periodLabel: 'One-Time', isSmoker: false },
  { productId: '45388', label: 'MEC+ ESSENTIALS', type: 'Annual Membership', price: 25.00, benefitId: '9493', benefitLabel: '$25 Annual Membership Fee', periodId: '5', periodLabel: 'Annual', isSmoker: false },
  { productId: '45388', label: 'MEC+ ESSENTIALS', type: 'Product', price: 125.00, benefitId: '449', benefitLabel: 'Member Only', periodId: '1', periodLabel: 'Monthly', isSmoker: false },
  { productId: '45388', label: 'MEC+ ESSENTIALS', type: 'Product', price: 160.00, benefitId: '4874', benefitLabel: 'Member + Spouse', periodId: '1', periodLabel: 'Monthly', isSmoker: false },
  { productId: '45388', label: 'MEC+ ESSENTIALS', type: 'Product', price: 160.00, benefitId: '2025', benefitLabel: 'Member + Children', periodId: '1', periodLabel: 'Monthly', isSmoker: false },
  { productId: '45388', label: 'MEC+ ESSENTIALS', type: 'Product', price: 195.00, benefitId: '3391', benefitLabel: 'Member + Family', periodId: '1', periodLabel: 'Monthly', isSmoker: false },

  { productId: '45800', label: 'SECURE HSA', type: 'Tobacco Use', price: 50.00, benefitId: '', benefitLabel: '', periodId: '1', periodLabel: 'Monthly', isSmoker: true },
  { productId: '45800', label: 'SECURE HSA', type: 'Enrollment', price: 100.00, benefitId: '', benefitLabel: '', periodId: '7', periodLabel: 'One-Time', isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Annual Membership', price: 25.00, benefitId: '9493', benefitLabel: '$25 Annual Membership Fee', periodId: '5', periodLabel: 'Annual', isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 309.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 336.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 419.00, benefitId: '3281', benefitLabel: 'Member Only - $1250 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 256.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 276.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 369.00, benefitId: '3279', benefitLabel: 'Member Only - $2500 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 231.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 18, ageMax: 29, isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 256.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 30, ageMax: 49, isSmoker: false },
  { productId: '45800', label: 'SECURE HSA', type: 'Product', price: 301.00, benefitId: '3278', benefitLabel: 'Member Only - $5000 IUA', periodId: '1', periodLabel: 'Monthly', ageMin: 50, ageMax: 64, isSmoker: false },
];
