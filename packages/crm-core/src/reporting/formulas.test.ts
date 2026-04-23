import { describe, expect, it } from 'vitest';
import {
  avgDealSize,
  closeRatePct,
  grandTotalLeads,
  inhouseConvPct,
  overallConvPct,
  runningYTD,
  safePercent,
  selfGenConvPct,
  totalSelfGen,
} from './formulas';

describe('Sales Reports 2026 formulas', () => {
  it('safePercent returns 0 when denominator is 0', () => {
    expect(safePercent(5, 0)).toBe(0);
    expect(safePercent(0, 0)).toBe(0);
  });

  it('safePercent rounds to 1 decimal', () => {
    expect(safePercent(1, 3)).toBe(33.3);
    expect(safePercent(2, 3)).toBe(66.7);
  });

  it('closeRatePct matches the deck formula', () => {
    expect(closeRatePct(5, 20)).toBe(25);
    expect(closeRatePct(0, 20)).toBe(0);
  });

  it('avgDealSize handles zero closed sales', () => {
    expect(avgDealSize(1000, 0)).toBe(0);
    expect(avgDealSize(10_000, 4)).toBe(2500);
  });

  it('inhouse / self-gen / overall conv % all go through safePercent', () => {
    expect(inhouseConvPct(3, 10)).toBe(30);
    expect(selfGenConvPct(2, 8)).toBe(25);
    expect(overallConvPct(5, 18)).toBe(27.8);
  });

  it('totalSelfGen sums the 5 self-gen channels', () => {
    expect(
      totalSelfGen({
        linkedin: 1,
        networking: 2,
        referrals: 3,
        community: 4,
        reactivation: 5,
      }),
    ).toBe(15);
  });

  it('grandTotalLeads is self-gen + inhouse', () => {
    expect(
      grandTotalLeads({
        linkedin: 1,
        networking: 2,
        referrals: 3,
        community: 4,
        reactivation: 5,
        inhouse: 10,
      }),
    ).toBe(25);
  });

  it('runningYTD produces cumulative sums', () => {
    expect(runningYTD([1, 2, 3, 4])).toEqual([1, 3, 6, 10]);
    expect(runningYTD([])).toEqual([]);
  });
});
