import { describe, it, expect } from 'vitest';
import {
  inferSelfGenerated,
  LEAD_SOURCE_SLUGS,
  SELF_GENERATED_SOURCE_SLUGS,
} from './leadTypes';

describe('LEAD_SOURCE_SLUGS', () => {
  it('covers every source documented in the 2026 spec', () => {
    // Section A: LinkedIn, Networking, Referrals, Community, Reactivation,
    // Inhouse (Round-Robin), Church Partnership, Hydration Booth, Chamber/BNI/SBDC,
    // Outside Advisors, sunbiz.org prospect.
    expect(LEAD_SOURCE_SLUGS).toEqual([
      'linkedin',
      'networking',
      'referrals',
      'community',
      'reactivation',
      'inhouse_round_robin',
      'church_partnership',
      'hydration_booth',
      'chamber_bni_sbdc',
      'outside_advisors',
      'sunbiz_prospect',
    ]);
  });

  it('marks only inhouse_round_robin as NOT self-generated', () => {
    const nonSelfGen = LEAD_SOURCE_SLUGS.filter(
      (s) => !SELF_GENERATED_SOURCE_SLUGS.includes(s)
    );
    expect(nonSelfGen).toEqual(['inhouse_round_robin']);
  });
});

describe('inferSelfGenerated', () => {
  it('returns false for null/undefined/empty', () => {
    expect(inferSelfGenerated(null)).toBe(false);
    expect(inferSelfGenerated(undefined)).toBe(false);
    expect(inferSelfGenerated('')).toBe(false);
  });

  it('returns false for inhouse_round_robin (the only inhouse source)', () => {
    expect(inferSelfGenerated('inhouse_round_robin')).toBe(false);
  });

  it('returns true for every self-generated source', () => {
    for (const s of SELF_GENERATED_SOURCE_SLUGS) {
      expect(inferSelfGenerated(s), `expected ${s} to be self-generated`).toBe(true);
    }
  });

  it('returns false for unknown slugs (so bad data never flips the split)', () => {
    expect(inferSelfGenerated('bogus')).toBe(false);
  });
});
