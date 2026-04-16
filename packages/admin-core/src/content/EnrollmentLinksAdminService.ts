import { supabase } from '@mpbhealth/database';

export interface EnrollmentLink {
  id: string;
  label: string;
  url: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EnrollmentLinkCreateInput = Omit<EnrollmentLink, 'id' | 'created_at' | 'updated_at'>;
export type EnrollmentLinkUpdateInput = Partial<Omit<EnrollmentLink, 'id' | 'created_at' | 'updated_at'>>;

export class EnrollmentLinksAdminService {
  /** Get all links (both active and inactive) — admin view. */
  async getAll(): Promise<EnrollmentLink[]> {
    const { data, error } = await supabase
      .from('advisor_enrollment_links')
      .select('id, label, url, description, order_index, is_active, created_at, updated_at')
      .order('order_index', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as EnrollmentLink[];
  }

  async create(input: EnrollmentLinkCreateInput): Promise<EnrollmentLink> {
    const { data, error } = await supabase
      .from('advisor_enrollment_links')
      .insert(input)
      .select('id, label, url, description, order_index, is_active, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as EnrollmentLink;
  }

  async update(id: string, input: EnrollmentLinkUpdateInput): Promise<EnrollmentLink> {
    const { data, error } = await supabase
      .from('advisor_enrollment_links')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, label, url, description, order_index, is_active, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as EnrollmentLink;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_enrollment_links')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async toggleActive(id: string): Promise<EnrollmentLink> {
    const { data: current, error: fetchErr } = await supabase
      .from('advisor_enrollment_links')
      .select('is_active')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;
    return this.update(id, { is_active: !current.is_active });
  }

  /** Persist a new order by updating order_index on each row. */
  async reorder(orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from('advisor_enrollment_links')
          .update({ order_index: index })
          .eq('id', id),
      ),
    );
  }
}

export const enrollmentLinksAdminService = new EnrollmentLinksAdminService();
