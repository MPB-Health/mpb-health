import { supabase } from '@mpbhealth/database';

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string | null;
  content_html: string | null;
  type: 'info' | 'warning' | 'success' | 'error';
  start_date: string;
  end_date: string | null;
  is_dismissible: boolean;
  is_active: boolean;
  target_audience: 'all' | 'new_advisors' | 'certified';
  link_url: string | null;
  link_text: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AnnouncementCreateInput {
  title: string;
  content?: string | null;
  content_html?: string | null;
  type?: 'info' | 'warning' | 'success' | 'error';
  start_date?: string;
  end_date?: string | null;
  is_dismissible?: boolean;
  is_active?: boolean;
  target_audience?: 'all' | 'new_advisors' | 'certified';
  link_url?: string | null;
  link_text?: string | null;
}

export type AnnouncementUpdateInput = Partial<AnnouncementCreateInput>;

export class AnnouncementAdminService {
  async getAll(): Promise<AdminAnnouncement[]> {
    const { data, error } = await supabase
      .from('advisor_announcements')
      .select('id, title, content, content_html, type, start_date, end_date, is_dismissible, is_active, target_audience, link_url, link_text, created_by, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as AdminAnnouncement[];
  }

  async getById(id: string): Promise<AdminAnnouncement | null> {
    const { data, error } = await supabase
      .from('advisor_announcements')
      .select('id, title, content, content_html, type, start_date, end_date, is_dismissible, is_active, target_audience, link_url, link_text, created_by, created_at, updated_at')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as unknown as AdminAnnouncement | null;
  }

  async create(input: AnnouncementCreateInput): Promise<AdminAnnouncement> {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from('advisor_announcements')
      .insert({
        title: input.title,
        content: input.content || null,
        content_html: input.content_html || null,
        type: input.type || 'info',
        start_date: input.start_date || new Date().toISOString(),
        end_date: input.end_date || null,
        is_dismissible: input.is_dismissible ?? true,
        is_active: input.is_active ?? true,
        target_audience: input.target_audience || 'all',
        link_url: input.link_url || null,
        link_text: input.link_text || null,
        created_by: user?.id || null,
      })
      .select('id, title, content, content_html, type, start_date, end_date, is_dismissible, is_active, target_audience, link_url, link_text, created_by, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as AdminAnnouncement;
  }

  async update(id: string, input: AnnouncementUpdateInput): Promise<AdminAnnouncement> {
    const { data, error } = await supabase
      .from('advisor_announcements')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, title, content, content_html, type, start_date, end_date, is_dismissible, is_active, target_audience, link_url, link_text, created_by, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as AdminAnnouncement;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_announcements')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async toggleActive(id: string): Promise<void> {
    const item = await this.getById(id);
    if (!item) throw new Error('Announcement not found');
    await this.update(id, { is_active: !item.is_active });
  }

  async getStats(): Promise<{ total: number; active: number; scheduled: number }> {
    const { data, error } = await supabase
      .from('advisor_announcements')
      .select('id, is_active, start_date, end_date');
    if (error) throw error;
    const items = data || [];
    const now = new Date().toISOString();
    return {
      total: items.length,
      active: items.filter(
        (a) => a.is_active && a.start_date <= now && (!a.end_date || a.end_date >= now)
      ).length,
      scheduled: items.filter((a) => a.is_active && a.start_date > now).length,
    };
  }
}

export const announcementAdminService = new AnnouncementAdminService();
