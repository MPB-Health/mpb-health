import { useOrg } from '../contexts/OrgContext';

/**
 * Guards the XLSX export action on every 2026 report page.
 *
 * `reports.export` is seeded by the Phase 1 migration onto owner/admin/manager
 * roles. The check also short-circuits for owner/admin so export keeps working
 * if the RBAC cache hasn't hydrated yet.
 */
export function useCanExportReports(): boolean {
  const { can, orgRole } = useOrg();
  if (orgRole === 'owner' || orgRole === 'admin') return true;
  return can('reports.export') || can('reports.read');
}
