import { supabase } from '@mpbhealth/database';

export type DiscountType = 'percentage' | 'fixed' | 'free_months';

export interface PromoCode {
  id: string;
  org_id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  applies_to: string[]; // Product/plan IDs or ['all']
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  requires_approval: boolean;
  stackable: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeCreateInput {
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  applies_to?: string[];
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  per_user_limit?: number;
  valid_from?: string;
  valid_until?: string;
  requires_approval?: boolean;
  stackable?: boolean;
}

export interface PromoCodeUpdateInput extends Partial<Omit<PromoCodeCreateInput, 'code'>> {
  is_active?: boolean;
}

export interface PromoCodeUsage {
  id: string;
  promo_code_id: string;
  user_id?: string;
  member_id?: string;
  order_id?: string;
  discount_applied: number;
  used_at: string;
}

export interface PromoCodeFilters {
  is_active?: boolean;
  discount_type?: DiscountType;
  search?: string;
  valid_only?: boolean;
}

export class PromoCodeService {
  async list(orgId: string, filters?: PromoCodeFilters): Promise<PromoCode[]> {
    let query = supabase
      .from('promo_codes')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.discount_type) {
      query = query.eq('discount_type', filters.discount_type);
    }
    if (filters?.search) {
      query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
    }
    if (filters?.valid_only) {
      const now = new Date().toISOString();
      query = query
        .lte('valid_from', now)
        .or(`valid_until.is.null,valid_until.gte.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async get(id: string): Promise<PromoCode | null> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getByCode(code: string, orgId: string): Promise<PromoCode | null> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('org_id', orgId)
      .eq('code', code.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(input: PromoCodeCreateInput, orgId: string, userId: string): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        org_id: orgId,
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        applies_to: input.applies_to || ['all'],
        min_purchase_amount: input.min_purchase_amount,
        max_discount_amount: input.max_discount_amount,
        usage_limit: input.usage_limit,
        per_user_limit: input.per_user_limit || 1,
        valid_from: input.valid_from || new Date().toISOString(),
        valid_until: input.valid_until,
        requires_approval: input.requires_approval || false,
        stackable: input.stackable || false,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'promo_code.create', 'promo_code', data.id, null, data);

    return data;
  }

  async update(id: string, input: PromoCodeUpdateInput, userId: string): Promise<PromoCode> {
    const before = await this.get(id);

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.discount_type !== undefined) updateData.discount_type = input.discount_type;
    if (input.discount_value !== undefined) updateData.discount_value = input.discount_value;
    if (input.applies_to !== undefined) updateData.applies_to = input.applies_to;
    if (input.min_purchase_amount !== undefined) updateData.min_purchase_amount = input.min_purchase_amount;
    if (input.max_discount_amount !== undefined) updateData.max_discount_amount = input.max_discount_amount;
    if (input.usage_limit !== undefined) updateData.usage_limit = input.usage_limit;
    if (input.per_user_limit !== undefined) updateData.per_user_limit = input.per_user_limit;
    if (input.valid_from !== undefined) updateData.valid_from = input.valid_from;
    if (input.valid_until !== undefined) updateData.valid_until = input.valid_until;
    if (input.requires_approval !== undefined) updateData.requires_approval = input.requires_approval;
    if (input.stackable !== undefined) updateData.stackable = input.stackable;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data, error } = await supabase
      .from('promo_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'promo_code.update', 'promo_code', id, before, data);

    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const before = await this.get(id);

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.logAudit(userId, 'promo_code.delete', 'promo_code', id, before, null);
  }

  async validateCode(
    code: string,
    orgId: string,
    userId?: string,
    purchaseAmount?: number
  ): Promise<{
    valid: boolean;
    message: string;
    promo_code?: PromoCode;
    discount_amount?: number;
  }> {
    const promoCode = await this.getByCode(code, orgId);

    if (!promoCode) {
      return { valid: false, message: 'Invalid promo code' };
    }

    if (!promoCode.is_active) {
      return { valid: false, message: 'This promo code is no longer active' };
    }

    const now = new Date();
    if (new Date(promoCode.valid_from) > now) {
      return { valid: false, message: 'This promo code is not yet valid' };
    }

    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      return { valid: false, message: 'This promo code has expired' };
    }

    if (promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit) {
      return { valid: false, message: 'This promo code has reached its usage limit' };
    }

    // Check per-user limit if user is provided
    if (userId && promoCode.per_user_limit > 0) {
      const { count } = await supabase
        .from('promo_code_usage')
        .select('*', { count: 'exact', head: true })
        .eq('promo_code_id', promoCode.id)
        .eq('user_id', userId);

      if (count && count >= promoCode.per_user_limit) {
        return { valid: false, message: 'You have already used this promo code' };
      }
    }

    // Check minimum purchase
    if (promoCode.min_purchase_amount && purchaseAmount && purchaseAmount < promoCode.min_purchase_amount) {
      return {
        valid: false,
        message: `Minimum purchase amount of $${promoCode.min_purchase_amount} required`,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (purchaseAmount) {
      if (promoCode.discount_type === 'percentage') {
        discountAmount = (purchaseAmount * promoCode.discount_value) / 100;
      } else if (promoCode.discount_type === 'fixed') {
        discountAmount = promoCode.discount_value;
      }

      if (promoCode.max_discount_amount && discountAmount > promoCode.max_discount_amount) {
        discountAmount = promoCode.max_discount_amount;
      }
    }

    return {
      valid: true,
      message: 'Promo code is valid',
      promo_code: promoCode,
      discount_amount: Math.round(discountAmount * 100) / 100,
    };
  }

  async recordUsage(
    promoCodeId: string,
    discountApplied: number,
    userId?: string,
    memberId?: string,
    orderId?: string
  ): Promise<PromoCodeUsage> {
    const { data, error } = await supabase
      .from('promo_code_usage')
      .insert({
        promo_code_id: promoCodeId,
        user_id: userId,
        member_id: memberId,
        order_id: orderId,
        discount_applied: discountApplied,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async getUsageHistory(
    promoCodeId: string,
    pagination?: { page: number; pageSize: number }
  ): Promise<{ data: PromoCodeUsage[]; total: number }> {
    let query = supabase
      .from('promo_code_usage')
      .select('*', { count: 'exact' })
      .eq('promo_code_id', promoCodeId)
      .order('used_at', { ascending: false });

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

  async getStats(orgId: string): Promise<{
    total_codes: number;
    active_codes: number;
    total_usage: number;
    total_discount_given: number;
  }> {
    const codes = await this.list(orgId);
    const activeCodes = codes.filter((c) => c.is_active);

    const { data: usage } = await supabase
      .from('promo_code_usage')
      .select('discount_applied')
      .in('promo_code_id', codes.map((c) => c.id));

    const totalUsage = usage?.length || 0;
    const totalDiscount = usage?.reduce((sum, u) => sum + u.discount_applied, 0) || 0;

    return {
      total_codes: codes.length,
      active_codes: activeCodes.length,
      total_usage: totalUsage,
      total_discount_given: Math.round(totalDiscount * 100) / 100,
    };
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

export const promoCodeService = new PromoCodeService();
