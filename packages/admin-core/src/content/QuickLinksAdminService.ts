import { supabase } from '@mpbhealth/database';
import type { QuickLink } from '@mpbhealth/advisor-core';

export type { QuickLink } from '@mpbhealth/advisor-core';

export type QuickLinkCategory =
  | 'resources'
  | 'advisor_forms'
  | 'employer_forms'
  | 'member_forms'
  | 'bulletins'
  | 'dashboard_actions'
  | 'resource_center';

export type QuickLinkCreateInput = Omit<QuickLink, 'id' | 'created_at' | 'updated_at'>;
export type QuickLinkUpdateInput = Partial<Omit<QuickLink, 'id' | 'created_at' | 'updated_at'>>;

export class QuickLinksAdminService {
  async getLinks(category?: QuickLinkCategory): Promise<QuickLink[]> {
    let query = supabase
      .from('advisor_quick_links')
      .select('id, label, url, icon, description, order_index, is_external, is_active, requires_auth, category, image_url, is_popup, created_at, updated_at')
      .order('order_index', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  async getLink(id: string): Promise<QuickLink | null> {
    const { data, error } = await supabase
      .from('advisor_quick_links')
      .select('id, label, url, icon, description, order_index, is_external, is_active, requires_auth, category, image_url, is_popup, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createLink(input: QuickLinkCreateInput): Promise<QuickLink> {
    const { data, error } = await supabase
      .from('advisor_quick_links')
      .insert(input)
      .select('id, label, url, icon, description, order_index, is_external, is_active, requires_auth, category, image_url, is_popup, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async updateLink(id: string, input: QuickLinkUpdateInput): Promise<QuickLink> {
    const { data, error } = await supabase
      .from('advisor_quick_links')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, label, url, icon, description, order_index, is_external, is_active, requires_auth, category, image_url, is_popup, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async deleteLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_quick_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleActive(id: string): Promise<QuickLink> {
    const link = await this.getLink(id);
    if (!link) throw new Error('Link not found');
    return this.updateLink(id, { is_active: !link.is_active });
  }

  async reorderLinks(linkIds: string[]): Promise<void> {
    const updates = linkIds.map((id, index) =>
      supabase.from('advisor_quick_links').update({ order_index: index }).eq('id', id),
    );
    await Promise.all(updates);
  }

  async getStats(): Promise<{ total: number; active: number }> {
    const { data, error } = await supabase
      .from('advisor_quick_links')
      .select('is_active');

    if (error) throw error;
    const links = data || [];
    return { total: links.length, active: links.filter((l) => l.is_active).length };
  }
}

export const quickLinksAdminService = new QuickLinksAdminService();
