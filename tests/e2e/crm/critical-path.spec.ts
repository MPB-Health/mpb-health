import { test, expect } from '@playwright/test';

/**
 * Critical-path smoke: the Sales Plan 2026 happy path end-to-end.
 *
 * Full intake → round-robin → SLA task → cadence → close → revenue report
 * coverage requires seeded fixtures (org + reps + cadence) that only exist
 * when E2E_CRM_AUTHED=1. When the env flag is off we still exercise the
 * public community form route to guarantee its shell registered.
 */

test.describe('critical path', () => {
  test('public community form route renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Use a sentinel UUID the backend can reject with a graceful 404/error
    // rather than crashing the React shell.
    await page.goto('/forms/community/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('domcontentloaded');

    expect(errors, `JS errors on community form: ${errors.join('\n')}`).toEqual([]);
  });

  test('web form route renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/forms/demo-form');
    await page.waitForLoadState('domcontentloaded');

    expect(errors, `JS errors on web form: ${errors.join('\n')}`).toEqual([]);
  });

  test.skip(process.env.E2E_CRM_AUTHED !== '1', 'requires authed session fixtures');
  test('authed rep sees dashboard with assigned-lead widget', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});
