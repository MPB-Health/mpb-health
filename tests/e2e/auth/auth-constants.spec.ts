/**
 * Unit tests for AUTH_URLS and AUTH_SAFE_REDIRECT_DESTINATIONS constants.
 *
 * These tests act as a compile-time + runtime guard so that any future rename
 * or restructuring of auth URLs immediately fails CI before any deployment.
 *
 * Run: pnpm test:e2e -- tests/e2e/auth/auth-constants.spec.ts
 * (or: pnpm vitest run packages/config/src/__tests__/auth-constants.test.ts if using Vitest)
 */
import { test, expect } from '@playwright/test';
import { AUTH_URLS, AUTH_SAFE_REDIRECT_DESTINATIONS } from '../../../packages/config/src/constants';

test.describe('AUTH_URLS constants integrity', () => {
  test('advisor reset URL is the canonical advisor domain', () => {
    expect(AUTH_URLS.advisor.resetPassword).toBe('https://advisor.mpb.health/reset-password');
    expect(AUTH_URLS.advisor.login).toBe('https://advisor.mpb.health/login');
    expect(AUTH_URLS.advisor.origin).toBe('https://advisor.mpb.health');
  });

  test('admin reset URL is the canonical admin domain', () => {
    expect(AUTH_URLS.admin.resetPassword).toBe('https://admin.mpb.health/reset-password');
  });

  test('member authConfirm URL is the website bridge', () => {
    expect(AUTH_URLS.member.authConfirm).toBe('https://mpb.health/auth/confirm');
  });

  test('all AUTH_URLS values are in the safe redirect allowlist', () => {
    // Every URL we might redirect to must be in the allowlist
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.advisor.resetPassword)).toBe(true);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.advisor.login)).toBe(true);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.admin.resetPassword)).toBe(true);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.admin.login)).toBe(true);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.crm.resetPassword)).toBe(true);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.crm.login)).toBe(true);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.member.resetPassword)).toBe(true);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.member.login)).toBe(true);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has(AUTH_URLS.member.authConfirm)).toBe(true);
  });

  test('allowlist rejects arbitrary external URLs (open-redirect guard)', () => {
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has('https://evil.example.com/steal')).toBe(false);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has('https://advisor.mpb.health.evil.com/reset-password')).toBe(false);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has('https://mpb.health/../evil')).toBe(false);
    expect(AUTH_SAFE_REDIRECT_DESTINATIONS.has('')).toBe(false);
  });

  test('no trailing slashes or double-slashes in any AUTH_URL', () => {
    const allUrls = [
      ...Object.values(AUTH_URLS.advisor),
      ...Object.values(AUTH_URLS.admin),
      ...Object.values(AUTH_URLS.crm),
      ...Object.values(AUTH_URLS.member),
    ];
    for (const url of allUrls) {
      expect(url).not.toMatch(/\/\/(?!)/); // no double slashes after protocol
      expect(url).not.toMatch(/\/$/);       // no trailing slash
    }
  });
});
