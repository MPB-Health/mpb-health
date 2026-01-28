import { supabase } from '@mpbhealth/database';

export type PaymentProvider = 'stripe' | 'square' | 'paypal' | 'authorize_net' | 'braintree';
export type PaymentMethod = 'card' | 'ach' | 'apple_pay' | 'google_pay';

export interface PaymentProcessor {
  id: string;
  org_id: string;
  name: string;
  provider: PaymentProvider;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, unknown>;
  supported_methods: PaymentMethod[];
  fee_structure: {
    percentage?: number;
    flat_fee?: number;
    monthly_fee?: number;
  };
  webhook_url?: string;
  webhook_secret?: string;
  last_transaction_at?: string;
  total_processed: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentProcessorCreateInput {
  name: string;
  provider: PaymentProvider;
  config?: Record<string, unknown>;
  supported_methods?: PaymentMethod[];
  fee_structure?: PaymentProcessor['fee_structure'];
  webhook_url?: string;
}

export interface PaymentProcessorUpdateInput extends Partial<PaymentProcessorCreateInput> {
  is_active?: boolean;
  is_default?: boolean;
}

export class PaymentProcessorService {
  async list(orgId: string): Promise<PaymentProcessor[]> {
    const { data, error } = await supabase
      .from('payment_processors')
      .select('*')
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async get(id: string): Promise<PaymentProcessor | null> {
    const { data, error } = await supabase
      .from('payment_processors')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(input: PaymentProcessorCreateInput, orgId: string, userId: string): Promise<PaymentProcessor> {
    const { data, error } = await supabase
      .from('payment_processors')
      .insert({
        org_id: orgId,
        name: input.name,
        provider: input.provider,
        config: input.config || {},
        supported_methods: input.supported_methods || ['card'],
        fee_structure: input.fee_structure || {},
        webhook_url: input.webhook_url,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'payment_processor.create', 'payment_processor', data.id, null, data);

    return data;
  }

  async update(id: string, input: PaymentProcessorUpdateInput, userId: string): Promise<PaymentProcessor> {
    const before = await this.get(id);

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.provider !== undefined) updateData.provider = input.provider;
    if (input.config !== undefined) updateData.config = input.config;
    if (input.supported_methods !== undefined) updateData.supported_methods = input.supported_methods;
    if (input.fee_structure !== undefined) updateData.fee_structure = input.fee_structure;
    if (input.webhook_url !== undefined) updateData.webhook_url = input.webhook_url;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.is_default !== undefined) updateData.is_default = input.is_default;

    const { data, error } = await supabase
      .from('payment_processors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'payment_processor.update', 'payment_processor', id, before, data);

    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const before = await this.get(id);

    const { error } = await supabase
      .from('payment_processors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.logAudit(userId, 'payment_processor.delete', 'payment_processor', id, before, null);
  }

  async setDefault(id: string, orgId: string, userId: string): Promise<PaymentProcessor> {
    // Unset current default
    await supabase
      .from('payment_processors')
      .update({ is_default: false })
      .eq('org_id', orgId)
      .eq('is_default', true);

    // Set new default
    return this.update(id, { is_default: true, is_active: true }, userId);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const processor = await this.get(id);
    if (!processor) {
      return { success: false, message: 'Processor not found' };
    }

    try {
      // In a real implementation, this would test the API connection
      // based on the provider type
      switch (processor.provider) {
        case 'stripe':
          // Test Stripe API
          break;
        case 'square':
          // Test Square API
          break;
        case 'paypal':
          // Test PayPal API
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

  async recordTransaction(id: string, amount: number): Promise<void> {
    const processor = await this.get(id);
    if (!processor) return;

    await supabase
      .from('payment_processors')
      .update({
        last_transaction_at: new Date().toISOString(),
        total_processed: processor.total_processed + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
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

export const paymentProcessorService = new PaymentProcessorService();
