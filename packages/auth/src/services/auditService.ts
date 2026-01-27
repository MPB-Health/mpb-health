// ============================================================================
// Audit Service — Logs org-scoped audit events for compliance & security
// ============================================================================

import { supabase } from '@mpbhealth/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditEvent {
  id: string;
  org_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  meta_json: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogInput {
  orgId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
}

export interface AuditQueryOptions {
  orgId: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Pre-defined Actions
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS = {
  // Leads
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_STAGE_CHANGED: 'lead.stage_changed',
  LEAD_DELETED: 'lead.deleted',
  LEAD_EXPORTED: 'lead.exported',
  LEAD_ASSIGNED: 'lead.assigned',

  // Tasks
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',

  // Pipeline
  PIPELINE_STAGE_CREATED: 'pipeline.stage_created',
  PIPELINE_STAGE_UPDATED: 'pipeline.stage_updated',
  PIPELINE_STAGE_DELETED: 'pipeline.stage_deleted',

  // Members & Roles
  MEMBER_INVITED: 'member.invited',
  MEMBER_REMOVED: 'member.removed',
  ROLE_CHANGED: 'role.changed',
  PERMISSION_GRANTED: 'permission.granted',
  PERMISSION_REVOKED: 'permission.revoked',

  // Integration
  INTEGRATION_UPDATED: 'integration.updated',
  ZOHO_SYNC_TRIGGERED: 'integration.zoho_sync',

  // Settings
  SETTINGS_CHANGED: 'settings.changed',
  ORG_UPDATED: 'org.updated',

  // Auth
  LOGIN_SUCCESS: 'auth.login_success',
  LOGIN_FAILURE: 'auth.login_failure',
  LOGOUT: 'auth.logout',
} as const;

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/** Log an audit event */
export async function logAuditEvent(input: AuditLogInput): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('audit_events')
    .insert({
      org_id: input.orgId,
      actor_user_id: user?.id ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      before_json: input.before ?? null,
      after_json: input.after ?? null,
      meta_json: {
        ...input.meta,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      },
    });

  if (error) {
    console.error('[AuditService] Failed to log event:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** Query audit events with filters */
export async function queryAuditEvents(
  options: AuditQueryOptions
): Promise<{ events: AuditEvent[]; total: number }> {
  let query = supabase
    .from('audit_events')
    .select('*', { count: 'exact' })
    .eq('org_id', options.orgId)
    .order('created_at', { ascending: false });

  if (options.action) {
    query = query.eq('action', options.action);
  }
  if (options.entityType) {
    query = query.eq('entity_type', options.entityType);
  }
  if (options.entityId) {
    query = query.eq('entity_id', options.entityId);
  }
  if (options.actorUserId) {
    query = query.eq('actor_user_id', options.actorUserId);
  }
  if (options.from) {
    query = query.gte('created_at', options.from);
  }
  if (options.to) {
    query = query.lte('created_at', options.to);
  }

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[AuditService] Failed to query events:', error);
    return { events: [], total: 0 };
  }

  return { events: (data || []) as AuditEvent[], total: count || 0 };
}

/** Get audit trail for a specific entity */
export async function getEntityAuditTrail(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<AuditEvent[]> {
  const { events } = await queryAuditEvents({
    orgId,
    entityType,
    entityId,
    limit: 100,
  });
  return events;
}

// Bundled export
export const auditService = {
  logAuditEvent,
  queryAuditEvents,
  getEntityAuditTrail,
  AUDIT_ACTIONS,
};
