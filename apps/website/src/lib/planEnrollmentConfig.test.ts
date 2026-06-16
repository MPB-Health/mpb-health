import { describe, expect, it } from 'vitest';
import {
  isAllowedEnrollmentEmbedUrl,
  isAllowedEnrollmentMessageOrigin,
  PLAN_ENROLLMENT_CONFIGS,
} from './planEnrollmentConfig';

describe('planEnrollmentConfig security', () => {
  it('allows only HTTPS enrollmpb.com embed URLs', () => {
    for (const plan of PLAN_ENROLLMENT_CONFIGS) {
      expect(isAllowedEnrollmentEmbedUrl(plan.embedUrl)).toBe(true);
    }

    expect(isAllowedEnrollmentEmbedUrl('http://essentials.enrollmpb.com/')).toBe(false);
    expect(isAllowedEnrollmentEmbedUrl('https://evil.com/')).toBe(false);
    expect(isAllowedEnrollmentEmbedUrl('javascript:alert(1)')).toBe(false);
  });

  it('allows postMessage only from enrollmpb.com origins', () => {
    expect(isAllowedEnrollmentMessageOrigin('https://essentials.enrollmpb.com')).toBe(true);
    expect(isAllowedEnrollmentMessageOrigin('https://mpb.health')).toBe(false);
    expect(isAllowedEnrollmentMessageOrigin('http://essentials.enrollmpb.com')).toBe(false);
  });
});
