import type { SupabaseClient } from '@supabase/supabase-js';
import type { FormFieldType } from '../forms/types';

export interface ProductFormField {
  id: string;
  org_id: string;
  product_id: string;
  field_type: FormFieldType;
  label: string;
  placeholder: string | null;
  required: boolean;
  options: string[];
  validation: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormFieldCreateInput {
  product_id: string;
  field_type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: Record<string, unknown>;
  sort_order?: number;
}

export interface ProductFormFieldUpdateInput {
  field_type?: FormFieldType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: Record<string, unknown>;
  sort_order?: number;
  is_active?: boolean;
}

export interface LineItemAnswer {
  id: string;
  line_item_id: string;
  field_id: string;
  value: unknown;
  created_at: string;
}

export class ProductFormService {
  constructor(private supabase: SupabaseClient) {}

  async getProductFields(productId: string): Promise<ProductFormField[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_product_form_fields')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Failed to get product fields:', error);
        return [];
      }
      return (data || []) as ProductFormField[];
    } catch (error) {
      console.error('Get product fields error:', error);
      return [];
    }
  }

  async createField(input: ProductFormFieldCreateInput): Promise<{ success: boolean; fieldId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('crm_product_form_fields')
        .insert({
          ...input,
          options: input.options || [],
          validation: input.validation || {},
          required: input.required ?? false,
        })
        .select('id')
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, fieldId: data?.id };
    } catch (error) {
      console.error('Create product field error:', error);
      return { success: false, error: 'Failed to create field' };
    }
  }

  async updateField(fieldId: string, updates: ProductFormFieldUpdateInput): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_product_form_fields')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', fieldId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Update product field error:', error);
      return { success: false, error: 'Failed to update field' };
    }
  }

  async deleteField(fieldId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_product_form_fields')
        .update({ is_active: false })
        .eq('id', fieldId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Delete product field error:', error);
      return { success: false, error: 'Failed to delete field' };
    }
  }

  async reorderFields(productId: string, fieldIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = fieldIds.map((id, index) => 
        this.supabase
          .from('crm_product_form_fields')
          .update({ sort_order: index })
          .eq('id', id)
      );
      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Reorder fields error:', error);
      return { success: false, error: 'Failed to reorder fields' };
    }
  }

  async getLineItemAnswers(lineItemId: string): Promise<LineItemAnswer[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_quote_line_item_answers')
        .select('*')
        .eq('line_item_id', lineItemId);

      if (error) {
        console.error('Failed to get line item answers:', error);
        return [];
      }
      return (data || []) as LineItemAnswer[];
    } catch (error) {
      console.error('Get line item answers error:', error);
      return [];
    }
  }

  async saveLineItemAnswers(
    lineItemId: string,
    answers: { field_id: string; value: unknown }[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.supabase
        .from('crm_quote_line_item_answers')
        .delete()
        .eq('line_item_id', lineItemId);

      if (answers.length > 0) {
        const { error } = await this.supabase
          .from('crm_quote_line_item_answers')
          .insert(answers.map(a => ({ line_item_id: lineItemId, ...a })));

        if (error) return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Save line item answers error:', error);
      return { success: false, error: 'Failed to save answers' };
    }
  }
}

export function createProductFormService(supabase: SupabaseClient): ProductFormService {
  return new ProductFormService(supabase);
}
