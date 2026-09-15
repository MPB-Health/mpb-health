/**
 * Concierge Portal feature catalog — the single source of truth for the
 * Management Center access matrix and the client-side `can()` gate.
 *
 * These keys mirror the string literals used by the `concierge_can()` Postgres
 * function in RLS policies (see migration 20260817120000_concierge_management_center.sql).
 * Restrictions are a DENY-LIST: a feature is allowed unless it appears in a
 * user's `concierge_user_access.denied_features`. Managers are never restricted.
 *
 * IMPORTANT: `daily_log.write`, `daily_log.edit_any`, `daily_log.delete_any`,
 * and `team.manage` are additionally enforced at the database level by RLS.
 * The remaining keys are UI-level gates only (no direct table write to guard).
 */

export interface ConciergeFeature {
  /** Stable key stored in concierge_user_access.denied_features. */
  key: string;
  /** Human label shown in the Management Center access matrix. */
  label: string;
  /** Grouping header in the access matrix. */
  group: ConciergeFeatureGroup;
  /** Short helper describing what denying this feature does. */
  description: string;
  /** True when a matching RLS policy also enforces this key server-side. */
  rlsEnforced: boolean;
}

export type ConciergeFeatureGroup =
  | 'Daily Logs'
  | 'Reports'
  | 'Team'
  | 'Data'
  | 'Tickets';

export const CONCIERGE_FEATURES: readonly ConciergeFeature[] = [
  { key: 'daily_log.write', label: 'Log entries', group: 'Daily Logs', description: 'Create new daily log entries', rlsEnforced: true },
  { key: 'daily_log.edit_any', label: "Edit others' entries", group: 'Daily Logs', description: 'Edit entries created by other reps (own entries always editable)', rlsEnforced: true },
  { key: 'daily_log.delete_any', label: "Delete others' entries", group: 'Daily Logs', description: 'Delete entries created by other reps (own entries always deletable)', rlsEnforced: true },
  { key: 'reports.weekly', label: 'Weekly report', group: 'Reports', description: 'Open the Weekly Report tab', rlsEnforced: false },
  { key: 'reports.performance', label: 'Performance', group: 'Reports', description: 'Open the Performance analytics tab', rlsEnforced: false },
  { key: 'reports.analytics', label: 'Reason analytics', group: 'Reports', description: 'Open the Reason Analytics tab', rlsEnforced: false },
  { key: 'reports.july_billing', label: 'July Billing', group: 'Reports', description: 'Open the July Billing report tab', rlsEnforced: false },
  { key: 'reports.member_issues', label: 'Member Issues', group: 'Reports', description: 'Open the Member Issues / escalations tab', rlsEnforced: false },
  { key: 'reports.share', label: 'Share report', group: 'Reports', description: 'Use the Share Report action', rlsEnforced: false },
  { key: 'team.view', label: 'View team roster', group: 'Team', description: 'Open the Team roster tab', rlsEnforced: false },
  { key: 'team.manage', label: 'Edit team roster', group: 'Team', description: 'Add, edit, or remove roster members', rlsEnforced: true },
  { key: 'data.export', label: 'Export all data', group: 'Data', description: 'Use the Export All CSV action', rlsEnforced: false },
  { key: 'data.import', label: 'Import legacy JSON', group: 'Data', description: 'Use the Import JSON / Recover-from-browser actions', rlsEnforced: false },
  { key: 'tickets.view', label: 'View tickets', group: 'Tickets', description: 'Open the Tickets page', rlsEnforced: false },
  { key: 'tickets.create', label: 'Create tickets', group: 'Tickets', description: 'Create a new support ticket', rlsEnforced: false },
] as const;

/** Ordered, de-duplicated list of feature groups for rendering the matrix. */
export const CONCIERGE_FEATURE_GROUPS: readonly ConciergeFeatureGroup[] = [
  'Daily Logs',
  'Reports',
  'Team',
  'Data',
  'Tickets',
];

/** All valid feature keys — used to validate deny-list payloads. */
export const CONCIERGE_FEATURE_KEYS: readonly string[] = CONCIERGE_FEATURES.map(
  (f) => f.key,
);

/** True when `key` is a known concierge feature. */
export function isConciergeFeatureKey(key: string): boolean {
  return CONCIERGE_FEATURE_KEYS.includes(key);
}
