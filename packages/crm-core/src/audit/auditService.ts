import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditEntry, AuditEntryWithUser, AuditLogInput, AuditFilters } from './auditTypes';

export class AuditService {
  constructor(private supabase: SupabaseClient) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      const { data: userData } = await this.supabase.auth.getUser();
      const userId = userData?.user?.id;

      await this.supabase.from('crm_audit_log').insert({
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id || null,
        changes: input.changes || {},
        metadata: input.metadata || {},
        user_id: userId || null,
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }

  async getAuditLog(
    filters: AuditFilters = {},
    limit = 50,
    offset = 0,
  ): Promise<{ entries: AuditEntry[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_audit_log')
        .select('id, org_id, user_id, action, entity_type, entity_id, changes, metadata, ip_address, user_agent, created_at', { count: 'exact' });

      if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
      if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.user_id) query = query.eq('user_id', filters.user_id);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get audit log:', error);
        return { entries: [], total: 0 };
      }

      return { entries: (data || []) as unknown as AuditEntry[], total: count || 0 };
    } catch (err) {
      console.error('Get audit log error:', err);
      return { entries: [], total: 0 };
    }
  }

  async getEntityHistory(
    entityType: string,
    entityId: string,
    limit = 20,
  ): Promise<AuditEntry[]> {
    const { entries } = await this.getAuditLog(
      { entity_type: entityType, entity_id: entityId },
      limit,
    );
    return entries;
  }
}

export function createAuditService(supabase: SupabaseClient): AuditService {
  return new AuditService(supabase);
}
