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

  // Sales Plan 2026
  roundRobinConfig: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'roundRobinConfig'] as const,
  roundRobinAudit: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'roundRobinAudit'] as const,
  slaConfig: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'slaConfig'] as const,
  slaOverdue: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'slaOverdue'] as const,
  cadences: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'cadences'] as const,
  leadCadenceState: (orgId: string | null, leadId: string) => [...crmQueryRoot, orgId ?? 'none', 'leadCadenceState', leadId] as const,
  referralPartners: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'referralPartners'] as const,
  referralPartner: (orgId: string | null, id: string) =>
    [...crmQueryRoot, orgId ?? 'none', 'referralPartner', id] as const,
  referrals: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'referrals'] as const,
  referralsByPartner: (orgId: string | null, partnerId: string) =>
    [...crmQueryRoot, orgId ?? 'none', 'referrals', 'partner', partnerId] as const,
  referralStats: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'referralStats'] as const,
  outsideAdvisors: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'outsideAdvisors'] as const,
  outsideAdvisor: (orgId: string | null, id: string) =>
    [...crmQueryRoot, orgId ?? 'none', 'outsideAdvisor', id] as const,
  advisorProduction: (orgId: string | null, month: number, year: number) => [...crmQueryRoot, orgId ?? 'none', 'advisorProduction', month, year] as const,
  communityEvents: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'communityEvents'] as const,
  communityEvent: (orgId: string | null, id: string) =>
    [...crmQueryRoot, orgId ?? 'none', 'communityEvent', id] as const,
  communityEventStats: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'communityEventStats'] as const,
  activityTargets: (orgId: string | null) => [...crmQueryRoot, orgId ?? 'none', 'activityTargets'] as const,
  targetProgress: (orgId: string | null, repId: string) => [...crmQueryRoot, orgId ?? 'none', 'targetProgress', repId] as const,
  milestones: (orgId: string | null, year: number) => [...crmQueryRoot, orgId ?? 'none', 'milestones', year] as const,
  milestoneProgress: (orgId: string | null, year: number) => [...crmQueryRoot, orgId ?? 'none', 'milestoneProgress', year] as const,
  milestoneForecast: (orgId: string | null, year: number, quarter: number) =>
    [...crmQueryRoot, orgId ?? 'none', 'milestoneForecast', year, quarter] as const,
  reactivationStaleLeads: (orgId: string | null, minDaysInactive: number, stageKey: string) =>
    [...crmQueryRoot, orgId ?? 'none', 'reactivationStaleLeads', minDaysInactive, stageKey] as const,
  leadSourceTypes: () => [...crmQueryRoot, 'leadSourceTypes'] as const,

  // Reports 2026
  reportPerformance: (orgId: string | null, month: number, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'performance', month, year] as const,
  reportLeadsSplit: (orgId: string | null, month: number, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'leadsSplit', month, year] as const,
  reportSourceBreakdown: (orgId: string | null, month: number, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'sourceBreakdown', month, year] as const,
  reportRevenue: (orgId: string | null, month: number, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'revenue', month, year] as const,
  reportConversion: (orgId: string | null, month: number, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'conversion', month, year] as const,
  reportActivityTargets: (orgId: string | null, month: number, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'activityTargets', month, year] as const,
  reportAdvisorProduction: (orgId: string | null, month: number, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'advisorProduction', month, year] as const,
  reportAnnualLeadTrend: (orgId: string | null, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'annualLeadTrend', year] as const,
  reportAnnualRevenue: (orgId: string | null, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'annualRevenue', year] as const,
  reportAnnualSource: (orgId: string | null, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'annualSource', year] as const,
  reportAnnualConversion: (orgId: string | null, year: number) => [...crmQueryRoot, orgId ?? 'none', 'report', 'annualConversion', year] as const,
};
