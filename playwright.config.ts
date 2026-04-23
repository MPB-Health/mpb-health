import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e configuration.
 * Tests target the locally running apps (dev servers must be running before the suite runs).
 * Run: pnpm test:e2e
 *
 * CI: launch the advisor-portal dev server automatically and tear it down after the suite.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail build on CI if you accidentally left test.only in source */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter */
  reporter: process.env.CI ? 'github' : 'list',
  /* Shared settings for all projects */
  use: {
    /* Base URL: override per-project below */
    baseURL: 'https://advisor.mpb.health',
    /* Collect trace when retrying on CI */
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /**
     * CRM project — runs any spec under tests/e2e/crm/.
     * Defaults to local dev server; override with E2E_CRM_URL for staging/prod smoke.
     */
    {
      name: 'crm',
      testDir: './tests/e2e/crm',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_CRM_URL ?? 'http://localhost:5173',
      },
    },
  ],

  /* Launch advisor-portal dev server in CI. Comment out if targeting production/staging. */
  // webServer: {
  //   command: 'pnpm dev:advisor',
  //   url: 'http://localhost:5175',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
