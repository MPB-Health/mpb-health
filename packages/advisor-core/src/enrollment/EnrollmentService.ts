import { supabase } from '@mpbhealth/database';

export interface EnrollmentLink {
  id: string;
  label: string;
  url: string;
  description?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class EnrollmentService {
  async getLinks(): Promise<EnrollmentLink[]> {
    const { data, error } = await supabase
      .from('advisor_enrollment_links')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return (data || []) as EnrollmentLink[];
  }

  async createLink(link: Omit<EnrollmentLink, 'id' | 'created_at' | 'updated_at'>): Promise<EnrollmentLink> {
    const { data, error } = await supabase
      .from('advisor_enrollment_links')
      .insert(link)
      .select()
      .single();
    if (error) throw error;
    return data as EnrollmentLink;
  }

  async updateLink(linkId: string, updates: Partial<EnrollmentLink>): Promise<EnrollmentLink> {
    const { data, error } = await supabase
      .from('advisor_enrollment_links')
      .update(updates)
      .eq('id', linkId)
      .select()
      .single();
    if (error) throw error;
    return data as EnrollmentLink;
  }

  async deleteLink(linkId: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_enrollment_links')
      .delete()
      .eq('id', linkId);
    if (error) throw error;
  }

  async reorderLinks(linkIds: string[]): Promise<void> {
    const updates = linkIds.map((id, index) =>
      supabase.from('advisor_enrollment_links').update({ order_index: index }).eq('id', id)
    );
    await Promise.all(updates);
  }

  subscribeToChanges(callback: (links: EnrollmentLink[]) => void) {
    return supabase
      .channel('advisor-enrollment-links-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advisor_enrollment_links' }, async () => {
        const links = await this.getLinks();
        callback(links);
      })
      .subscribe();
  }
}

export const enrollmentService = new EnrollmentService();
