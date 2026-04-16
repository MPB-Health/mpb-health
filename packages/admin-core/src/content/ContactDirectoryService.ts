import { supabase } from '@mpbhealth/database';

export interface ContactEntry {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  extension: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type ContactCreateInput = Omit<ContactEntry, 'id' | 'created_at' | 'updated_at'>;
export type ContactUpdateInput = Partial<Omit<ContactEntry, 'id' | 'created_at' | 'updated_at'>>;

export class ContactDirectoryService {
  async getContacts(includeInactive = false): Promise<ContactEntry[]> {
    let query = supabase
      .from('advisor_contact_directory')
      .select('id, name, title, department, email, phone, extension, avatar_url, bio, is_active, display_order, created_at, updated_at')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  async getContact(id: string): Promise<ContactEntry | null> {
    const { data, error } = await supabase
      .from('advisor_contact_directory')
      .select('id, name, title, department, email, phone, extension, avatar_url, bio, is_active, display_order, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createContact(input: ContactCreateInput): Promise<ContactEntry> {
    const { data, error } = await supabase
      .from('advisor_contact_directory')
      .insert(input)
      .select('id, name, title, department, email, phone, extension, avatar_url, bio, is_active, display_order, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async updateContact(id: string, input: ContactUpdateInput): Promise<ContactEntry> {
    const { data, error } = await supabase
      .from('advisor_contact_directory')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, title, department, email, phone, extension, avatar_url, bio, is_active, display_order, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_contact_directory')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleActive(id: string): Promise<ContactEntry> {
    const contact = await this.getContact(id);
    if (!contact) throw new Error('Contact not found');
    return this.updateContact(id, { is_active: !contact.is_active });
  }

  async reorderContacts(contactIds: string[]): Promise<void> {
    const updates = contactIds.map((id, index) =>
      supabase.from('advisor_contact_directory').update({ display_order: index }).eq('id', id),
    );
    await Promise.all(updates);
  }

  async getDepartments(): Promise<string[]> {
    const { data, error } = await supabase
      .from('advisor_contact_directory')
      .select('department')
      .not('department', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map((c) => c.department).filter(Boolean))].sort();
  }

  async getStats(): Promise<{ total: number; active: number }> {
    const { data, error } = await supabase
      .from('advisor_contact_directory')
      .select('is_active');

    if (error) throw error;
    const contacts = data || [];
    return { total: contacts.length, active: contacts.filter((c) => c.is_active).length };
  }

  async uploadAvatar(file: File, contactId: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `contacts/avatars/${contactId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
    return data.publicUrl;
  }
}

export const contactDirectoryService = new ContactDirectoryService();
