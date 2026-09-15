/**
 * Data layer for the Concierge Management Center.
 *
 * Reads go through admin-allowed RPCs / RLS-protected selects; every write is
 * routed through the `concierge-manage-user` edge function (service role +
 * escalation guardrails + server-side audit logging). Never mutate auth or
 * user_roles directly from the client.
 */
import { supabase, invokeWithResolvedAuth } from '@mpbhealth/database';
import { MPB_CONCIERGE_ORG_ID } from './concierge-api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- concierge_user_access not in generated Database types yet
const db = supabase as any;

// —— Shapes ——————————————————————————————————————————————————————————————

export interface DirectoryUser {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  roles: string[];
}

export interface ConciergeAccessRow {
  userId: string;
  isManager: boolean;
  deniedFeatures: string[];
  notes: string | null;
  updatedAt: string | null;
}

export interface ConciergeAuditRow {
  id: string;
  userEmail: string | null;
  action: string;
  entityId: string | null;
  createdAt: string;
  newValues: Record<string, unknown> | null;
  oldValues: Record<string, unknown> | null;
}

// —— Reads ———————————————————————————————————————————————————————————————

/** All users with their global roles (RPC allows super_admin + admin). */
export async function fetchDirectoryUsers(): Promise<DirectoryUser[]> {
  const { data, error } = await db.rpc('get_all_users_with_roles');
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    email: String(r.email ?? ''),
    fullName: r.full_name ? String(r.full_name) : null,
    createdAt: r.user_created_at ? String(r.user_created_at) : null,
    lastSignInAt: r.last_sign_in_at ? String(r.last_sign_in_at) : null,
    roles: Array.isArray(r.roles) ? (r.roles as string[]) : [],
  }));
}

/** All concierge access rows for the MPB org (managers can read all via RLS). */
export async function fetchConciergeAccessRows(): Promise<ConciergeAccessRow[]> {
  const { data, error } = await db
    .from('concierge_user_access')
    .select('user_id, is_manager, denied_features, notes, updated_at')
    .eq('org_id', MPB_CONCIERGE_ORG_ID);
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    userId: String(r.user_id),
    isManager: r.is_manager === true,
    deniedFeatures: Array.isArray(r.denied_features) ? (r.denied_features as string[]) : [],
    notes: r.notes ? String(r.notes) : null,
    updatedAt: r.updated_at ? String(r.updated_at) : null,
  }));
}

/** Count of daily-log entries created since `sinceYmd` (YYYY-MM-DD). */
export async function countLogsSince(sinceYmd: string): Promise<number> {
  const { count, error } = await db
    .from('concierge_daily_log_entries')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', MPB_CONCIERGE_ORG_ID)
    .gte('log_date', sinceYmd);
  if (error) return 0;
  return count ?? 0;
}

/** Count of open escalations. */
export async function countOpenEscalations(): Promise<number> {
  const { count, error } = await db
    .from('concierge_escalations')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', MPB_CONCIERGE_ORG_ID)
    .eq('status', 'open');
  if (error) return 0;
  return count ?? 0;
}

/** Recent concierge management audit entries. Returns [] when the caller lacks audit read (RLS). */
export async function fetchConciergeAuditLog(limit = 50): Promise<ConciergeAuditRow[]> {
  const { data, error } = await db
    .from('audit_logs')
    .select('id, user_email, action, entity_id, created_at, new_values, old_values')
    .eq('entity_type', 'concierge_user')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    // Concierge-role managers can't read audit_logs (admin/super_admin only). Fail soft.
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    userEmail: r.user_email ? String(r.user_email) : null,
    action: String(r.action ?? ''),
    entityId: r.entity_id ? String(r.entity_id) : null,
    createdAt: String(r.created_at ?? ''),
    newValues: (r.new_values as Record<string, unknown> | null) ?? null,
    oldValues: (r.old_values as Record<string, unknown> | null) ?? null,
  }));
}

// —— Writes (all via edge function) ——————————————————————————————————————

export interface ManageResult {
  success: boolean;
  message?: string;
  error?: string;
  dry_run?: boolean;
  would?: string;
  [k: string]: unknown;
}

async function manage(body: Record<string, unknown>): Promise<ManageResult> {
  const { data, error } = await invokeWithResolvedAuth<ManageResult>('concierge-manage-user', { body });
  if (error) throw new Error(error.message);
  if (data && data.success === false) throw new Error(data.error || 'Request failed');
  return data ?? { success: true };
}

export function createConciergeUser(input: {
  email: string;
  first_name: string;
  last_name: string;
  send_invite: boolean;
  add_to_roster?: boolean;
  roster_role?: string;
  part_time?: boolean;
  dry_run?: boolean;
}): Promise<ManageResult> {
  return manage({ action: 'create', ...input });
}

export function grantConciergeRole(userId: string, role: 'concierge' | 'member', dryRun = false): Promise<ManageResult> {
  return manage({ action: 'grant_role', user_id: userId, role, dry_run: dryRun });
}

export function revokeConciergeRole(userId: string, role: 'concierge' | 'member', dryRun = false): Promise<ManageResult> {
  return manage({ action: 'revoke_role', user_id: userId, role, dry_run: dryRun });
}

export function setConciergeUserStatus(userId: string, statusAction: 'deactivate' | 'reactivate', dryRun = false): Promise<ManageResult> {
  return manage({ action: 'set_status', user_id: userId, status_action: statusAction, dry_run: dryRun });
}

export function deleteConciergeUser(userId: string, confirmEmail: string, dryRun = false): Promise<ManageResult> {
  return manage({ action: 'delete', user_id: userId, confirm_email: confirmEmail, dry_run: dryRun });
}

export function setConciergeFeatures(input: {
  userId: string;
  deniedFeatures: string[];
  isManager?: boolean;
  notes?: string | null;
  dryRun?: boolean;
}): Promise<ManageResult> {
  return manage({
    action: 'set_features',
    user_id: input.userId,
    denied_features: input.deniedFeatures,
    ...(input.isManager === undefined ? {} : { is_manager: input.isManager }),
    ...(input.notes === undefined ? {} : { notes: input.notes }),
    dry_run: input.dryRun === true,
  });
}

export function linkRosterToUser(rosterId: string, linkUserId: string | null, dryRun = false): Promise<ManageResult> {
  return manage({ action: 'link_roster', roster_id: rosterId, link_user_id: linkUserId, dry_run: dryRun });
}
