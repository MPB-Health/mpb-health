import { test, expect } from '@playwright/test';

/**
 * Optional smoke: set E2E_CRM_URL to a running CRM dev server (e.g. http://localhost:5173).
 * Does not log in — asserts shell or redirect only when URL is reachable.
 */
const base = process.env.E2E_CRM_URL;

test.describe('CRM shell (optional)', () => {
  test.skip(!base, 'Set E2E_CRM_URL to run (e.g. http://localhost:5173)');

  test('loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base!, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(errors, `page errors: ${errors.join('; ')}`).toHaveLength(0);
  });
});
