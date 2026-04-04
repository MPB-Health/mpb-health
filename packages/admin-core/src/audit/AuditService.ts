import { supabase } from '@mpbhealth/database';
import type { AuditLog } from '../types';

export class AuditService {
  // Get audit logs with filters
  async getLogs(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }
    if (filters?.search) {
      query = query.or(
        `user_email.ilike.%${filters.search}%,action.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%`
      );
    }
    if (filters?.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('created_at', filters.toDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { logs: data || [], total: count || 0 };
  }

  // Get recent logs
  async getRecentLogs(limit = 50): Promise<AuditLog[]> {
    const { logs } = await this.getLogs({ limit });
    return logs;
  }

  // Get logs for a specific entity
  async getEntityLogs(entityType: string, entityId: string): Promise<AuditLog[]> {
    const { logs } = await this.getLogs({ entityType, entityId });
    return logs;
  }

  // Get logs for a specific user
  async getUserLogs(userId: string, limit = 100): Promise<AuditLog[]> {
    const { logs } = await this.getLogs({ userId, limit });
    return logs;
  }

  // Create audit log
  async log(
    action: string,
    entityType: string,
    entityId: string | null,
    details: {
      userId?: string;
      userEmail?: string;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        user_id: details.userId || null,
        user_email: details.userEmail || null,
        old_values: details.oldValues || null,
        new_values: details.newValues || null,
        ip_address: details.ipAddress || null,
        user_agent: details.userAgent || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Log user action
  async logUserAction(
    userId: string,
    userEmail: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: {
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    }
  ): Promise<AuditLog> {
    return this.log(action, entityType, entityId || null, {
      userId,
      userEmail,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
    });
  }

  // Common audit actions
  async logCreate(
    userId: string,
    userEmail: string,
    entityType: string,
    entityId: string,
    newValues: Record<string, unknown>
  ): Promise<AuditLog> {
    return this.logUserAction(userId, userEmail, 'create', entityType, entityId, {
      newValues,
    });
  }

  async logUpdate(
    userId: string,
    userEmail: string,
    entityType: string,
    entityId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
  ): Promise<AuditLog> {
    return this.logUserAction(userId, userEmail, 'update', entityType, entityId, {
      oldValues,
      newValues,
    });
  }

  async logDelete(
    userId: string,
    userEmail: string,
    entityType: string,
    entityId: string,
    oldValues: Record<string, unknown>
  ): Promise<AuditLog> {
    return this.logUserAction(userId, userEmail, 'delete', entityType, entityId, {
      oldValues,
    });
  }

  async logLogin(userId: string, userEmail: string): Promise<AuditLog> {
    return this.logUserAction(userId, userEmail, 'login', 'session');
  }

  async logLogout(userId: string, userEmail: string): Promise<AuditLog> {
    return this.logUserAction(userId, userEmail, 'logout', 'session');
  }

  // Get audit statistics
  async getStats(days = 30): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByEntity: Record<string, number>;
    activeUsers: number;
    dailyActivity: { date: string; count: number }[];
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { logs } = await this.getLogs({
      fromDate: fromDate.toISOString(),
      limit: 10000,
    });

    const actionsByType: Record<string, number> = {};
    const actionsByEntity: Record<string, number> = {};
    const userIds = new Set<string>();
    const dailyMap: Record<string, number> = {};

    logs.forEach((log) => {
      // Count by action type
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

      // Count by entity type
      actionsByEntity[log.entity_type] =
        (actionsByEntity[log.entity_type] || 0) + 1;

      // Unique users
      if (log.user_id) {
        userIds.add(log.user_id);
      }

      // Daily activity
      const date = log.created_at.split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });

    const dailyActivity = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalActions: logs.length,
      actionsByType,
      actionsByEntity,
      activeUsers: userIds.size,
      dailyActivity,
    };
  }

  // Export logs
  async exportLogs(filters?: {
    fromDate?: string;
    toDate?: string;
    entityType?: string;
    action?: string;
    search?: string;
  }): Promise<string> {
    const { logs } = await this.getLogs({ ...filters, limit: 10000 });

    // Convert to CSV
    const headers = [
      'Timestamp',
      'User Email',
      'Action',
      'Entity Type',
      'Entity ID',
      'IP Address',
    ];

    const rows = logs.map((log) => [
      log.created_at,
      log.user_email || '',
      log.action,
      log.entity_type,
      log.entity_id || '',
      log.ip_address || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }
}

export const auditService = new AuditService();
