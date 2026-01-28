import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  StudioLayout,
  LayoutCreateInput,
  LayoutUpdateInput,
  LayoutType,
} from './studioTypes';

export class LayoutService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all layouts for a module
   */
  async getLayouts(moduleId: string): Promise<StudioLayout[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_layouts')
        .select('*')
        .eq('module_id', moduleId)
        .order('layout_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to get layouts:', error);
        return [];
      }

      return data as StudioLayout[];
    } catch (error) {
      console.error('Get layouts error:', error);
      return [];
    }
  }

  /**
   * Get a single layout by ID
   */
  async getLayout(id: string): Promise<StudioLayout | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_layouts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get layout:', error);
        return null;
      }

      return data as StudioLayout;
    } catch (error) {
      console.error('Get layout error:', error);
      return null;
    }
  }

  /**
   * Get the default layout for a module and type
   */
  async getDefaultLayout(
    moduleId: string,
    layoutType: LayoutType
  ): Promise<StudioLayout | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_layouts')
        .select('*')
        .eq('module_id', moduleId)
        .eq('layout_type', layoutType)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        // If no default, try to get any active layout of this type
        if (error.code === 'PGRST116') {
          const { data: fallback } = await this.supabase
            .from('crm_studio_layouts')
            .select('*')
            .eq('module_id', moduleId)
            .eq('layout_type', layoutType)
            .eq('is_active', true)
            .limit(1)
            .single();

          return fallback as StudioLayout | null;
        }
        console.error('Failed to get default layout:', error);
        return null;
      }

      return data as StudioLayout;
    } catch (error) {
      console.error('Get default layout error:', error);
      return null;
    }
  }

  /**
   * Create a new layout
   */
  async createLayout(
    input: LayoutCreateInput
  ): Promise<{ success: boolean; layoutId?: string; error?: string }> {
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

      // Get module to find org_id
      const { data: module, error: moduleError } = await this.supabase
        .from('crm_studio_modules')
        .select('org_id')
        .eq('id', input.module_id)
        .single();

      if (moduleError || !module) {
        return { success: false, error: 'Module not found' };
      }

      // If this will be the default, unset other defaults of the same type
      if (input.is_default) {
        await this.supabase
          .from('crm_studio_layouts')
          .update({ is_default: false })
          .eq('module_id', input.module_id)
          .eq('layout_type', input.layout_type);
      }

      const { data, error } = await this.supabase
        .from('crm_studio_layouts')
        .insert({
          org_id: module.org_id,
          module_id: input.module_id,
          name: input.name,
          api_name: input.api_name,
          layout_type: input.layout_type,
          sections: input.sections || [],
          is_default: input.is_default ?? false,
          is_active: true,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'A layout with this API name already exists in this module' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, layoutId: data?.id };
    } catch (error) {
      console.error('Create layout error:', error);
      return { success: false, error: 'Failed to create layout' };
    }
  }

  /**
   * Update a layout
   */
  async updateLayout(
    id: string,
    updates: LayoutUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        const layout = await this.getLayout(id);
        if (layout) {
          await this.supabase
            .from('crm_studio_layouts')
            .update({ is_default: false })
            .eq('module_id', layout.module_id)
            .eq('layout_type', layout.layout_type)
            .neq('id', id);
        }
      }

      const { error } = await this.supabase
        .from('crm_studio_layouts')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update layout error:', error);
      return { success: false, error: 'Failed to update layout' };
    }
  }

  /**
   * Delete a layout
   */
  async deleteLayout(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_studio_layouts')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete layout error:', error);
      return { success: false, error: 'Failed to delete layout' };
    }
  }

  /**
   * Create default layouts for a new module
   */
  async createDefaultLayouts(
    moduleId: string,
    orgId: string,
    fieldIds: string[]
  ): Promise<void> {
    const { data: user } = await this.supabase.auth.getUser();
    const userId = user.user?.id;

    // Build sections with all fields
    const defaultSection = {
      name: 'General Information',
      columns: 2,
      collapsed: false,
      fields: fieldIds.map((fieldId) => ({
        field_id: fieldId,
        read_only: false,
        span: 1,
      })),
    };

    const layouts = [
      {
        org_id: orgId,
        module_id: moduleId,
        name: 'Default Create',
        api_name: 'default_create',
        layout_type: 'create',
        sections: [defaultSection],
        is_default: true,
        is_active: true,
        created_by: userId,
      },
      {
        org_id: orgId,
        module_id: moduleId,
        name: 'Default Edit',
        api_name: 'default_edit',
        layout_type: 'edit',
        sections: [defaultSection],
        is_default: true,
        is_active: true,
        created_by: userId,
      },
      {
        org_id: orgId,
        module_id: moduleId,
        name: 'Default View',
        api_name: 'default_view',
        layout_type: 'view',
        sections: [defaultSection],
        is_default: true,
        is_active: true,
        created_by: userId,
      },
    ];

    await this.supabase.from('crm_studio_layouts').insert(layouts);
  }
}

// Factory function
export function createLayoutService(supabase: SupabaseClient): LayoutService {
  return new LayoutService(supabase);
}
