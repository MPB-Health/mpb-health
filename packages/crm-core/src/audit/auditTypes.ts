export type AuditAction =
  | 'record.created'
  | 'record.updated'
  | 'record.deleted'
  | 'record.viewed'
  | 'stage.changed'
  | 'owner.changed'
  | 'attachment.uploaded'
  | 'attachment.deleted'
  | 'note.added'
  | 'email.sent'
  | 'call.logged'
  | 'meeting.logged'
  | 'task.created'
  | 'task.completed'
  | 'export.generated'
  | 'import.completed'
  | 'bulk.action';

export interface AuditEntry {
  id: string;
  org_id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown>;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditEntryWithUser extends AuditEntry {
  user?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface AuditLogInput {
  action: AuditAction | string;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AuditFilters {
  entity_type?: string;
  entity_id?: string;
  action?: string;
  user_id?: string;
  dateFrom?: string;
  dateTo?: string;
}
