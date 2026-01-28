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
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  action_category: string | null;
  object_type: string;
  object_id: string | null;
  object_name: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changes_summary: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogInput {
  orgId: string;
  action: string;
  objectType: string;
  objectId?: string;
  objectName?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export interface AuditQueryOptions {
  orgId: string;
  action?: string;
  actionCategory?: string;
  objectType?: string;
  objectId?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Pre-defined Actions (format: {category}.{action})
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS = {
  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_PASSWORD_RESET_REQUEST: 'auth.password_reset_request',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_MFA_ENABLED: 'auth.mfa_enabled',
  AUTH_MFA_DISABLED: 'auth.mfa_disabled',

  // User Management
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_INVITE: 'user.invite',
  USER_INVITE_ACCEPT: 'user.invite_accept',
  USER_ROLE_CHANGE: 'user.role_change',
  USER_SUSPEND: 'user.suspend',
  USER_REACTIVATE: 'user.reactivate',

  // Leads
  LEAD_CREATE: 'lead.create',
  LEAD_UPDATE: 'lead.update',
  LEAD_DELETE: 'lead.delete',
  LEAD_ASSIGN: 'lead.assign',
  LEAD_STAGE_CHANGE: 'lead.stage_change',
  LEAD_CONVERT: 'lead.convert',
  LEAD_EXPORT: 'lead.export',
  LEAD_IMPORT: 'lead.import',

  // Contacts
  CONTACT_CREATE: 'contact.create',
  CONTACT_UPDATE: 'contact.update',
  CONTACT_DELETE: 'contact.delete',
  CONTACT_MERGE: 'contact.merge',

  // Messages & Engagement
  MESSAGE_SEND: 'message.send',
  MESSAGE_RECEIVE: 'message.receive',
  MESSAGE_TEMPLATE_USE: 'message.template_use',
  MESSAGE_DRAFT_CREATE: 'message.draft_create',
  MESSAGE_DRAFT_APPROVE: 'message.draft_approve',
  MESSAGE_DRAFT_REJECT: 'message.draft_reject',

  // Sequences
  SEQUENCE_CREATE: 'sequence.create',
  SEQUENCE_UPDATE: 'sequence.update',
  SEQUENCE_DELETE: 'sequence.delete',
  SEQUENCE_ACTIVATE: 'sequence.activate',
  SEQUENCE_PAUSE: 'sequence.pause',
  SEQUENCE_ENROLL: 'sequence.enroll',
  SEQUENCE_UNENROLL: 'sequence.unenroll',
  SEQUENCE_STEP_EXECUTE: 'sequence.step_execute',

  // Templates
  TEMPLATE_CREATE: 'template.create',
  TEMPLATE_UPDATE: 'template.update',
  TEMPLATE_DELETE: 'template.delete',
  TEMPLATE_LOCK: 'template.lock',
  TEMPLATE_UNLOCK: 'template.unlock',

  // Compliance
  COMPLIANCE_APPROVAL_REQUEST: 'compliance.approval_request',
  COMPLIANCE_APPROVE: 'compliance.approve',
  COMPLIANCE_REJECT: 'compliance.reject',
  COMPLIANCE_RULE_CREATE: 'compliance.rule_create',
  COMPLIANCE_RULE_UPDATE: 'compliance.rule_update',
  COMPLIANCE_RULE_DELETE: 'compliance.rule_delete',

  // AI
  AI_DRAFT_GENERATE: 'ai.draft_generate',
  AI_DRAFT_APPROVE: 'ai.draft_approve',
  AI_DOCUMENT_UPLOAD: 'ai.document_upload',
  AI_DOCUMENT_PROCESS: 'ai.document_process',

  // Settings
  SETTINGS_UPDATE: 'settings.update',
  ORG_UPDATE: 'org.update',
  ORG_CREATE: 'org.create',

  // Billing
  BILLING_SUBSCRIPTION_CREATE: 'billing.subscription_create',
  BILLING_SUBSCRIPTION_UPDATE: 'billing.subscription_update',
  BILLING_SUBSCRIPTION_CANCEL: 'billing.subscription_cancel',
  BILLING_PAYMENT_SUCCESS: 'billing.payment_success',
  BILLING_PAYMENT_FAILED: 'billing.payment_failed',

  // Training
  TRAINING_MODULE_START: 'training.module_start',
  TRAINING_MODULE_COMPLETE: 'training.module_complete',
  TRAINING_CERTIFICATION_EARN: 'training.certification_earn',

  // Tasks
  TASK_CREATE: 'task.create',
  TASK_UPDATE: 'task.update',
  TASK_COMPLETE: 'task.complete',
  TASK_DELETE: 'task.delete',

  // Meetings
  MEETING_CREATE: 'meeting.create',
  MEETING_JOIN: 'meeting.join',
  MEETING_LEAVE: 'meeting.leave',
  MEETING_CANCEL: 'meeting.cancel',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/** Log an audit event using the database function */
export async function logAuditEvent(input: AuditLogInput): Promise<{ success: boolean; error?: string; auditId?: string }> {
  try {
    // Try using the database function first (preferred)
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_org_id: input.orgId,
      p_action: input.action,
      p_object_type: input.objectType,
      p_object_id: input.objectId ?? null,
      p_object_name: input.objectName ?? null,
      p_old_values: input.oldValues ?? null,
      p_new_values: input.newValues ?? null,
      p_metadata: {
        ...input.metadata,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      },
    });

    if (error) throw error;

    return { success: true, auditId: data };
  } catch (rpcError) {
    // Fallback to direct insert if function doesn't exist
    console.warn('[AuditService] RPC failed, using direct insert:', rpcError);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        org_id: input.orgId,
        actor_user_id: user?.id ?? null,
        action: input.action,
        action_category: input.action.split('.')[0],
        object_type: input.objectType,
        object_id: input.objectId ?? null,
        object_name: input.objectName ?? null,
        old_values: input.oldValues ?? null,
        new_values: input.newValues ?? null,
        metadata: {
          ...input.metadata,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          page_url: typeof window !== 'undefined' ? window.location.href : null,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[AuditService] Failed to log event:', error);
      return { success: false, error: error.message };
    }

    return { success: true, auditId: data?.id };
  }
}

/** Log an audit event without waiting (fire and forget) */
export function logAuditEventAsync(input: AuditLogInput): void {
  logAuditEvent(input).catch((err) => {
    console.error('[AuditService] Async log failed:', err);
  });
}

/** Query audit events with filters */
export async function queryAuditEvents(
  options: AuditQueryOptions
): Promise<{ events: AuditEvent[]; total: number }> {
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('org_id', options.orgId)
    .order('created_at', { ascending: false });

  if (options.action) {
    query = query.eq('action', options.action);
  }
  if (options.actionCategory) {
    query = query.eq('action_category', options.actionCategory);
  }
  if (options.objectType) {
    query = query.eq('object_type', options.objectType);
  }
  if (options.objectId) {
    query = query.eq('object_id', options.objectId);
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
  objectType: string,
  objectId: string,
  limit = 100
): Promise<AuditEvent[]> {
  const { events } = await queryAuditEvents({
    orgId,
    objectType,
    objectId,
    limit,
  });
  return events;
}

/** Get recent activity for a user */
export async function getUserActivityLog(
  orgId: string,
  userId: string,
  limit = 50
): Promise<AuditEvent[]> {
  const { events } = await queryAuditEvents({
    orgId,
    actorUserId: userId,
    limit,
  });
  return events;
}

/** Get activity by category */
export async function getActivityByCategory(
  orgId: string,
  category: string,
  limit = 50
): Promise<AuditEvent[]> {
  const { events } = await queryAuditEvents({
    orgId,
    actionCategory: category,
    limit,
  });
  return events;
}

// Bundled export
export const auditService = {
  logAuditEvent,
  logAuditEventAsync,
  queryAuditEvents,
  getEntityAuditTrail,
  getUserActivityLog,
  getActivityByCategory,
  AUDIT_ACTIONS,
};
