import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DashboardLayout,
  DashboardLayoutInput,
  WidgetInstance,
  DefaultLayoutTemplate,
  ServiceResult,
} from './types';

// ============================================================================
// Dashboard Layout Service
// Manages per-user dashboard widget configurations
// ============================================================================

export class DashboardLayoutService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the user's dashboard layout for an organization
   * Creates a default layout if none exists
   */
  async getLayout(orgId: string): Promise<DashboardLayout | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      // Use RPC function to get or create layout
      const { data, error } = await this.supabase.rpc('get_or_create_dashboard_layout', {
        p_user_id: user.id,
        p_org_id: orgId,
      });

      if (error) {
        console.error('Failed to get dashboard layout:', error);
        // Fallback to direct query
        return this.getLayoutDirect(user.id, orgId);
      }

      return data as unknown as DashboardLayout;
    } catch (error) {
      console.error('Get layout error:', error);
      return null;
    }
  }

  /**
   * Direct query fallback for getting layout
   */
  private async getLayoutDirect(userId: string, orgId: string): Promise<DashboardLayout | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_dashboard_layouts')
        .select('id, user_id, org_id, name, description, is_default, widgets, grid_columns, row_height, theme, created_at, updated_at')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to get layout:', error);
        return null;
      }

      if (data) {
        return data as unknown as DashboardLayout;
      }

      // Create default layout
      const defaultWidgets = await this.getDefaultWidgets(orgId);
      return this.createLayout(orgId, { widgets: defaultWidgets });
    } catch (error) {
      console.error('Get layout direct error:', error);
      return null;
    }
  }

  /**
   * Get all layouts for a user in an organization
   */
  async getAllLayouts(orgId: string): Promise<DashboardLayout[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('crm_dashboard_layouts')
        .select('id, user_id, org_id, name, description, is_default, widgets, grid_columns, row_height, theme, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get layouts:', error);
        return [];
      }

      return (data || []) as unknown as DashboardLayout[];
    } catch (error) {
      console.error('Get all layouts error:', error);
      return [];
    }
  }

  /**
   * Create a new dashboard layout
   */
  async createLayout(
    orgId: string,
    input: DashboardLayoutInput
  ): Promise<DashboardLayout | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('crm_dashboard_layouts')
        .insert({
          user_id: user.id,
          org_id: orgId,
          name: input.name || 'Default',
          description: input.description,
          widgets: input.widgets,
          grid_columns: input.grid_columns || 12,
          row_height: input.row_height || 100,
          theme: input.theme || {},
          is_default: input.name === 'Default' || !input.name,
        })
        .select('id, user_id, org_id, name, description, is_default, widgets, grid_columns, row_height, theme, created_at, updated_at')
        .single();

      if (error) {
        console.error('Failed to create layout:', error);
        return null;
      }

      return data as unknown as DashboardLayout;
    } catch (error) {
      console.error('Create layout error:', error);
      return null;
    }
  }

  /**
   * Save/update the dashboard layout
   */
  async saveLayout(
    orgId: string,
    widgets: WidgetInstance[],
    name: string = 'Default'
  ): Promise<ServiceResult<DashboardLayout>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Use RPC function for upsert
      const { data, error } = await this.supabase.rpc('save_dashboard_layout', {
        p_user_id: user.id,
        p_org_id: orgId,
        p_widgets: widgets,
        p_name: name,
      });

      if (error) {
        console.error('Failed to save layout via RPC:', error);
        // Fallback to direct upsert
        return this.saveLayoutDirect(user.id, orgId, widgets, name);
      }

      return { success: true, data: data as unknown as DashboardLayout };
    } catch (error) {
      console.error('Save layout error:', error);
      return { success: false, error: 'Failed to save layout' };
    }
  }

  /**
   * Direct upsert fallback for saving layout
   */
  private async saveLayoutDirect(
    userId: string,
    orgId: string,
    widgets: WidgetInstance[],
    name: string
  ): Promise<ServiceResult<DashboardLayout>> {
    try {
      const { data, error } = await this.supabase
        .from('crm_dashboard_layouts')
        .upsert(
          {
            user_id: userId,
            org_id: orgId,
            name,
            widgets,
            is_default: name === 'Default',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,org_id,name' }
        )
        .select('id, user_id, org_id, name, description, is_default, widgets, grid_columns, row_height, theme, created_at, updated_at')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as unknown as DashboardLayout };
    } catch (error) {
      console.error('Save layout direct error:', error);
      return { success: false, error: 'Failed to save layout' };
    }
  }

  /**
   * Delete a layout (cannot delete the default layout)
   */
  async deleteLayout(layoutId: string): Promise<ServiceResult> {
    try {
      // Check if it's the default layout
      const { data: layout } = await this.supabase
        .from('crm_dashboard_layouts')
        .select('is_default')
        .eq('id', layoutId)
        .single();

      if (layout?.is_default) {
        return { success: false, error: 'Cannot delete the default layout' };
      }

      const { error } = await this.supabase
        .from('crm_dashboard_layouts')
        .delete()
        .eq('id', layoutId);

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
   * Reset layout to default template
   */
  async resetLayout(orgId: string): Promise<ServiceResult<DashboardLayout>> {
    try {
      const defaultWidgets = await this.getDefaultWidgets(orgId);
      return this.saveLayout(orgId, defaultWidgets, 'Default');
    } catch (error) {
      console.error('Reset layout error:', error);
      return { success: false, error: 'Failed to reset layout' };
    }
  }

  /**
   * Get default widget configuration from templates, falling back to hardcoded defaults
   */
  async getDefaultWidgets(orgId?: string): Promise<WidgetInstance[]> {
    try {
      let query = this.supabase
        .from('crm_default_layout_templates')
        .select('id, org_id, name, description, widgets, grid_columns, row_height, is_active, created_by, created_at, updated_at')
        .eq('is_active', true);

      if (orgId) {
        query = query.or(`org_id.eq.${orgId},org_id.is.null`);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1);

      if (!error && data && data.length > 0 && data[0].widgets) {
        return data[0].widgets as unknown as WidgetInstance[];
      }
    } catch (err) {
      console.error('Failed to load default widgets from DB:', err);
    }

    return this.getHardcodedDefaultWidgets();
  }

  /**
   * Hardcoded default widgets as unknown as ultimate fallback
   */
  private getHardcodedDefaultWidgets(): WidgetInstance[] {
    return [
      { instanceId: 'metrics-1', widgetId: 'metrics', size: 'sm', position: { x: 0, y: 0 }, collapsed: false, config: { metric: 'total_leads' } },
      { instanceId: 'metrics-2', widgetId: 'metrics', size: 'sm', position: { x: 3, y: 0 }, collapsed: false, config: { metric: 'new_leads' } },
      { instanceId: 'metrics-3', widgetId: 'metrics', size: 'sm', position: { x: 6, y: 0 }, collapsed: false, config: { metric: 'tasks_due' } },
      { instanceId: 'metrics-4', widgetId: 'metrics', size: 'sm', position: { x: 9, y: 0 }, collapsed: false, config: { metric: 'overdue_tasks' } },
      { instanceId: 'pipeline-1', widgetId: 'pipeline', size: 'md', position: { x: 0, y: 1 }, collapsed: false, config: {} },
      { instanceId: 'recent-leads-1', widgetId: 'recent-leads', size: 'md', position: { x: 6, y: 1 }, collapsed: false, config: { limit: 5 } },
      { instanceId: 'tasks-1', widgetId: 'tasks', size: 'md', position: { x: 0, y: 2 }, collapsed: false, config: { view: 'due-today' } },
      { instanceId: 'activity-1', widgetId: 'activity', size: 'md', position: { x: 6, y: 2 }, collapsed: false, config: { limit: 5 } },
      { instanceId: 'quick-actions-1', widgetId: 'quick-actions', size: 'full', position: { x: 0, y: 3 }, collapsed: false, config: {} },
    ];
  }

  /**
   * Get all default layout templates
   */
  async getDefaultTemplates(orgId?: string): Promise<DefaultLayoutTemplate[]> {
    try {
      let query = this.supabase
        .from('crm_default_layout_templates')
        .select('id, org_id, name, description, widgets, grid_columns, row_height, is_active, created_by, created_at, updated_at')
        .eq('is_active', true);

      if (orgId) {
        query = query.or(`org_id.eq.${orgId},org_id.is.null`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get default templates:', error);
        return [];
      }

      return (data || []) as unknown as DefaultLayoutTemplate[];
    } catch (error) {
      console.error('Get default templates error:', error);
      return [];
    }
  }
}

// Factory function
export function createDashboardLayoutService(supabase: SupabaseClient): DashboardLayoutService {
  return new DashboardLayoutService(supabase);
}
