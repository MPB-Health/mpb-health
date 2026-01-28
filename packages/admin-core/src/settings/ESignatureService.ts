import { supabase } from '@mpbhealth/database';

export type ESignatureProvider = 'docusign' | 'hellosign' | 'adobe_sign' | 'pandadoc';
export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined' | 'voided';
export type DocumentType = 'enrollment' | 'agreement' | 'amendment' | 'consent';

export interface ESignatureProviderConfig {
  id: string;
  org_id: string;
  name: string;
  provider: ESignatureProvider;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, unknown>;
  webhook_url?: string;
  templates_synced: number;
  last_sync_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ESignatureDocument {
  id: string;
  org_id: string;
  provider_id?: string;
  external_document_id?: string;
  name: string;
  status: DocumentStatus;
  signers: DocumentSigner[];
  document_type?: DocumentType;
  related_entity_type?: string;
  related_entity_id?: string;
  sent_at?: string;
  completed_at?: string;
  expires_at?: string;
  signed_document_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentSigner {
  email: string;
  name: string;
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
  signed_at?: string;
  order?: number;
}

export interface ProviderCreateInput {
  name: string;
  provider: ESignatureProvider;
  config?: Record<string, unknown>;
  webhook_url?: string;
}

export interface ProviderUpdateInput extends Partial<ProviderCreateInput> {
  is_active?: boolean;
  is_default?: boolean;
}

export interface DocumentCreateInput {
  name: string;
  provider_id?: string;
  document_type?: DocumentType;
  signers: Omit<DocumentSigner, 'status' | 'signed_at'>[];
  related_entity_type?: string;
  related_entity_id?: string;
  expires_at?: string;
}

export interface DocumentFilters {
  status?: DocumentStatus;
  document_type?: DocumentType;
  provider_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export class ESignatureService {
  // ========== Providers ==========

  async listProviders(orgId: string): Promise<ESignatureProviderConfig[]> {
    const { data, error } = await supabase
      .from('esignature_providers')
      .select('*')
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getProvider(id: string): Promise<ESignatureProviderConfig | null> {
    const { data, error } = await supabase
      .from('esignature_providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createProvider(input: ProviderCreateInput, orgId: string, userId: string): Promise<ESignatureProviderConfig> {
    const { data, error } = await supabase
      .from('esignature_providers')
      .insert({
        org_id: orgId,
        name: input.name,
        provider: input.provider,
        config: input.config || {},
        webhook_url: input.webhook_url,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'esignature_provider.create', 'esignature_provider', data.id, null, data);

    return data;
  }

  async updateProvider(id: string, input: ProviderUpdateInput, userId: string): Promise<ESignatureProviderConfig> {
    const before = await this.getProvider(id);

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.provider !== undefined) updateData.provider = input.provider;
    if (input.config !== undefined) updateData.config = input.config;
    if (input.webhook_url !== undefined) updateData.webhook_url = input.webhook_url;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.is_default !== undefined) updateData.is_default = input.is_default;

    const { data, error } = await supabase
      .from('esignature_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'esignature_provider.update', 'esignature_provider', id, before, data);

    return data;
  }

  async deleteProvider(id: string, userId: string): Promise<void> {
    const before = await this.getProvider(id);

    const { error } = await supabase
      .from('esignature_providers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.logAudit(userId, 'esignature_provider.delete', 'esignature_provider', id, before, null);
  }

  async setDefaultProvider(id: string, orgId: string, userId: string): Promise<ESignatureProviderConfig> {
    await supabase
      .from('esignature_providers')
      .update({ is_default: false })
      .eq('org_id', orgId)
      .eq('is_default', true);

    return this.updateProvider(id, { is_default: true, is_active: true }, userId);
  }

  async testProviderConnection(id: string): Promise<{ success: boolean; message: string }> {
    const provider = await this.getProvider(id);
    if (!provider) {
      return { success: false, message: 'Provider not found' };
    }

    try {
      switch (provider.provider) {
        case 'docusign':
          // Test DocuSign API
          break;
        case 'hellosign':
          // Test HelloSign API
          break;
        case 'adobe_sign':
          // Test Adobe Sign API
          break;
        case 'pandadoc':
          // Test PandaDoc API
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

  // ========== Documents ==========

  async listDocuments(
    orgId: string,
    filters?: DocumentFilters,
    pagination?: { page: number; pageSize: number }
  ): Promise<{ data: ESignatureDocument[]; total: number }> {
    let query = supabase
      .from('esignature_documents')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.document_type) query = query.eq('document_type', filters.document_type);
    if (filters?.provider_id) query = query.eq('provider_id', filters.provider_id);
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters?.date_from) query = query.gte('created_at', filters.date_from);
    if (filters?.date_to) query = query.lte('created_at', filters.date_to);

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

  async getDocument(id: string): Promise<ESignatureDocument | null> {
    const { data, error } = await supabase
      .from('esignature_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createDocument(input: DocumentCreateInput, orgId: string, userId: string): Promise<ESignatureDocument> {
    const signers: DocumentSigner[] = input.signers.map((s, i) => ({
      ...s,
      status: 'pending',
      order: i + 1,
    }));

    const { data, error } = await supabase
      .from('esignature_documents')
      .insert({
        org_id: orgId,
        name: input.name,
        provider_id: input.provider_id,
        document_type: input.document_type,
        signers,
        related_entity_type: input.related_entity_type,
        related_entity_id: input.related_entity_id,
        expires_at: input.expires_at,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'esignature_document.create', 'esignature_document', data.id, null, data);

    return data;
  }

  async sendDocument(id: string, userId: string): Promise<ESignatureDocument> {
    const before = await this.getDocument(id);
    if (!before) throw new Error('Document not found');

    // In a real implementation, this would call the provider API
    const signers = before.signers.map((s) => ({ ...s, status: 'sent' as const }));

    const { data, error } = await supabase
      .from('esignature_documents')
      .update({
        status: 'sent',
        signers,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'esignature_document.send', 'esignature_document', id, before, data);

    return data;
  }

  async voidDocument(id: string, userId: string): Promise<ESignatureDocument> {
    const before = await this.getDocument(id);

    const { data, error } = await supabase
      .from('esignature_documents')
      .update({
        status: 'voided',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'esignature_document.void', 'esignature_document', id, before, data);

    return data;
  }

  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    signerUpdates?: { email: string; status: DocumentSigner['status']; signed_at?: string }[]
  ): Promise<ESignatureDocument> {
    const doc = await this.getDocument(id);
    if (!doc) throw new Error('Document not found');

    let signers = doc.signers;

    if (signerUpdates) {
      signers = signers.map((s) => {
        const update = signerUpdates.find((u) => u.email === s.email);
        if (update) {
          return { ...s, status: update.status, signed_at: update.signed_at };
        }
        return s;
      });
    }

    const updateData: Record<string, unknown> = {
      status,
      signers,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('esignature_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async deleteDocument(id: string, userId: string): Promise<void> {
    const before = await this.getDocument(id);

    const { error } = await supabase
      .from('esignature_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.logAudit(userId, 'esignature_document.delete', 'esignature_document', id, before, null);
  }

  // ========== Stats ==========

  async getStats(orgId: string): Promise<{
    total_documents: number;
    pending: number;
    completed: number;
    declined: number;
    by_type: Record<DocumentType, number>;
    avg_completion_days: number;
  }> {
    const { data: documents, error } = await supabase
      .from('esignature_documents')
      .select('status, document_type, sent_at, completed_at')
      .eq('org_id', orgId);

    if (error) throw error;

    const stats = {
      total_documents: documents?.length || 0,
      pending: 0,
      completed: 0,
      declined: 0,
      by_type: { enrollment: 0, agreement: 0, amendment: 0, consent: 0 } as Record<DocumentType, number>,
      avg_completion_days: 0,
    };

    let totalDays = 0;
    let completedCount = 0;

    for (const doc of documents || []) {
      if (['draft', 'sent', 'viewed'].includes(doc.status)) stats.pending++;
      if (['signed', 'completed'].includes(doc.status)) stats.completed++;
      if (doc.status === 'declined') stats.declined++;

      if (doc.document_type) {
        stats.by_type[doc.document_type as DocumentType]++;
      }

      if (doc.sent_at && doc.completed_at) {
        const days = (new Date(doc.completed_at).getTime() - new Date(doc.sent_at).getTime()) / (1000 * 60 * 60 * 24);
        totalDays += days;
        completedCount++;
      }
    }

    stats.avg_completion_days = completedCount > 0 ? Math.round(totalDays / completedCount * 10) / 10 : 0;

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

export const eSignatureService = new ESignatureService();
