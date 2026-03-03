import { supabase } from '@mpbhealth/database';
import type { NavMenuItem } from '@mpbhealth/advisor-core';

export type { NavMenuItem } from '@mpbhealth/advisor-core';

export type NavItemCreateInput = Omit<NavMenuItem, 'id' | 'children' | 'created_at' | 'updated_at'>;
export type NavItemUpdateInput = Partial<Omit<NavMenuItem, 'id' | 'children' | 'created_at' | 'updated_at'>>;

export class NavigationAdminService {
  /** Returns all items (including inactive) in flat order for admin management */
  async getAllItems(): Promise<NavMenuItem[]> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getItem(id: string): Promise<NavMenuItem | null> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createItem(input: NavItemCreateInput): Promise<NavMenuItem> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateItem(id: string, input: NavItemUpdateInput): Promise<NavMenuItem> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_nav_menu')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleActive(id: string): Promise<NavMenuItem> {
    const item = await this.getItem(id);
    if (!item) throw new Error('Nav item not found');
    return this.updateItem(id, { is_active: !item.is_active });
  }

  async reorderItems(itemIds: string[]): Promise<void> {
    const updates = itemIds.map((id, index) =>
      supabase.from('advisor_nav_menu').update({ order_index: index }).eq('id', id),
    );
    await Promise.all(updates);
  }

  async getStats(): Promise<{ total: number; active: number; topLevel: number }> {
    const { data, error } = await supabase
      .from('advisor_nav_menu')
      .select('is_active, parent_id');

    if (error) throw error;
    const items = data || [];
    return {
      total: items.length,
      active: items.filter((i) => i.is_active).length,
      topLevel: items.filter((i) => !i.parent_id).length,
    };
  }
}

export const navigationAdminService = new NavigationAdminService();
