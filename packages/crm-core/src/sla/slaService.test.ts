import { describe, expect, it } from 'vitest';
import { SLAService } from './slaService';

// Minimal Supabase stub — we only test the private business-hour calculator
// via a thin proxy, so the client is never actually invoked.
const stubSupabase = {} as unknown as never;

// Expose the private method for tests. The SQL function
// `crm_calc_business_hour_deadline` is the source of truth; this test pins
// the JS fallback to the same local-clock logic so both agree within 1 minute.
class ExposedSLA extends SLAService {
  public deadline(
    start: Date,
    hours: number,
    bhStart: string,
    bhEnd: string,
    days: number[],
    tz: string,
  ) {
    return (this as unknown as {
      calculateBusinessHourDeadline: (
        s: Date, h: number, a: string, b: string, d: number[], t: string,
      ) => Date;
    }).calculateBusinessHourDeadline(start, hours, bhStart, bhEnd, days, tz);
  }
}

const svc = new ExposedSLA(stubSupabase as never, '00000000-0000-0000-0000-000000000000');

describe('SLAService business-hour deadline', () => {
  it('adds hours within a single business day', () => {
    // Local wall clock: the JS fallback uses Date#getDay/getHours, not the tz arg.
    const start = new Date(2026, 0, 5, 14, 0, 0); // Monday 2pm local
    const out = svc.deadline(start, 2, '09:00', '17:00', [1, 2, 3, 4, 5], 'America/New_York');
    expect(out.getFullYear()).toBe(2026);
    expect(out.getMonth()).toBe(0);
    expect(out.getDate()).toBe(5);
    expect(out.getHours()).toBe(16);
    expect(out.getMinutes()).toBe(0);
  });

  it('rolls over an evening start into the next business morning', () => {
    const start = new Date(2026, 0, 5, 18, 30, 0); // Monday 6:30pm local
    const out = svc.deadline(start, 1, '09:00', '17:00', [1, 2, 3, 4, 5], 'America/New_York');
    expect(out.getDay()).toBe(2); // Tuesday
    expect(out.getHours()).toBe(10);
    expect(out.getMinutes()).toBe(0);
  });

  it('skips weekends when computing a 24 business-hour deadline', () => {
    const start = new Date(2026, 0, 2, 10, 0, 0); // Friday 10am local
    const out = svc.deadline(start, 24, '09:00', '17:00', [1, 2, 3, 4, 5], 'America/New_York');
    // 24 business hours = 3 business days of 8h each. Friday 10am + 24bh:
    //   Fri: 10-17 = 7h remaining 17h
    //   Mon: 9-17  = 8h remaining 9h
    //   Tue: 9-17  = 8h remaining 1h
    //   Wed: 9-10  lands at 10:00
    expect(out.getDay()).toBe(3); // Wednesday
    expect(out.getHours()).toBe(10);
  });

  it('falls back to wall-clock when business hour window is zero', () => {
    const start = new Date(2026, 0, 5, 14, 0, 0);
    const out = svc.deadline(start, 2, '09:00', '09:00', [1, 2, 3, 4, 5], 'America/New_York');
    expect(out.getTime() - start.getTime()).toBe(2 * 60 * 60 * 1000);
  });
});
