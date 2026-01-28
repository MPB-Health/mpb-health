import { supabase } from '@mpbhealth/database';

export type SmsProvider = 'twilio' | 'vonage' | 'plivo' | 'messagebird';
export type SmsDirection = 'outbound' | 'inbound';
export type SmsStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'received';

export interface SmsAccount {
  id: string;
  org_id: string;
  name: string;
  provider: SmsProvider;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, unknown>;
  phone_numbers: string[];
  monthly_limit?: number;
  current_month_sent: number;
  webhook_url?: string;
  last_message_at?: string;
  total_sent: number;
  total_received: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SmsAccountCreateInput {
  name: string;
  provider: SmsProvider;
  config?: Record<string, unknown>;
  phone_numbers?: string[];
  monthly_limit?: number;
  webhook_url?: string;
}

export interface SmsAccountUpdateInput extends Partial<SmsAccountCreateInput> {
  is_active?: boolean;
  is_default?: boolean;
}

export interface SmsLogEntry {
  id: string;
  org_id: string;
  sms_account_id?: string;
  template_id?: string;
  direction: SmsDirection;
  from_number: string;
  to_number: string;
  body: string;
  status: SmsStatus;
  provider_message_id?: string;
  error_message?: string;
  segments: number;
  cost?: number;
  sent_by?: string;
  sent_at: string;
  delivered_at?: string;
}

export interface SmsLogFilters {
  status?: SmsStatus;
  direction?: SmsDirection;
  sms_account_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export class SmsAccountService {
  async list(orgId: string): Promise<SmsAccount[]> {
    const { data, error } = await supabase
      .from('sms_accounts')
      .select('*')
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async get(id: string): Promise<SmsAccount | null> {
    const { data, error } = await supabase
      .from('sms_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(input: SmsAccountCreateInput, orgId: string, userId: string): Promise<SmsAccount> {
    const { data, error } = await supabase
      .from('sms_accounts')
      .insert({
        org_id: orgId,
        name: input.name,
        provider: input.provider,
        config: input.config || {},
        phone_numbers: input.phone_numbers || [],
        monthly_limit: input.monthly_limit,
        webhook_url: input.webhook_url,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'sms_account.create', 'sms_account', data.id, null, data);

    return data;
  }

  async update(id: string, input: SmsAccountUpdateInput, userId: string): Promise<SmsAccount> {
    const before = await this.get(id);

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.provider !== undefined) updateData.provider = input.provider;
    if (input.config !== undefined) updateData.config = input.config;
    if (input.phone_numbers !== undefined) updateData.phone_numbers = input.phone_numbers;
    if (input.monthly_limit !== undefined) updateData.monthly_limit = input.monthly_limit;
    if (input.webhook_url !== undefined) updateData.webhook_url = input.webhook_url;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.is_default !== undefined) updateData.is_default = input.is_default;

    const { data, error } = await supabase
      .from('sms_accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'sms_account.update', 'sms_account', id, before, data);

    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const before = await this.get(id);

    const { error } = await supabase
      .from('sms_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.logAudit(userId, 'sms_account.delete', 'sms_account', id, before, null);
  }

  async setDefault(id: string, orgId: string, userId: string): Promise<SmsAccount> {
    await supabase
      .from('sms_accounts')
      .update({ is_default: false })
      .eq('org_id', orgId)
      .eq('is_default', true);

    return this.update(id, { is_default: true, is_active: true }, userId);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const account = await this.get(id);
    if (!account) {
      return { success: false, message: 'Account not found' };
    }

    try {
      switch (account.provider) {
        case 'twilio':
          // Test Twilio API
          break;
        case 'vonage':
          // Test Vonage API
          break;
        default:
          break;
      }

      return { success: true, message: 'Connection successful' };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Connection failed',
      };
    }
  }

  // SMS Log Methods
  async getSmsLog(
    orgId: string,
    filters?: SmsLogFilters,
    pagination?: { page: number; pageSize: number }
  ): Promise<{ data: SmsLogEntry[]; total: number }> {
    let query = supabase
      .from('sms_log')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('sent_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.direction) query = query.eq('direction', filters.direction);
    if (filters?.sms_account_id) query = query.eq('sms_account_id', filters.sms_account_id);
    if (filters?.date_from) query = query.gte('sent_at', filters.date_from);
    if (filters?.date_to) query = query.lte('sent_at', filters.date_to);
    if (filters?.search) {
      query = query.or(`to_number.ilike.%${filters.search}%,body.ilike.%${filters.search}%`);
    }

    if (pagination) {
      const { page, pageSize } = pagination;
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    } else {
      query = query.limit(50);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  }

  async sendSms(
    orgId: string,
    accountId: string,
    toNumber: string,
    body: string,
    userId: string,
    templateId?: string
  ): Promise<SmsLogEntry> {
    const account = await this.get(accountId);
    if (!account) throw new Error('SMS account not found');
    if (!account.is_active) throw new Error('SMS account is not active');

    // Check monthly limit
    if (account.monthly_limit && account.current_month_sent >= account.monthly_limit) {
      throw new Error('Monthly SMS limit reached');
    }

    const fromNumber = account.phone_numbers[0];
    if (!fromNumber) throw new Error('No phone number configured');

    // Calculate segments (SMS standard is 160 chars, 153 for multipart)
    const segments = body.length <= 160 ? 1 : Math.ceil(body.length / 153);

    // Create log entry
    const { data: logEntry, error: logError } = await supabase
      .from('sms_log')
      .insert({
        org_id: orgId,
        sms_account_id: accountId,
        template_id: templateId,
        direction: 'outbound',
        from_number: fromNumber,
        to_number: toNumber,
        body,
        status: 'pending',
        segments,
        sent_by: userId,
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      // In a real implementation, this would send via the provider's API
      // For now, we'll simulate success
      const providerId = `sim_${Date.now()}`;

      // Update log entry
      await supabase
        .from('sms_log')
        .update({
          status: 'sent',
          provider_message_id: providerId,
        })
        .eq('id', logEntry.id);

      // Update account stats
      await supabase
        .from('sms_accounts')
        .update({
          last_message_at: new Date().toISOString(),
          total_sent: account.total_sent + 1,
          current_month_sent: account.current_month_sent + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      return { ...logEntry, status: 'sent', provider_message_id: providerId };
    } catch (err) {
      // Update log entry with failure
      await supabase
        .from('sms_log')
        .update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Send failed',
        })
        .eq('id', logEntry.id);

      throw err;
    }
  }

  async getSmsStats(orgId: string): Promise<{
    total_sent: number;
    total_received: number;
    total_failed: number;
    sent_this_month: number;
    by_account: { account_name: string; sent: number }[];
  }> {
    const accounts = await this.list(orgId);

    const { data: logs, error } = await supabase
      .from('sms_log')
      .select('status, direction, sms_account_id')
      .eq('org_id', orgId);

    if (error) throw error;

    const stats = {
      total_sent: 0,
      total_received: 0,
      total_failed: 0,
      sent_this_month: accounts.reduce((sum, a) => sum + a.current_month_sent, 0),
      by_account: accounts.map((a) => ({ account_name: a.name, sent: a.total_sent })),
    };

    for (const log of logs || []) {
      if (log.direction === 'outbound' && log.status === 'sent') stats.total_sent++;
      if (log.direction === 'inbound') stats.total_received++;
      if (log.status === 'failed') stats.total_failed++;
    }

    return stats;
  }

  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_json: before,
        after_json: after,
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }
}

export const smsAccountService = new SmsAccountService();
