import { describe, it, expect } from 'vitest';
import { passwordSecurityService } from './passwordSecurityService';

// Pins the package password policy the website adopted when its fork was
// deleted (2026-07 auth consolidation, ADR-0001). Deltas over the fork:
// keyboard-pattern and common-word rejection, personal-info rejection, and
// a 0-100 strength score (the fork used 0-10).

const STRONG = 'Kw#9vTz!mQ4$Lr7p';

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    const result = passwordSecurityService.validatePassword(STRONG);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('enforces the 12-character minimum', () => {
    const result = passwordSecurityService.validatePassword('Kw#9vTz!m');
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('at least 12 characters');
  });

  it('requires all four character classes', () => {
    const result = passwordSecurityService.validatePassword('alllowercaseonly');
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('uppercase');
    expect(result.errors.join(' ')).toContain('number');
    expect(result.errors.join(' ')).toContain('special character');
  });

  it('rejects keyboard patterns (delta over the deleted fork)', () => {
    const result = passwordSecurityService.validatePassword('Qwerty!234567Zz');
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('keyboard patterns');
  });

  it('rejects common words (delta over the deleted fork)', () => {
    const result = passwordSecurityService.validatePassword('Password!2345Zz');
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('common words');
  });

  it('rejects passwords containing user info when provided', () => {
    const result = passwordSecurityService.validatePassword(
      'Xcarlos#91!Tzq4',
      undefined,
      { firstName: 'Carlos' }
    );
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('email or name');
  });
});

describe('calculatePasswordStrength', () => {
  it('returns a 0-100 score (the fork used 0-10; the meter renders score as a percent)', () => {
    const strong = passwordSecurityService.calculatePasswordStrength(STRONG);
    expect(strong.score).toBeGreaterThan(10);
    expect(strong.score).toBeLessThanOrEqual(100);
  });

  it('marks strong passwords as passed with a strong label', () => {
    const result = passwordSecurityService.calculatePasswordStrength(STRONG);
    expect(result.passed).toBe(true);
    expect(['Good', 'Strong', 'Very Strong']).toContain(result.label);
  });

  it('marks weak passwords as not passed', () => {
    const result = passwordSecurityService.calculatePasswordStrength('abc');
    expect(result.passed).toBe(false);
    expect(['Weak', 'Fair']).toContain(result.label);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('exposes a requirements checklist (used by PasswordStrengthMeter)', () => {
    const result = passwordSecurityService.calculatePasswordStrength(STRONG);
    const ids = result.requirements.map((r) => r.id);
    expect(ids).toContain('length');
    expect(ids).toContain('uppercase');
    expect(ids).toContain('lowercase');
    expect(ids).toContain('number');
    expect(ids).toContain('special');
    expect(result.requirements.every((r) => typeof r.met === 'boolean')).toBe(true);
  });
});
