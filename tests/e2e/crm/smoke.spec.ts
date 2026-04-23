import { test, expect } from '@playwright/test';

/**
 * CRM Playwright smoke placeholder.
 *
 * Real specs for the critical path (intake → round-robin → SLA task → cadence → close → revenue report),
 * per-report smokes, and RBAC cross-rep denial land in Phase 6 of UPGRADE-PLAN-2026.md.
 *
 * Run just this project:
 *   pnpm test:e2e --project=crm
 *
 * Point at staging/prod:
 *   E2E_CRM_URL=https://crm.mympb.com pnpm test:e2e --project=crm
 */

test.describe('CRM shell', () => {
  test('renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');

    await expect(page).toHaveTitle(/mpb|crm/i);
    expect(errors, `JS errors on root: ${errors.join('\n')}`).toEqual([]);
  });
});
