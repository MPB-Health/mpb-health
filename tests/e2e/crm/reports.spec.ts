import { test, expect } from '@playwright/test';

/**
 * Per-report smoke coverage for the Sales Plan 2026 report suite.
 *
 * These routes are behind auth; on an unauthenticated dev server we expect
 * to either see the login screen or the report shell. Either outcome proves
 * the route registered without a JS error, which is the minimum bar for CI.
 *
 * Override the auth posture locally with E2E_CRM_AUTHED=1 once session fixtures
 * land; in that mode we additionally assert the report title renders.
 */

const REPORT_ROUTES: Array<{ path: string; title: RegExp }> = [
  { path: '/reports/performance', title: /performance/i },
  { path: '/reports/revenue', title: /revenue/i },
  { path: '/reports/conversion', title: /conversion/i },
  { path: '/reports/activity', title: /activity/i },
  { path: '/reports/leads-split', title: /leads.?split/i },
  { path: '/reports/advisor-production', title: /advisor/i },
  { path: '/reports/referral-production', title: /referral/i },
  { path: '/reports/community-impact', title: /community/i },
];

for (const { path, title } of REPORT_ROUTES) {
  test(`report route ${path} renders without JS errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');

    if (process.env.E2E_CRM_AUTHED === '1') {
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 });
    }

    expect(errors, `JS errors on ${path}: ${errors.join('\n')}`).toEqual([]);
  });
}
