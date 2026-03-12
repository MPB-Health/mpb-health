import { supabase } from '@mpbhealth/database';

export interface DashboardWidget {
  id: string;
  widget_key: string;
  label: string;
  description: string | null;
  order_index: number;
  is_visible: boolean;
  grid_column: 'full' | 'left' | 'right';
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WidgetUpdateInput {
  label?: string;
  description?: string | null;
  order_index?: number;
  is_visible?: boolean;
  grid_column?: 'full' | 'left' | 'right';
  config?: Record<string, unknown> | null;
}

export interface WidgetCreateInput {
  widget_key: string;
  label: string;
  description?: string | null;
  order_index?: number;
  is_visible?: boolean;
  grid_column?: 'full' | 'left' | 'right';
  config?: Record<string, unknown> | null;
}

export class WidgetAdminService {
  async getAll(): Promise<DashboardWidget[]> {
    const { data, error } = await supabase
      .from('advisor_dashboard_widgets')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) throw error;
    return (data || []) as DashboardWidget[];
  }

  async update(id: string, input: WidgetUpdateInput): Promise<DashboardWidget> {
    const { data, error } = await supabase
      .from('advisor_dashboard_widgets')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as DashboardWidget;
  }

  async create(input: WidgetCreateInput): Promise<DashboardWidget> {
    const { data, error } = await supabase
      .from('advisor_dashboard_widgets')
      .insert({
        widget_key: input.widget_key,
        label: input.label,
        description: input.description || null,
        order_index: input.order_index ?? 0,
        is_visible: input.is_visible ?? true,
        grid_column: input.grid_column || 'full',
        config: input.config || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as DashboardWidget;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_dashboard_widgets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async toggleVisible(id: string): Promise<void> {
    const { data } = await supabase
      .from('advisor_dashboard_widgets')
      .select('is_visible')
      .eq('id', id)
      .single();
    if (!data) throw new Error('Widget not found');
    await this.update(id, { is_visible: !data.is_visible });
  }

  async reorder(widgetIds: string[]): Promise<void> {
    const updates = widgetIds.map((id, index) =>
      supabase
        .from('advisor_dashboard_widgets')
        .update({ order_index: index + 1, updated_at: new Date().toISOString() })
        .eq('id', id)
    );
    await Promise.all(updates);
  }

  async getStats(): Promise<{ total: number; visible: number; hidden: number }> {
    const { data, error } = await supabase
      .from('advisor_dashboard_widgets')
      .select('id, is_visible');
    if (error) throw error;
    const items = data || [];
    return {
      total: items.length,
      visible: items.filter((w) => w.is_visible).length,
      hidden: items.filter((w) => !w.is_visible).length,
    };
  }
}

export const widgetAdminService = new WidgetAdminService();
