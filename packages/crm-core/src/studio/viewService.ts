import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  StudioView,
  ViewCreateInput,
  ViewUpdateInput,
} from './studioTypes';

export class ViewService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all views for a module accessible by the user
   */
  async getViews(moduleId: string, userId?: string): Promise<StudioView[]> {
    try {
      let query = this.supabase
        .from('crm_studio_views')
        .select('id, org_id, module_id, name, columns, filters, sort_field_id, sort_direction, visibility, owner_id, is_default, is_active, created_by, created_at, updated_at')
        .eq('module_id', moduleId)
        .eq('is_active', true);

      // Filter by visibility - user sees their own, team's, and org-wide views
      if (userId) {
        query = query.or(`visibility.eq.org,owner_id.eq.${userId},created_by.eq.${userId}`);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        console.error('Failed to get views:', error);
        return [];
      }

      return data as unknown as StudioView[];
    } catch (error) {
      console.error('Get views error:', error);
      return [];
    }
  }

  /**
   * Get a single view by ID
   */
  async getView(id: string): Promise<StudioView | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_views')
        .select('id, org_id, module_id, name, columns, filters, sort_field_id, sort_direction, visibility, owner_id, is_default, is_active, created_by, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get view:', error);
        return null;
      }

      return data as unknown as StudioView;
    } catch (error) {
      console.error('Get view error:', error);
      return null;
    }
  }

  /**
   * Get the default view for a module and user
   */
  async getDefaultView(moduleId: string, userId: string): Promise<StudioView | null> {
    try {
      // First try user's default
      const { data: userDefault } = await this.supabase
        .from('crm_studio_views')
        .select('id, org_id, module_id, name, columns, filters, sort_field_id, sort_direction, visibility, owner_id, is_default, is_active, created_by, created_at, updated_at')
        .eq('module_id', moduleId)
        .eq('owner_id', userId)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (userDefault) {
        return userDefault as unknown as StudioView;
      }

      // Then try org default
      const { data: orgDefault } = await this.supabase
        .from('crm_studio_views')
        .select('id, org_id, module_id, name, columns, filters, sort_field_id, sort_direction, visibility, owner_id, is_default, is_active, created_by, created_at, updated_at')
        .eq('module_id', moduleId)
        .eq('visibility', 'org')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (orgDefault) {
        return orgDefault as unknown as StudioView;
      }

      // Fallback to any active view
      const { data: anyView } = await this.supabase
        .from('crm_studio_views')
        .select('id, org_id, module_id, name, columns, filters, sort_field_id, sort_direction, visibility, owner_id, is_default, is_active, created_by, created_at, updated_at')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .limit(1)
        .single();

      return anyView as unknown as StudioView | null;
    } catch (error) {
      console.error('Get default view error:', error);
      return null;
    }
  }

  /**
   * Create a new view
   */
  async createView(
    input: ViewCreateInput
  ): Promise<{ success: boolean; viewId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
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

      // If this will be the user's default, unset their other defaults
      if (input.is_default) {
        await this.supabase
          .from('crm_studio_views')
          .update({ is_default: false })
          .eq('module_id', input.module_id)
          .eq('owner_id', user.user.id);
      }

      const { data, error } = await this.supabase
        .from('crm_studio_views')
        .insert({
          org_id: module.org_id,
          module_id: input.module_id,
          name: input.name,
          columns: input.columns || [],
          filters: input.filters || [],
          sort_field_id: input.sort_field_id || null,
          sort_direction: input.sort_direction || 'desc',
          visibility: input.visibility || 'private',
          owner_id: user.user.id,
          is_default: input.is_default ?? false,
          is_active: true,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, viewId: data?.id };
    } catch (error) {
      console.error('Create view error:', error);
      return { success: false, error: 'Failed to create view' };
    }
  }

  /**
   * Update a view
   */
  async updateView(
    id: string,
    updates: ViewUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Verify ownership or that user can edit org views
      const view = await this.getView(id);
      if (!view) {
        return { success: false, error: 'View not found' };
      }

      // Only owner or creator can edit private views
      if (view.visibility === 'private' && view.owner_id !== user.user.id) {
        return { success: false, error: 'You can only edit your own private views' };
      }

      // If setting as unknown as default, unset user's other defaults
      if (updates.is_default) {
        await this.supabase
          .from('crm_studio_views')
          .update({ is_default: false })
          .eq('module_id', view.module_id)
          .eq('owner_id', user.user.id)
          .neq('id', id);
      }

      const { error } = await this.supabase
        .from('crm_studio_views')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update view error:', error);
      return { success: false, error: 'Failed to update view' };
    }
  }

  /**
   * Delete a view
   */
  async deleteView(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Verify ownership
      const view = await this.getView(id);
      if (!view) {
        return { success: false, error: 'View not found' };
      }

      if (view.owner_id !== user.user.id && view.created_by !== user.user.id) {
        return { success: false, error: 'You can only delete your own views' };
      }

      const { error } = await this.supabase
        .from('crm_studio_views')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete view error:', error);
      return { success: false, error: 'Failed to delete view' };
    }
  }

  /**
   * Set a view as unknown as the user's default
   */
  async setDefaultView(viewId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const view = await this.getView(viewId);
      if (!view) {
        return { success: false, error: 'View not found' };
      }

      // Unset other defaults
      await this.supabase
        .from('crm_studio_views')
        .update({ is_default: false })
        .eq('module_id', view.module_id)
        .eq('owner_id', userId);

      // Set this as unknown as default
      const { error } = await this.supabase
        .from('crm_studio_views')
        .update({ is_default: true })
        .eq('id', viewId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Set default view error:', error);
      return { success: false, error: 'Failed to set default view' };
    }
  }

  /**
   * Create a default "All Records" view for a new module
   */
  async createDefaultView(
    moduleId: string,
    orgId: string,
    fieldIds: string[]
  ): Promise<void> {
    const { data: user } = await this.supabase.auth.getUser();
    const userId = user.user?.id;

    const defaultView = {
      org_id: orgId,
      module_id: moduleId,
      name: 'All Records',
      columns: fieldIds.slice(0, 5).map((fieldId) => ({
        field_id: fieldId,
        width: 200,
        sortable: true,
      })),
      filters: [],
      sort_direction: 'desc',
      visibility: 'org',
      owner_id: userId,
      is_default: true,
      is_active: true,
      created_by: userId,
    };

    await this.supabase.from('crm_studio_views').insert(defaultView);
  }
}

// Factory function
export function createViewService(supabase: SupabaseClient): ViewService {
  return new ViewService(supabase);
}
