import { describe, it, expect } from 'vitest';
import { estimateMonthly, estimateBoth, getTobaccoSurcharge } from '../lib/newRateEngine.v2';
import { RateCalculatorInput } from '../lib/schema';

describe('Dual Pricing Rate Engine (Current vs 2026) - Championship Edition', () => {
  const baseInput: RateCalculatorInput = {
    state: 'FL',
    householdType: 'member-only',
    primaryAge: 35,
    dependentsCount: 0,
    primaryTobacco: false,
    spouseTobacco: false,
    selectedPlan: 'secure-hsa',
    benefitTier: '2500'
  };

  describe('Version Resolution', () => {
    it('should default to 2026 pricing (effective December 20, 2025)', () => {
      const result = estimateMonthly(baseInput);
      expect(result.meta?.version).toBe('2026-01-01');
      expect(result.meta?.effective_date).toBe('2026-01-01');
    });

    it('should use 2026 pricing by default regardless of startDate', () => {
      const result = estimateMonthly(baseInput, { startDate: '2025-12-31' });
      expect(result.meta?.version).toBe('2026-01-01');
      expect(result.meta?.effective_date).toBe('2026-01-01');
    });

    it('should use 2026 pricing for dates on or after 2026-01-01', () => {
      const result = estimateMonthly(baseInput, { startDate: '2026-01-01' });
      expect(result.meta?.version).toBe('2026-01-01');
      expect(result.meta?.effective_date).toBe('2026-01-01');
    });

    it('should respect explicit rateVersion override to current', () => {
      const result = estimateMonthly(baseInput, {
        rateVersion: 'current'
      });
      expect(result.meta?.version).toBe('current');
      expect(result.meta?.effective_date).toBe('2025-01-01');
    });
  });

  describe('Care+ - 2026 Pricing (PDF Verified)', () => {
    const carePlusInput = { ...baseInput, selectedPlan: 'care-plus' as const };
    const opts = { rateVersion: '2026-01-01' as const };

    describe('IUA $1,250', () => {
      it('should calculate 18-29 Member Only = $268', () => {
        const result = estimateMonthly({ ...carePlusInput, primaryAge: 25, benefitTier: '1250' }, opts);
        expect(result.total).toBe(268);
      });

      it('should calculate 30-49 Member+Spouse = $494', () => {
        const result = estimateMonthly({
          ...carePlusInput,
          primaryAge: 35,
          householdType: 'member-spouse',
          spouseAge: 32,
          benefitTier: '1250'
        }, opts);
        expect(result.total).toBe(494);
      });

      it('should calculate 50-64 Member+Family = $947', () => {
        const result = estimateMonthly({
          ...carePlusInput,
          primaryAge: 55,
          householdType: 'member-family',
          spouseAge: 52,
          dependentsCount: 2,
          benefitTier: '1250'
        }, opts);
        expect(result.total).toBe(947);
      });
    });

    describe('IUA $2,500', () => {
      it('should calculate 18-29 Member Only = $203', () => {
        const result = estimateMonthly({ ...carePlusInput, primaryAge: 25, benefitTier: '2500' }, opts);
        expect(result.total).toBe(203);
      });

      it('should calculate 30-49 Member+Spouse = $387', () => {
        const result = estimateMonthly({
          ...carePlusInput,
          primaryAge: 40,
          householdType: 'member-spouse',
          spouseAge: 38,
          benefitTier: '2500'
        }, opts);
        expect(result.total).toBe(387);
      });

      it('should calculate 50-64 Member+Family = $748', () => {
        const result = estimateMonthly({
          ...carePlusInput,
          primaryAge: 60,
          householdType: 'member-family',
          spouseAge: 58,
          dependentsCount: 1,
          benefitTier: '2500'
        }, opts);
        expect(result.total).toBe(748);
      });
    });

    describe('IUA $5,000', () => {
      it('should calculate 18-29 Member Only = $166', () => {
        const result = estimateMonthly({ ...carePlusInput, primaryAge: 22, benefitTier: '5000' }, opts);
        expect(result.total).toBe(166);
      });

      it('should calculate 30-49 Member+Child = $341', () => {
        const result = estimateMonthly({
          ...carePlusInput,
          primaryAge: 35,
          householdType: 'member-family',
          dependentsCount: 1,
          benefitTier: '5000'
        }, opts);
        expect(result.total).toBe(341);
      });

      it('should calculate 50-64 Member+Family = $647', () => {
        const result = estimateMonthly({
          ...carePlusInput,
          primaryAge: 62,
          householdType: 'member-family',
          spouseAge: 60,
          dependentsCount: 1,
          benefitTier: '5000'
        }, opts);
        expect(result.total).toBe(647);
      });
    });
  });

  describe('Direct - 2026 Pricing (PDF Verified)', () => {
    const directInput = { ...baseInput, selectedPlan: 'direct' as const };
    const opts = { rateVersion: '2026-01-01' as const };

    describe('IUA $1,250', () => {
      it('should calculate 18-29 Member Only = $295', () => {
        const result = estimateMonthly({ ...directInput, primaryAge: 25, benefitTier: '1250' }, opts);
        expect(result.total).toBe(295);
      });

      it('should calculate 30-49 Member+Spouse = $540', () => {
        const result = estimateMonthly({
          ...directInput,
          primaryAge: 35,
          householdType: 'member-spouse',
          spouseAge: 32,
          benefitTier: '1250'
        }, opts);
        expect(result.total).toBe(540);
      });

      it('should calculate 50-64 Member+Family = $1,006', () => {
        const result = estimateMonthly({
          ...directInput,
          primaryAge: 55,
          householdType: 'member-family',
          spouseAge: 52,
          dependentsCount: 2,
          benefitTier: '1250'
        }, opts);
        expect(result.total).toBe(1006);
      });
    });

    describe('IUA $2,500', () => {
      it('should calculate 18-29 Member Only = $229', () => {
        const result = estimateMonthly({ ...directInput, primaryAge: 25, benefitTier: '2500' }, opts);
        expect(result.total).toBe(229);
      });

      it('should calculate 30-49 Member+Spouse = $490', () => {
        const result = estimateMonthly({
          ...directInput,
          primaryAge: 40,
          householdType: 'member-spouse',
          spouseAge: 38,
          benefitTier: '2500'
        }, opts);
        expect(result.total).toBe(490);
      });

      it('should calculate 50-64 Member+Family = $855', () => {
        const result = estimateMonthly({
          ...directInput,
          primaryAge: 60,
          householdType: 'member-family',
          spouseAge: 58,
          dependentsCount: 1,
          benefitTier: '2500'
        }, opts);
        expect(result.total).toBe(855);
      });
    });

    describe('IUA $5,000', () => {
      it('should calculate 18-29 Member Only = $201', () => {
        const result = estimateMonthly({ ...directInput, primaryAge: 22, benefitTier: '5000' }, opts);
        expect(result.total).toBe(201);
      });

      it('should calculate 30-49 Member+Child = $415', () => {
        const result = estimateMonthly({
          ...directInput,
          primaryAge: 35,
          householdType: 'member-family',
          dependentsCount: 1,
          benefitTier: '5000'
        }, opts);
        expect(result.total).toBe(415);
      });

      it('should calculate 50-64 Member+Family = $707', () => {
        const result = estimateMonthly({
          ...directInput,
          primaryAge: 62,
          householdType: 'member-family',
          spouseAge: 60,
          dependentsCount: 1,
          benefitTier: '5000'
        }, opts);
        expect(result.total).toBe(707);
      });
    });
  });

  describe('Secure HSA - 2026 Pricing (PDF Verified)', () => {
    const opts = { rateVersion: '2026-01-01' as const };

    describe('IUA $1,250', () => {
      it('should calculate 18-29 Member Only = $326', () => {
        const result = estimateMonthly({ ...baseInput, primaryAge: 25, benefitTier: '1250' }, opts);
        expect(result.total).toBe(326);
      });

      it('should calculate 30-49 Member+Spouse = $603', () => {
        const result = estimateMonthly({
          ...baseInput,
          primaryAge: 35,
          householdType: 'member-spouse',
          spouseAge: 32,
          benefitTier: '1250'
        }, opts);
        expect(result.total).toBe(603);
      });

      it('should calculate 50-64 Member+Family = $1,070', () => {
        const result = estimateMonthly({
          ...baseInput,
          primaryAge: 55,
          householdType: 'member-family',
          spouseAge: 52,
          dependentsCount: 2,
          benefitTier: '1250'
        }, opts);
        expect(result.total).toBe(1070);
      });
    });

    describe('IUA $2,500', () => {
      it('should calculate 18-29 Member Only = $257', () => {
        const result = estimateMonthly({ ...baseInput, primaryAge: 25, benefitTier: '2500' }, opts);
        expect(result.total).toBe(257);
      });

      it('should calculate 30-49 Member+Spouse = $488', () => {
        const result = estimateMonthly({
          ...baseInput,
          primaryAge: 40,
          householdType: 'member-spouse',
          spouseAge: 38,
          benefitTier: '2500'
        }, opts);
        expect(result.total).toBe(488);
      });

      it('should calculate 50-64 Member+Family = $852', () => {
        const result = estimateMonthly({
          ...baseInput,
          primaryAge: 60,
          householdType: 'member-family',
          spouseAge: 58,
          dependentsCount: 1,
          benefitTier: '2500'
        }, opts);
        expect(result.total).toBe(852);
      });
    });

    describe('IUA $5,000', () => {
      it('should calculate 18-29 Member Only = $239', () => {
        const result = estimateMonthly({ ...baseInput, primaryAge: 22, benefitTier: '5000' }, opts);
        expect(result.total).toBe(239);
      });

      it('should calculate 30-49 Member+Child = $450', () => {
        const result = estimateMonthly({
          ...baseInput,
          primaryAge: 35,
          householdType: 'member-family',
          dependentsCount: 1,
          benefitTier: '5000'
        }, opts);
        expect(result.total).toBe(450);
      });

      it('should calculate 50-64 Member+Family = $753', () => {
        const result = estimateMonthly({
          ...baseInput,
          primaryAge: 62,
          householdType: 'member-family',
          spouseAge: 60,
          dependentsCount: 1,
          benefitTier: '5000'
        }, opts);
        expect(result.total).toBe(753);
      });
    });
  });

  describe('Tobacco Surcharge', () => {
    it('should return $50 household surcharge', () => {
      expect(getTobaccoSurcharge()).toBe(50);
    });

    it('should apply $50 surcharge once for primary tobacco user', () => {
      const withoutTobacco = estimateMonthly(baseInput);
      const withTobacco = estimateMonthly({ ...baseInput, primaryTobacco: true });

      expect(withTobacco.total - withoutTobacco.total).toBe(50);
      expect(withTobacco.lineItems.some(item =>
        item.description.includes('tobacco') && item.amount === 50
      )).toBe(true);
    });

    it('should apply $50 surcharge once for spouse tobacco user', () => {
      const input = {
        ...baseInput,
        householdType: 'member-spouse' as const,
        spouseAge: 32,
        spouseTobacco: true
      };

      const withoutTobacco = estimateMonthly({
        ...input,
        spouseTobacco: false
      });
      const withTobacco = estimateMonthly(input);

      expect(withTobacco.total - withoutTobacco.total).toBe(50);
    });

    it('should apply $50 surcharge once even when both members use tobacco', () => {
      const input = {
        ...baseInput,
        householdType: 'member-spouse' as const,
        spouseAge: 32,
        primaryTobacco: true,
        spouseTobacco: true
      };

      const withoutTobacco = estimateMonthly({
        ...input,
        primaryTobacco: false,
        spouseTobacco: false
      });
      const withTobacco = estimateMonthly(input);

      expect(withTobacco.total - withoutTobacco.total).toBe(50);

      const tobaccoItems = withTobacco.lineItems.filter(item =>
        item.description.includes('tobacco')
      );
      expect(tobaccoItems.length).toBe(1);
      expect(tobaccoItems[0].amount).toBe(50);
    });

    it('should apply tobacco surcharge to 2026 rates (Care+ example)', () => {
      const without = estimateMonthly(
        { ...baseInput, selectedPlan: 'care-plus', benefitTier: '1250', primaryAge: 25 },
        { rateVersion: '2026-01-01' }
      );
      const withTobacco = estimateMonthly(
        { ...baseInput, selectedPlan: 'care-plus', benefitTier: '1250', primaryAge: 25, primaryTobacco: true },
        { rateVersion: '2026-01-01' }
      );

      expect(without.total).toBe(268);
      expect(withTobacco.total).toBe(318);
    });
  });

  describe('estimateBoth()', () => {
    it('should return both current and 2026 estimates', () => {
      const both = estimateBoth(baseInput);

      expect(both.current.meta?.version).toBe('current');
      expect(both.y2026.meta?.version).toBe('2026-01-01');
    });

    it('should show pricing difference for Secure HSA', () => {
      const both = estimateBoth({ ...baseInput, benefitTier: '2500', primaryAge: 40 });

      expect(both.current.total).toBe(276);
      expect(both.y2026.total).toBe(289);
      expect(both.y2026.total - both.current.total).toBe(13);
    });

    it('should show pricing difference for Care+', () => {
      const both = estimateBoth({ ...baseInput, selectedPlan: 'care-plus', benefitTier: '2500', primaryAge: 40 });

      expect(both.current.total).toBe(205);
      expect(both.y2026.total).toBe(216);
      expect(both.y2026.total - both.current.total).toBe(11);
    });

    it('should show pricing difference for Direct', () => {
      const both = estimateBoth({ ...baseInput, selectedPlan: 'direct', benefitTier: '2500', primaryAge: 40 });

      expect(both.current.total).toBe(280);
      expect(both.y2026.total).toBe(280);
      expect(both.y2026.total - both.current.total).toBe(0);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle minimum age (18)', () => {
      const result = estimateMonthly({ ...baseInput, primaryAge: 18 });
      expect(result.total).toBeGreaterThan(0);
    });

    it('should handle maximum age (64)', () => {
      const result = estimateMonthly({ ...baseInput, primaryAge: 64 });
      expect(result.total).toBeGreaterThan(0);
    });

    it('should handle all household types', () => {
      const individual = estimateMonthly(baseInput);
      const couple = estimateMonthly({
        ...baseInput,
        householdType: 'member-spouse',
        spouseAge: 32
      });
      const family = estimateMonthly({
        ...baseInput,
        householdType: 'member-family',
        spouseAge: 32,
        dependentsCount: 2
      });

      expect(individual.total).toBeLessThan(couple.total);
      expect(couple.total).toBeLessThan(family.total);
    });
  });

  describe('Cross-Product Validation', () => {
    it('should have Direct > Care+ for same configuration (typical pattern)', () => {
      const carePlus = estimateMonthly({
        ...baseInput,
        selectedPlan: 'care-plus',
        benefitTier: '1250',
        primaryAge: 30
      }, { rateVersion: '2026-01-01' });

      const direct = estimateMonthly({
        ...baseInput,
        selectedPlan: 'direct',
        benefitTier: '1250',
        primaryAge: 30
      }, { rateVersion: '2026-01-01' });

      expect(direct.total).toBeGreaterThan(carePlus.total);
    });

    it('should have Secure HSA > Direct for same configuration (typical pattern)', () => {
      const direct = estimateMonthly({
        ...baseInput,
        selectedPlan: 'direct',
        benefitTier: '1250',
        primaryAge: 30
      }, { rateVersion: '2026-01-01' });

      const secureHSA = estimateMonthly({
        ...baseInput,
        selectedPlan: 'secure-hsa',
        benefitTier: '1250',
        primaryAge: 30
      }, { rateVersion: '2026-01-01' });

      expect(secureHSA.total).toBeGreaterThan(direct.total);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported plan', () => {
      expect(() => {
        estimateMonthly({ ...baseInput, selectedPlan: 'essentials' as any });
      }).toThrow('Unsupported plan for v2 engine');
    });

    it('should throw error for invalid IUA tier', () => {
      expect(() => {
        estimateMonthly({ ...baseInput, benefitTier: '9999' });
      }).toThrow('IUA tier not found');
    });
  });
});
