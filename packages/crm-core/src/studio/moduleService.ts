import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  StudioModule,
  StudioModuleWithRelations,
  ModuleCreateInput,
  ModuleUpdateInput,
  ModuleFilters,
  FieldCreateInput,
} from './studioTypes';

export class ModuleService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all modules for the organization
   */
  async getModules(filters: ModuleFilters = {}): Promise<StudioModule[]> {
    try {
      let query = this.supabase
        .from('crm_studio_modules')
        .select('id, org_id, name, api_name, plural_name, singular_name, description, icon, color, is_active, is_system, allow_activities, allow_notes, allow_attachments, created_by, created_at, updated_at')
        .order('name', { ascending: true });

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.is_system !== undefined) {
        query = query.eq('is_system', filters.is_system);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,api_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get modules:', error);
        return [];
      }

      return data as unknown as StudioModule[];
    } catch (error) {
      console.error('Get modules error:', error);
      return [];
    }
  }

  /**
   * Get a single module by ID with relations
   */
  async getModule(id: string): Promise<StudioModuleWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_modules')
        .select(`
        id, org_id, name, api_name, plural_name, singular_name, description, icon, color, is_active, is_system, allow_activities, allow_notes, allow_attachments, created_by, created_at, updated_at,
          fields:crm_studio_fields(id, org_id, module_id, label, api_name, field_type, is_required, is_unique, is_searchable, is_filterable, default_value, help_text, placeholder, config, sort_order, is_system, is_name_field, created_by, created_at, updated_at),
          layouts:crm_studio_layouts(id, org_id, module_id, name, api_name, layout_type, sections, is_default, is_active, created_by, created_at, updated_at),
          views:crm_studio_views(id, org_id, module_id, name, columns, filters, sort_field_id, sort_direction, visibility, owner_id, is_default, is_active, created_by, created_at, updated_at),
          validation_rules:crm_studio_validation_rules(id, org_id, module_id, name, description, conditions, condition_logic, error_message, error_field_id, run_on_create, run_on_update, is_active, created_by, created_at, updated_at)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get module:', error);
        return null;
      }

      return data as unknown as StudioModuleWithRelations;
    } catch (error) {
      console.error('Get module error:', error);
      return null;
    }
  }

  /**
   * Get a module by API name
   */
  async getModuleByApiName(apiName: string): Promise<StudioModuleWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_modules')
        .select(`
        id, org_id, name, api_name, plural_name, singular_name, description, icon, color, is_active, is_system, allow_activities, allow_notes, allow_attachments, created_by, created_at, updated_at,
          fields:crm_studio_fields(id, org_id, module_id, label, api_name, field_type, is_required, is_unique, is_searchable, is_filterable, default_value, help_text, placeholder, config, sort_order, is_system, is_name_field, created_by, created_at, updated_at)
        `)
        .eq('api_name', apiName)
        .single();

      if (error) {
        console.error('Failed to get module by api name:', error);
        return null;
      }

      return data as unknown as StudioModuleWithRelations;
    } catch (error) {
      console.error('Get module by api name error:', error);
      return null;
    }
  }

  /**
   * Create a new module
   */
  async createModule(
    input: ModuleCreateInput
  ): Promise<{ success: boolean; moduleId?: string; error?: string }> {
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

      const { data, error } = await this.supabase
        .from('crm_studio_modules')
        .insert({
          ...input,
          icon: input.icon || 'FileText',
          color: input.color || 'blue',
          allow_activities: input.allow_activities ?? true,
          allow_notes: input.allow_notes ?? true,
          allow_attachments: input.allow_attachments ?? true,
          is_active: true,
          is_system: false,
          created_by: user.user.id,
        })
        .select('id, org_id, api_name')
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'A module with this API name already exists' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, moduleId: data?.id };
    } catch (error) {
      console.error('Create module error:', error);
      return { success: false, error: 'Failed to create module' };
    }
  }

  /**
   * Create module table with initial fields
   */
  async createModuleTable(
    moduleId: string,
    fields: FieldCreateInput[] = []
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get module info
      const module = await this.getModule(moduleId);
      if (!module) {
        return { success: false, error: 'Module not found' };
      }

      // Convert fields to the format expected by the DB function
      const fieldDefs = fields.map((f) => ({
        api_name: f.api_name,
        field_type: f.field_type,
      }));

      // Call the database function to create the table
      const { error } = await this.supabase.rpc('create_custom_module_table', {
        p_org_id: module.org_id,
        p_api_name: module.api_name,
        p_fields: fieldDefs,
      });

      if (error) {
        console.error('Failed to create module table:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Create module table error:', error);
      return { success: false, error: 'Failed to create module table' };
    }
  }

  /**
   * Update a module
   */
  async updateModule(
    id: string,
    updates: ModuleUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_studio_modules')
        .update(updates)
        .eq('id', id)
        .eq('is_system', false); // Prevent updating system modules

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update module error:', error);
      return { success: false, error: 'Failed to update module' };
    }
  }

  /**
   * Delete a module (and its table)
   */
  async deleteModule(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get module info first
      const module = await this.getModule(id);
      if (!module) {
        return { success: false, error: 'Module not found' };
      }

      if (module.is_system) {
        return { success: false, error: 'Cannot delete system modules' };
      }

      // Drop the custom table
      const { error: dropError } = await this.supabase.rpc('drop_custom_module_table', {
        p_org_id: module.org_id,
        p_api_name: module.api_name,
      });

      if (dropError) {
        console.error('Failed to drop module table:', dropError);
        // Continue with deletion even if table drop fails
      }

      // Delete the module record (cascade will delete fields, layouts, views, rules)
      const { error } = await this.supabase
        .from('crm_studio_modules')
        .delete()
        .eq('id', id)
        .eq('is_system', false);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete module error:', error);
      return { success: false, error: 'Failed to delete module' };
    }
  }

  /**
   * Get the database table name for a module
   */
  async getModuleTableName(moduleId: string): Promise<string | null> {
    try {
      const module = await this.getModule(moduleId);
      if (!module) return null;

      const { data, error } = await this.supabase.rpc('get_custom_module_table_name', {
        p_org_id: module.org_id,
        p_api_name: module.api_name,
      });

      if (error) {
        console.error('Failed to get table name:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Get table name error:', error);
      return null;
    }
  }

  /**
   * Generate permission keys for a module
   */
  getModulePermissions(apiName: string): string[] {
    return [
      `${apiName}.read`,
      `${apiName}.write`,
      `${apiName}.delete`,
      `${apiName}.export`,
    ];
  }
}

// Factory function
export function createModuleService(supabase: SupabaseClient): ModuleService {
  return new ModuleService(supabase);
}
