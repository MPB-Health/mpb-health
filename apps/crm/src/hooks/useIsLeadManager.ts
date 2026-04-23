import { useOrg } from '../contexts/OrgContext';

/**
 * Lead Manager check.
 *
 * The "Lead Manager" concept (Sales Plan 2026, Section A) is modeled as a
 * permission bundle (`lead_manager`) seeded by migration
 * `20260423100000_crm_2026_phase1_foundations.sql`. Holding this permission
 * grants: round-robin config, distribution overrides, global (cross-rep)
 * reports, and SLA escalation routing.
 *
 * Owner / admin / manager roles receive it by default in seeded orgs, but
 * operators can revoke or grant it per org.
 */
export function useIsLeadManager(): boolean {
  const { can, orgRole } = useOrg();
  // Owner + admin always act as Lead Manager even when permissions query fails
  // (mirrors the PermissionGate fallback behavior).
  if (orgRole === 'owner' || orgRole === 'admin') return true;
  return can('lead_manager');
}
