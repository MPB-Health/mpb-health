import { supabase } from '@mpbhealth/database';

export type CodeType = 'enrollment' | 'referral' | 'activation' | 'voucher';
export type CodeStatus = 'available' | 'assigned' | 'used' | 'expired' | 'revoked';

export interface InventoryCode {
  id: string;
  org_id: string;
  code_type: CodeType;
  code: string;
  batch_id?: string;
  status: CodeStatus;
  value?: number;
  assigned_to_user?: string;
  assigned_to_member?: string;
  assigned_at?: string;
  used_at?: string;
  expires_at?: string;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

export interface CodeBatch {
  id: string;
  org_id: string;
  name: string;
  code_type: CodeType;
  prefix?: string;
  total_codes: number;
  codes_used: number;
  value_per_code?: number;
  expires_at?: string;
  created_by: string;
  created_at: string;
}

export interface CodeCreateInput {
  code_type: CodeType;
  code: string;
  value?: number;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export interface BatchCreateInput {
  name: string;
  code_type: CodeType;
  prefix?: string;
  count: number;
  value_per_code?: number;
  expires_at?: string;
}

export interface CodeFilters {
  code_type?: CodeType;
  status?: CodeStatus;
  batch_id?: string;
  search?: string;
}

export class CodeInventoryService {
  // ========== Individual Codes ==========

