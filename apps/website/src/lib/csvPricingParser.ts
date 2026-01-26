import csvData from '../../content/359546_Product_Pricing_Export_101425162350 copy.csv?raw';

export interface PricingRecord {
  productId: string;
  label: string;
  type: 'Product' | 'Enrollment Fee' | 'Enrollment' | 'Annual Membership' | 'Tobacco Use';
  price: number;
  benefitId: string;
  benefitLabel: string;
  periodId: string;
  periodLabel: string;
  includeForPayments: string;
  excludeForPayments: string;
  totalPayments: string;
  commissionableAmount: string;
  isDisplayOnline: string;
  displayStart: string;
  displayStop: string;
  state: string;
  firstThreeZip: string;
  fullZipcode: string;
  memberAgeMin: number | null;
  memberAgeMax: number | null;
  memberSmoker: string;
  memberGender: string;
  memberHeightMin: string;
  memberHeightMax: string;
  memberWeightMin: string;
  memberWeightMax: string;
  hasSpouse: string;
  spouseAgeMin: string;
  spouseAgeMax: string;
  spouseSmoker: string;
  spouseGender: string;
  spouseHeightMin: string;
  spouseHeightMax: string;
  spouseWeightMin: string;
  spouseWeightMax: string;
  childCountMin: string;
  childCountMax: string;
}

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
  isSmoker: boolean;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function parseCSV(): PricingRecord[] {
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  const records: PricingRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length < headers.length) continue;

    const record: PricingRecord = {
      productId: values[0] || '',
      label: values[1] || '',
      type: values[2] as any || 'Product',
      price: parseFloat(values[3]) || 0,
      benefitId: values[4] || '',
      benefitLabel: values[5] || '',
      periodId: values[6] || '',
      periodLabel: values[7] || '',
      includeForPayments: values[8] || '',
      excludeForPayments: values[9] || '',
      totalPayments: values[10] || '',
      commissionableAmount: values[11] || '',
      isDisplayOnline: values[12] || '',
      displayStart: values[13] || '',
      displayStop: values[14] || '',
      state: values[15] || '',
      firstThreeZip: values[16] || '',
      fullZipcode: values[17] || '',
      memberAgeMin: values[18] ? parseInt(values[18]) : null,
      memberAgeMax: values[19] ? parseInt(values[19]) : null,
      memberSmoker: values[20] || '',
      memberGender: values[21] || '',
      memberHeightMin: values[22] || '',
      memberHeightMax: values[23] || '',
      memberWeightMin: values[24] || '',
      memberWeightMax: values[25] || '',
      hasSpouse: values[26] || '',
      spouseAgeMin: values[27] || '',
      spouseAgeMax: values[28] || '',
      spouseSmoker: values[29] || '',
      spouseGender: values[30] || '',
      spouseHeightMin: values[31] || '',
      spouseHeightMax: values[32] || '',
      spouseWeightMin: values[33] || '',
      spouseWeightMax: values[34] || '',
      childCountMin: values[35] || '',
      childCountMax: values[36] || '',
    };

    records.push(record);
  }

  return records;
}

export function normalizeProductLabel(label: string): string {
  const normalized = label.trim().toUpperCase();
  const mapping: Record<string, string> = {
    'ESSENTIALS': 'essentials',
    'CARE PLUS': 'care-plus',
    'DIRECT': 'direct',
    'MEC+ ESSENTIALS': 'mec-essentials',
    'SECURE HSA': 'secure-hsa',
  };

  return mapping[normalized] || label.toLowerCase().replace(/\s+/g, '-');
}

function determineHouseholdType(benefitLabel: string): 'individual' | 'couple' | 'family' {
  const lower = benefitLabel.toLowerCase();

  if (lower.includes('family')) return 'family';
  if (lower.includes('spouse') || lower.includes('plus one')) return 'couple';
  if (lower.includes('children')) return 'family';

  return 'individual';
}

function extractIUA(benefitLabel: string): string {
  const match = benefitLabel.match(/\$(\d+(?:,\d+)?)\s*IUA/i);
  if (match) {
    return `$${match[1].replace(',', '')}`;
  }
  return '';
}

export function buildProductPricingMap(): Map<string, ProductPricing> {
  const records = parseCSV();
  const productMap = new Map<string, ProductPricing>();

  for (const record of records) {
    if (record.isDisplayOnline !== 'Yes') continue;

    const planId = normalizeProductLabel(record.label);

    if (!productMap.has(planId)) {
      productMap.set(planId, {
        productId: record.productId,
        productLabel: record.label,
        enrollmentFee: 0,
        annualMembershipFee: 0,
        tobaccoSurcharge: 0,
        benefitTiers: [],
      });
    }

    const product = productMap.get(planId)!;

    if (record.type === 'Enrollment Fee' || record.type === 'Enrollment') {
      product.enrollmentFee = record.price;
    } else if (record.type === 'Annual Membership') {
      product.annualMembershipFee = record.price;
    } else if (record.type === 'Tobacco Use') {
      product.tobaccoSurcharge = record.price;
    } else if (record.type === 'Product' && record.benefitId) {
      const householdType = determineHouseholdType(record.benefitLabel);
      const iua = extractIUA(record.benefitLabel);

      let tier = product.benefitTiers.find(
        t => t.benefitId === record.benefitId && t.householdType === householdType
      );

      if (!tier) {
        tier = {
          benefitId: record.benefitId,
          benefitLabel: record.benefitLabel,
          displayLabel: iua || record.benefitLabel,
          iua,
          householdType,
          ageRanges: [],
        };
        product.benefitTiers.push(tier);
      }

      if (record.memberAgeMin !== null && record.memberAgeMax !== null) {
        tier.ageRanges.push({
          ageMin: record.memberAgeMin,
          ageMax: record.memberAgeMax,
          price: record.price,
          isSmoker: record.memberSmoker === 'Yes',
        });
      }
    }
  }

  return productMap;
}

let cachedPricingMap: Map<string, ProductPricing> | null = null;

export function getPricingData(): Map<string, ProductPricing> {
  if (!cachedPricingMap) {
    cachedPricingMap = buildProductPricingMap();
  }
  return cachedPricingMap;
}
