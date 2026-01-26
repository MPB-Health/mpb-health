import { describe, it, expect } from 'vitest';
import { lookupPrice, getBenefitTiersForPlan } from '../lib/pricingService';
import { estimateMonthly } from '../lib/newRateEngine';

describe('CSV Pricing Validation', () => {
  describe('Essentials Plan', () => {
    it('should return correct price for Member Only', () => {
      const result = lookupPrice({
        planId: 'essentials',
        householdType: 'individual',
        primaryAge: 35,
        primaryTobacco: false,
      });

      expect(result).not.toBeNull();
      expect(result?.totalMonthly).toBe(50);
    });

    it('should return correct price for Member + Family', () => {
      const result = lookupPrice({
        planId: 'essentials',
        householdType: 'family',
        primaryAge: 35,
        primaryTobacco: false,
      });

      expect(result).not.toBeNull();
      expect(result?.totalMonthly).toBe(70);
    });
  });

  describe('Care Plus Plan', () => {
    it('should return correct price for $1250 IUA, age 25', () => {
      const result = lookupPrice({
        planId: 'care-plus',
        householdType: 'individual',
        primaryAge: 25,
        benefitTier: '3281',
        primaryTobacco: false,
      });

      expect(result).not.toBeNull();
      expect(result?.totalMonthly).toBe(268); // 2026 rate: Care+ $1,250 IUA, 18-29, Member Only
      expect(result?.benefitTier?.iua).toBe('$1,250');
    });

    it('should return correct price for $2500 IUA, age 35', () => {
      const result = lookupPrice({
        planId: 'care-plus',
        householdType: 'individual',
        primaryAge: 35,
        benefitTier: '3279',
        primaryTobacco: false,
      });

      expect(result).not.toBeNull();
      expect(result?.totalMonthly).toBe(216); // 2026 rate: Care+ $2,500 IUA, 30-49, Member Only
      expect(result?.benefitTier?.iua).toBe('$2,500');
    });

    it('should apply tobacco surcharge correctly', () => {
      const result = lookupPrice({
        planId: 'care-plus',
        householdType: 'individual',
        primaryAge: 25,
        benefitTier: '3281',
        primaryTobacco: true,
      });

      expect(result).not.toBeNull();
      expect(result?.totalMonthly).toBe(318); // 2026 rate: 268 + 50 tobacco surcharge
      expect(result?.tobaccoSurcharge).toBe(50);
    });

    it('should return correct price for couple with $5000 IUA', () => {
      const result = lookupPrice({
        planId: 'care-plus',
        householdType: 'couple',
        primaryAge: 35,
        spouseAge: 32,
        benefitTier: '3286',
        primaryTobacco: false,
        spouseTobacco: false,
      });

      expect(result).not.toBeNull();
      expect(result?.totalMonthly).toBe(341); // 2026 rate: Care+ $5,000 IUA, 30-49, Member+Spouse
    });
  });

  describe('Direct Plan', () => {
    it('should return correct price for $1250 IUA, age 55', () => {
      const result = lookupPrice({
        planId: 'direct',
        householdType: 'individual',
        primaryAge: 55,
        benefitTier: '3281',
        primaryTobacco: false,
      });

      expect(result).not.toBeNull();
      expect(result?.totalMonthly).toBe(415); // 2026 rate: Direct $1,250 IUA, 50-64, Member Only
    });

    it('should apply enrollment fee correctly', () => {
      const result = lookupPrice({
        planId: 'direct',
        householdType: 'individual',
        primaryAge: 25,
        benefitTier: '3278',
        primaryTobacco: false,
      });

      expect(result).not.toBeNull();
      expect(result?.enrollmentFee).toBe(100);
      expect(result?.annualMembershipFee).toBe(25);
    });
  });

  describe('Secure HSA Plan', () => {
    it('should return correct price for $2500 IUA, age 45', () => {
      const result = lookupPrice({
        planId: 'secure-hsa',
        householdType: 'individual',
        primaryAge: 45,
        benefitTier: '3279',
        primaryTobacco: false,
      });

      expect(result).not.toBeNull();
      expect(result?.totalMonthly).toBe(289); // 2026 rate: Secure HSA $2,500 IUA, 30-49, Member Only
    });
  });

  describe('Benefit Tiers', () => {
    it('should return benefit tiers for Care Plus', () => {
      const tiers = getBenefitTiersForPlan('care-plus');

      expect(tiers.length).toBeGreaterThan(0);
      expect(tiers.some(t => t.iua === '$1,250')).toBe(true);
      expect(tiers.some(t => t.iua === '$2,500')).toBe(true);
      expect(tiers.some(t => t.iua === '$5,000')).toBe(true);
    });

    it('should return benefit tiers for Essentials', () => {
      const tiers = getBenefitTiersForPlan('essentials');

      expect(tiers.length).toBeGreaterThanOrEqual(1);
      expect(tiers[0].displayLabel).toBe('Member Only');
    });
  });

  describe('Rate Engine Integration', () => {
    it('should calculate rate through rate engine', () => {
      const result = estimateMonthly({
        state: 'FL',
        householdType: 'individual',
        primaryAge: 35,
        dependentsCount: 0,
        primaryTobacco: false,
        spouseTobacco: false,
        selectedPlan: 'care-plus',
        benefitTier: '3279',
      }, { rateVersion: '2026-01-01' });

      expect(result.total).toBe(216); // 2026 rate: Care+ $2,500 IUA, 30-49, Member Only
      expect(result.lineItems.length).toBeGreaterThan(0);
    });

    it('should calculate family rate with tobacco', () => {
      const result = estimateMonthly({
        state: 'TX',
        householdType: 'couple',
        primaryAge: 40,
        spouseAge: 38,
        dependentsCount: 0,
        primaryTobacco: true,
        spouseTobacco: false,
        selectedPlan: 'direct',
        benefitTier: '3285',
      });

      expect(result.total).toBeGreaterThan(400);
      expect(result.lineItems.some(item => item.description.toLowerCase().includes('tobacco'))).toBe(true);
    });
  });
});
