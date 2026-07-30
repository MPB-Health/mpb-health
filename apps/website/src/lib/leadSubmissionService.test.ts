import { describe, expect, it } from 'vitest';
import {
  FORM_DATA_MAX_BYTES,
  FORM_DATA_SOFT_MAX_BYTES,
  sanitizeFormDataForCrm,
} from './leadSubmissionService';

function buildOversizedHeroFormData() {
  const all_plan_rates: Record<string, unknown> = {};
  for (let p = 0; p < 8; p++) {
    const tiers = Array.from({ length: 40 }, (_, i) => ({
      tierId: `tier-${p}-${i}`,
      tierLabel: `Age ${20 + i}–${24 + i} / HH size ${1 + (i % 4)}`,
      monthly: 199 + p * 10 + i,
      annual: (199 + p * 10 + i) * 12,
      deductible: 1500 + i * 100,
      iua: 2500 + i * 50,
      networkNotes: `Long advisory note for plan ${p} tier ${i} `.repeat(8),
      meta: {
        region: `region-${i}`,
        zipBands: Array.from({ length: 20 }, (_, z) => `zip-${z}-${i}`),
      },
    }));
    all_plan_rates[`plan-${p}`] = {
      planLabel: `Plan ${p} Full Coverage`,
      lowestPrice: 199 + p,
      highestPrice: 899 + p,
      flatRate: null,
      tiers,
    };
  }

  return {
    lead_type: 'Quick Rate Estimate Leads',
    quote_calc_session_id: 'test-session',
    household_type: 'member-spouse',
    state: 'TX',
    primary_age: 35,
    spouse_age: 33,
    best_match_plan: 'plan-0',
    best_match_percentage: 92,
    traditional_cost_estimate: 1200,
    all_plan_rates,
  };
}

describe('sanitizeFormDataForCrm', () => {
  it('compacts oversized all_plan_rates under the soft lean target', () => {
    const raw = buildOversizedHeroFormData();
    expect(JSON.stringify(raw).length).toBeGreaterThan(FORM_DATA_SOFT_MAX_BYTES);
    expect(JSON.stringify(raw).length).toBeGreaterThan(32_768);

    const sanitized = sanitizeFormDataForCrm(raw);
    expect(sanitized).toBeDefined();
    expect(JSON.stringify(sanitized).length).toBeLessThanOrEqual(FORM_DATA_SOFT_MAX_BYTES);
    expect(JSON.stringify(sanitized).length).toBeLessThanOrEqual(FORM_DATA_MAX_BYTES);

    const rates = sanitized!.all_plan_rates as Record<string, Record<string, unknown>>;
    expect(rates['plan-0'].planLabel).toBe('Plan 0 Full Coverage');
    expect(rates['plan-0'].lowestPrice).toBe(199);
    expect(rates['plan-0'].highestPrice).toBe(899);
    expect(rates['plan-0'].tiers).toBeUndefined();
    expect(Array.isArray(rates['plan-0'].tier_prices)).toBe(true);
    expect((rates['plan-0'].tier_prices as unknown[]).length).toBeLessThanOrEqual(12);
  });

  it('preserves already-compacted tier_prices from HeroCalculator', () => {
    const formData = {
      lead_type: 'Quick Rate Estimate Leads',
      all_plan_rates: {
        essentials: {
          planLabel: 'Essentials',
          lowestPrice: 210,
          highestPrice: 410,
          tier_count: 5,
          tier_prices: [
            { tierLabel: 'Age 30', monthly: 210 },
            { tierLabel: 'Age 40', monthly: 280 },
          ],
        },
      },
    };

    const sanitized = sanitizeFormDataForCrm(formData);
    const plan = (sanitized!.all_plan_rates as Record<string, Record<string, unknown>>)
      .essentials;
    expect(plan.planLabel).toBe('Essentials');
    expect(plan.tier_prices).toEqual([
      { tierLabel: 'Age 30', monthly: 210 },
      { tierLabel: 'Age 40', monthly: 280 },
    ]);
    expect(plan.tier_count).toBe(5);
  });

  it('returns undefined for missing form_data', () => {
    expect(sanitizeFormDataForCrm(undefined)).toBeUndefined();
  });

  it('exposes a client hard ceiling under the ARYX 640 KB (20×) RPC limit', () => {
    expect(FORM_DATA_MAX_BYTES).toBeLessThanOrEqual(655_360);
    expect(FORM_DATA_SOFT_MAX_BYTES).toBeLessThan(FORM_DATA_MAX_BYTES);
  });
});
