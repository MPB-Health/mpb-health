/**
 * Stable TanStack Query keys for CRM server state.
 * Prefix with org id so org switches never serve stale cache.
 */

export const crmQueryRoot = ['crm'] as const;

export const crmQueryKeys = {
  root: crmQueryRoot,
  /** Invalidate all CRM queries for an org (e.g. after org switch). */
  org: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none'] as const,
  dashboard: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'dashboard'] as const,
  recentLeads: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'recentLeads'] as const,
  tasks: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'tasks'] as const,
  calendar: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'calendar'] as const,
};