  async listCodes(
    orgId: string,
    filters?: CodeFilters,
    pagination?: { page: number; pageSize: number }
  ): Promise<{ data: InventoryCode[]; total: number }> {
    let query = supabase
      .from('code_inventory')
      .select('id, org_id, code_type, code, batch_id, status, value, assigned_to_user, assigned_to_member, assigned_at, used_at, expires_at, metadata, created_by, created_at', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (filters?.code_type) query = query.eq('code_type', filters.code_type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.batch_id) query = query.eq('batch_id', filters.batch_id);
    if (filters?.search) {
      query = query.ilike('code', `%${filters.search}%`);
    }

    if (pagination) {
      const { page, pageSize } = pagination;
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    } else {
      query = query.limit(100);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  }

  async getCode(id: string): Promise<InventoryCode | null> {
    const { data, error } = await supabase
      .from('code_inventory')
      .select('id, org_id, code_type, code, batch_id, status, value, assigned_to_user, assigned_to_member, assigned_at, used_at, expires_at, metadata, created_by, created_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async getCodeByValue(code: string, codeType: CodeType, orgId: string): Promise<InventoryCode | null> {
    const { data, error } = await supabase
      .from('code_inventory')
      .select('id, org_id, code_type, code, batch_id, status, value, assigned_to_user, assigned_to_member, assigned_at, used_at, expires_at, metadata, created_by, created_at')
      .eq('org_id', orgId)
      .eq('code_type', codeType)
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createCode(input: CodeCreateInput, orgId: string, userId: string): Promise<InventoryCode> {
    const { data, error } = await supabase
      .from('code_inventory')
      .insert({
        org_id: orgId,
        code_type: input.code_type,
        code: input.code,
        value: input.value,
        expires_at: input.expires_at,
        metadata: input.metadata || {},
        created_by: userId,
      })
      .select('id, org_id, code_type, code, batch_id, status, value, assigned_to_user, assigned_to_member, assigned_at, used_at, expires_at, metadata, created_by, created_at')
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'code.create', 'code_inventory', data.id, null, data);

    return data as any;
  }

  async assignCode(
    id: string,
    assignTo: { user_id?: string; member_id?: string },
    userId: string
  ): Promise<InventoryCode> {
    const before = await this.getCode(id);

    const { data, error } = await supabase
      .from('code_inventory')
      .update({
        status: 'assigned',
        assigned_to_user: assignTo.user_id,
        assigned_to_member: assignTo.member_id,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'available')
      .select('id, org_id, code_type, code, batch_id, status, value, assigned_to_user, assigned_to_member, assigned_at, used_at, expires_at, metadata, created_by, created_at')
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'code.assign', 'code_inventory', id, before, data);

    return data as any;
  }

  async markCodeUsed(id: string, userId: string): Promise<InventoryCode> {
    const before = await this.getCode(id);

    const { data, error } = await supabase
      .from('code_inventory')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('status', ['available', 'assigned'])
      .select('id, org_id, code_type, code, batch_id, status, value, assigned_to_user, assigned_to_member, assigned_at, used_at, expires_at, metadata, created_by, created_at')
      .single();

    if (error) throw error;

    // Update batch if applicable
    if (data.batch_id) {
      await supabase.rpc('increment_batch_used', { batch_id: data.batch_id });
    }

    await this.logAudit(userId, 'code.use', 'code_inventory', id, before, data);

    return data as any;
  }

  async revokeCode(id: string, userId: string): Promise<InventoryCode> {
    const before = await this.getCode(id);

    const { data, error } = await supabase
      .from('code_inventory')
      .update({ status: 'revoked' })
      .eq('id', id)
      .select('id, org_id, code_type, code, batch_id, status, value, assigned_to_user, assigned_to_member, assigned_at, used_at, expires_at, metadata, created_by, created_at')
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'code.revoke', 'code_inventory', id, before, data);

    return data as any;
  }

  async deleteCode(id: string, userId: string): Promise<void> {
    const before = await this.getCode(id);

    const { error } = await supabase
      .from('code_inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.logAudit(userId, 'code.delete', 'code_inventory', id, before, null);
  }

  // ========== Batches ==========

  async listBatches(orgId: string): Promise<CodeBatch[]> {
    const { data, error } = await supabase
      .from('code_batches')
      .select('id, org_id, name, code_type, prefix, total_codes, codes_used, value_per_code, expires_at, created_by, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  }

  async getBatch(id: string): Promise<CodeBatch | null> {
    const { data, error } = await supabase
      .from('code_batches')
      .select('id, org_id, name, code_type, prefix, total_codes, codes_used, value_per_code, expires_at, created_by, created_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createBatch(input: BatchCreateInput, orgId: string, userId: string): Promise<{
    batch: CodeBatch;
    codes: InventoryCode[];
  }> {
    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from('code_batches')
      .insert({
        org_id: orgId,
        name: input.name,
        code_type: input.code_type,
        prefix: input.prefix,
        total_codes: input.count,
        value_per_code: input.value_per_code,
        expires_at: input.expires_at,
        created_by: userId,
      })
      .select('id, org_id, name, code_type, prefix, total_codes, codes_used, value_per_code, expires_at, created_by, created_at')
      .single();

    if (batchError) throw batchError;

    // Generate codes
    const codes: Partial<InventoryCode>[] = [];
    for (let i = 0; i < input.count; i++) {
      const code = this.generateCode(input.prefix);
      codes.push({
        org_id: orgId,
        code_type: input.code_type,
        code,
        batch_id: batch.id,
        value: input.value_per_code,
        expires_at: input.expires_at,
        metadata: {},
        created_by: userId,
      });
    }

    const { data: createdCodes, error: codesError } = await supabase
      .from('code_inventory')
      .insert(codes)
      .select('id, org_id, code_type, code, batch_id, status, value, assigned_to_user, assigned_to_member, assigned_at, used_at, expires_at, metadata, created_by, created_at');

    if (codesError) {
      // Rollback batch
      await supabase.from('code_batches').delete().eq('id', batch.id);
      throw codesError;
    }

    await this.logAudit(userId, 'batch.create', 'code_batch', batch.id, null, {
      batch,
      codes_count: createdCodes.length,
    });

    return { batch, codes: createdCodes || [] };
  }

  async deleteBatch(id: string, userId: string): Promise<void> {
    const batch = await this.getBatch(id);

    // Delete all codes in batch
    await supabase
      .from('code_inventory')
      .delete()
      .eq('batch_id', id);

    // Delete batch
    const { error } = await supabase
      .from('code_batches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.logAudit(userId, 'batch.delete', 'code_batch', id, batch, null);
  }

  // ========== Validation ==========

  async validateCode(
    code: string,
    codeType: CodeType,
    orgId: string
  ): Promise<{
    valid: boolean;
    message: string;
    code_record?: InventoryCode;
  }> {
    const codeRecord = await this.getCodeByValue(code, codeType, orgId);

    if (!codeRecord) {
      return { valid: false, message: 'Invalid code' };
    }

    if (codeRecord.status === 'used') {
      return { valid: false, message: 'This code has already been used' };
    }

    if (codeRecord.status === 'expired' || codeRecord.status === 'revoked') {
      return { valid: false, message: 'This code is no longer valid' };
    }

    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return { valid: false, message: 'This code has expired' };
    }

    return { valid: true, message: 'Code is valid', code_record: codeRecord };
  }

  // ========== Stats ==========

  async getStats(orgId: string): Promise<{
    total_codes: number;
    available: number;
    assigned: number;
    used: number;
    expired: number;
    by_type: Record<CodeType, { total: number; available: number }>;
    total_value: number;
  }> {
    const { data: codes, error } = await supabase
      .from('code_inventory')
      .select('code_type, status, value')
      .eq('org_id', orgId);

    if (error) throw error;

    const stats = {
      total_codes: codes?.length || 0,
      available: 0,
      assigned: 0,
      used: 0,
      expired: 0,
      by_type: {} as Record<CodeType, { total: number; available: number }>,
      total_value: 0,
    };

    const types: CodeType[] = ['enrollment', 'referral', 'activation', 'voucher'];
    for (const t of types) {
      stats.by_type[t] = { total: 0, available: 0 };
    }

    for (const code of codes || []) {
      const type = code.code_type as CodeType;
      stats.by_type[type].total++;

      switch (code.status) {
        case 'available':
          stats.available++;
          stats.by_type[type].available++;
          break;
        case 'assigned':
          stats.assigned++;
          break;
        case 'used':
          stats.used++;
          break;
        case 'expired':
        case 'revoked':
          stats.expired++;
          break;
      }

      if (code.value && code.status === 'available') {
        stats.total_value += code.value;
      }
    }

    return stats;
  }

  // ========== Helpers ==========

  private generateCode(prefix?: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = prefix ? `${prefix}-` : '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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

export const codeInventoryService = new CodeInventoryService();
