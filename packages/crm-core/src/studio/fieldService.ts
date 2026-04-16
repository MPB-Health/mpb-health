import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  StudioField,
  FieldCreateInput,
  FieldUpdateInput,
} from './studioTypes';

export class FieldService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all fields for a module
   */
  async getFields(moduleId: string): Promise<StudioField[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_fields')
        .select('id, org_id, module_id, label, api_name, field_type, is_required, is_unique, is_searchable, is_filterable, default_value, help_text, placeholder, config, sort_order, is_system, is_name_field, created_by, created_at, updated_at')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to get fields:', error);
        return [];
      }

      return data as unknown as StudioField[];
    } catch (error) {
      console.error('Get fields error:', error);
      return [];
    }
  }

  /**
   * Get a single field by ID
   */
  async getField(id: string): Promise<StudioField | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_fields')
        .select('id, org_id, module_id, label, api_name, field_type, is_required, is_unique, is_searchable, is_filterable, default_value, help_text, placeholder, config, sort_order, is_system, is_name_field, created_by, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get field:', error);
        return null;
      }

      return data as unknown as StudioField;
    } catch (error) {
      console.error('Get field error:', error);
      return null;
    }
  }

  /**
   * Create a new field
   */
  async createField(
    input: FieldCreateInput
  ): Promise<{ success: boolean; fieldId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Validate api_name format
      if (!/^[a-z][a-z0-9_]*$/.test(input.api_name)) {
        return {
          success: false,
          error: 'API name must start with a letter and contain only lowercase letters, numbers, and underscores',
        };
      }

      // Reserved field names (system columns)
      const reservedNames = ['id', 'org_id', 'name', 'owner_id', 'created_by', 'created_at', 'updated_at'];
      if (reservedNames.includes(input.api_name)) {
        return { success: false, error: `"${input.api_name}" is a reserved field name` };
      }

      // Get module to find org_id and for table operations
      const { data: module, error: moduleError } = await this.supabase
        .from('crm_studio_modules')
        .select('id, org_id, api_name')
        .eq('id', input.module_id)
        .single();

      if (moduleError || !module) {
        return { success: false, error: 'Module not found' };
      }

      // Get max sort order for this module
      const { data: maxSortData } = await this.supabase
        .from('crm_studio_fields')
        .select('sort_order')
        .eq('module_id', input.module_id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const nextSortOrder = (maxSortData?.sort_order ?? -1) + 1;

      // Create field record
      const { data, error } = await this.supabase
        .from('crm_studio_fields')
        .insert({
          org_id: module.org_id,
          module_id: input.module_id,
          label: input.label,
          api_name: input.api_name,
          field_type: input.field_type,
          is_required: input.is_required ?? false,
          is_unique: input.is_unique ?? false,
          is_searchable: input.is_searchable ?? true,
          is_filterable: input.is_filterable ?? true,
          default_value: input.default_value || null,
          help_text: input.help_text || null,
          placeholder: input.placeholder || null,
          config: input.config || {},
          sort_order: input.sort_order ?? nextSortOrder,
          is_system: false,
          is_name_field: false,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'A field with this API name already exists in this module' };
        }
        return { success: false, error: error.message };
      }

      // Add column to the custom module table
      const { error: columnError } = await this.supabase.rpc('add_custom_module_column', {
        p_org_id: module.org_id,
        p_api_name: module.api_name,
        p_field_api_name: input.api_name,
        p_field_type: input.field_type,
      });

      if (columnError) {
        console.error('Failed to add column to table:', columnError);
        // Don't fail the whole operation - field metadata is created
      }

      return { success: true, fieldId: data?.id };
    } catch (error) {
      console.error('Create field error:', error);
      return { success: false, error: 'Failed to create field' };
    }
  }

  /**
   * Update a field
   */
  async updateField(
    id: string,
    updates: FieldUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Don't allow updating system fields
      const existingField = await this.getField(id);
      if (!existingField) {
        return { success: false, error: 'Field not found' };
      }
      if (existingField.is_system) {
        return { success: false, error: 'Cannot update system fields' };
      }

      const { error } = await this.supabase
        .from('crm_studio_fields')
        .update(updates)
        .eq('id', id)
        .eq('is_system', false);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update field error:', error);
      return { success: false, error: 'Failed to update field' };
    }
  }

  /**
   * Delete a field
   */
  async deleteField(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if it's a system field
      const field = await this.getField(id);
      if (!field) {
        return { success: false, error: 'Field not found' };
      }
      if (field.is_system) {
        return { success: false, error: 'Cannot delete system fields' };
      }
      if (field.is_name_field) {
        return { success: false, error: 'Cannot delete the name field' };
      }

      // Note: We don't drop the column from the table to preserve data
      // The column will just be unused

      const { error } = await this.supabase
        .from('crm_studio_fields')
        .delete()
        .eq('id', id)
        .eq('is_system', false);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete field error:', error);
      return { success: false, error: 'Failed to delete field' };
    }
  }

  /**
   * Reorder fields
   */
  async reorderFields(
    moduleId: string,
    fieldIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update sort_order for each field
      const updates = fieldIds.map((fieldId, index) => ({
        id: fieldId,
        sort_order: index,
      }));

      for (const update of updates) {
        const { error } = await this.supabase
          .from('crm_studio_fields')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('module_id', moduleId);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reorder fields error:', error);
      return { success: false, error: 'Failed to reorder fields' };
    }
  }

  /**
   * Create system fields for a new module (name, owner, etc.)
   */
  async createSystemFields(moduleId: string, orgId: string): Promise<void> {
    const { data: user } = await this.supabase.auth.getUser();
    const userId = user.user?.id;

    // These are metadata representations of the built-in columns
    const systemFields = [
      {
        org_id: orgId,
        module_id: moduleId,
        label: 'Name',
        api_name: 'name',
        field_type: 'text',
        is_required: true,
        is_searchable: true,
        is_filterable: true,
        sort_order: 0,
        is_system: true,
        is_name_field: true,
        created_by: userId,
      },
      {
        org_id: orgId,
        module_id: moduleId,
        label: 'Owner',
        api_name: 'owner_id',
        field_type: 'lookup',
        is_required: false,
        is_searchable: false,
        is_filterable: true,
        config: { target_module: 'users', display_field: 'email' },
        sort_order: 1,
        is_system: true,
        is_name_field: false,
        created_by: userId,
      },
    ];

    await this.supabase.from('crm_studio_fields').insert(systemFields);
  }
}

// Factory function
export function createFieldService(supabase: SupabaseClient): FieldService {
  return new FieldService(supabase);
}
