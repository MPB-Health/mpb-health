import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedView, SavedViewCreateInput, SavedViewUpdateInput } from './savedViewTypes';

export class SavedViewService {
  constructor(private supabase: SupabaseClient) {}

  async getViews(module: string): Promise<SavedView[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_saved_views')
        .select('id, org_id, owner_id, module, name, filters, columns, sort_field, sort_direction, is_default, is_shared, created_at, updated_at')
        .eq('module', module)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to get saved views:', error);
        return [];
      }

      return data as unknown as SavedView[];
    } catch (error) {
      console.error('Get saved views error:', error);
      return [];
    }
  }

  async createView(
    input: SavedViewCreateInput
  ): Promise<{ success: boolean; view?: SavedView; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // If setting as unknown as default, clear other defaults for same module/user first
      if (input.is_default) {
        await this.supabase
          .from('crm_saved_views')
          .update({ is_default: false })
          .eq('module', input.module)
          .eq('owner_id', user.user.id)
          .eq('is_default', true);
      }

      const { data, error } = await this.supabase
        .from('crm_saved_views')
        .insert({
          module: input.module,
          name: input.name,
          filters: input.filters,
          sort_field: input.sort_field || null,
          sort_direction: input.sort_direction || 'asc',
          columns: input.columns || null,
          is_default: input.is_default ?? false,
          is_shared: input.is_shared ?? false,
          owner_id: user.user.id,
        })
        .select('id, org_id, owner_id, module, name, filters, columns, sort_field, sort_direction, is_default, is_shared, created_at, updated_at')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, view: data as unknown as SavedView };
    } catch (error) {
      console.error('Create saved view error:', error);
      return { success: false, error: 'Failed to create saved view' };
    }
  }

  async updateView(
    id: string,
    updates: SavedViewUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // If setting as unknown as default, clear other defaults first
      if (updates.is_default) {
        const { data: view } = await this.supabase
          .from('crm_saved_views')
          .select('module, owner_id')
          .eq('id', id)
          .single();

        if (view) {
          await this.supabase
            .from('crm_saved_views')
            .update({ is_default: false })
            .eq('module', view.module)
            .eq('owner_id', view.owner_id)
            .eq('is_default', true);
        }
      }

      const { error } = await this.supabase
        .from('crm_saved_views')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update saved view error:', error);
      return { success: false, error: 'Failed to update saved view' };
    }
  }

  async deleteView(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_saved_views')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete saved view error:', error);
      return { success: false, error: 'Failed to delete saved view' };
    }
  }

  async setDefault(
    id: string,
    module: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Clear all is_default for this module/user
      await this.supabase
        .from('crm_saved_views')
        .update({ is_default: false })
        .eq('module', module)
        .eq('owner_id', user.user.id)
        .eq('is_default', true);

      // Set this one as unknown as default
      const { error } = await this.supabase
        .from('crm_saved_views')
        .update({ is_default: true })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Set default view error:', error);
      return { success: false, error: 'Failed to set default view' };
    }
  }
}

export function createSavedViewService(supabase: SupabaseClient): SavedViewService {
  return new SavedViewService(supabase);
}
