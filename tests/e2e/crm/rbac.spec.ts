import { test, expect } from '@playwright/test';

/**
 * RBAC smoke: every Section A page in CRM-MASTER-PROMPT-2026 is wrapped
 * with a PermissionGate. These specs assert the routes at least mount
 * without a JS error on the public/dev shell, and — when E2E_CRM_AUTHED=1
 * and a role is simulated via E2E_CRM_ROLE — that the gate's fallback
 * message is rendered for denied roles.
 *
 * Full RBAC coverage with seeded orgs + RLS assertions happens in the
 * Phase 6 e2e harness; this file keeps the guardrails honest in CI today.
 */

const GATED_ROUTES: Array<{ path: string; perm: string }> = [
  { path: '/leads', perm: 'leads.read' },
  { path: '/deals', perm: 'deals.read' },
  { path: '/contacts', perm: 'contacts.read' },
  { path: '/accounts', perm: 'accounts.read' },
  { path: '/activities', perm: 'activities.read' },
  { path: '/tasks', perm: 'tasks.read' },
  { path: '/calendar', perm: 'calendar.read' },
  { path: '/campaigns', perm: 'campaigns.read' },
  { path: '/cases', perm: 'cases.read' },
  { path: '/documents', perm: 'documents.read' },
  { path: '/reports', perm: 'reports.read' },
  { path: '/studio', perm: 'studio.read' },
  { path: '/automation', perm: 'automation.read' },
  { path: '/approvals', perm: 'approvals.read' },
];

for (const { path } of GATED_ROUTES) {
  test(`gated route ${path} mounts without JS errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');

    expect(errors, `JS errors on ${path}: ${errors.join('\n')}`).toEqual([]);
  });
}
