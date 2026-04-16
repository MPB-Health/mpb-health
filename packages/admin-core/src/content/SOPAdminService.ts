import { supabase } from '@mpbhealth/database';

export interface AdminSOPDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  content_type: 'html' | 'markdown' | 'pdf' | 'presentation' | 'external_link';
  file_url: string | null;
  image_url: string | null;
  version: string;
  is_published: boolean;
  tags: string[];
  view_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SOPCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
}

export type SOPCreateInput = Omit<AdminSOPDocument, 'id' | 'view_count' | 'created_at' | 'updated_at'>;
export type SOPUpdateInput = Partial<Omit<AdminSOPDocument, 'id' | 'view_count' | 'created_at' | 'updated_at'>>;

export interface SOPAdminStats {
  total: number;
  published: number;
  draft: number;
}

export class SOPAdminService {
  async getDocuments(filters?: { category?: string; search?: string; is_published?: boolean }): Promise<AdminSOPDocument[]> {
    let query = supabase
      .from('sop_documents')
      .select('id, title, description, category, content, content_type, file_url, image_url, version, is_published, tags, view_count, metadata, created_at, updated_at')
      .order('title', { ascending: true });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.is_published !== undefined) query = query.eq('is_published', filters.is_published);
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  async getDocument(id: string): Promise<AdminSOPDocument | null> {
    const { data, error } = await supabase
      .from('sop_documents')
      .select('id, title, description, category, content, content_type, file_url, image_url, version, is_published, tags, view_count, metadata, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createDocument(input: SOPCreateInput): Promise<AdminSOPDocument> {
    const { data, error } = await supabase
      .from('sop_documents')
      .insert({ ...input, view_count: 0 })
      .select('id, title, description, category, content, content_type, file_url, image_url, version, is_published, tags, view_count, metadata, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async updateDocument(id: string, input: SOPUpdateInput): Promise<AdminSOPDocument> {
    const { data, error } = await supabase
      .from('sop_documents')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, title, description, category, content, content_type, file_url, image_url, version, is_published, tags, view_count, metadata, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('sop_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async togglePublish(id: string): Promise<AdminSOPDocument> {
    const doc = await this.getDocument(id);
    if (!doc) throw new Error('Document not found');
    return this.updateDocument(id, { is_published: !doc.is_published });
  }

  async getCategories(): Promise<SOPCategory[]> {
    const { data, error } = await supabase
      .from('sop_categories')
      .select('id, name, slug, description, order_index')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data || []) as any;
  }

  async getStats(): Promise<SOPAdminStats> {
    const { data, error } = await supabase
      .from('sop_documents')
      .select('is_published');

    if (error) throw error;
    const docs = data || [];
    return {
      total: docs.length,
      published: docs.filter((d) => d.is_published).length,
      draft: docs.filter((d) => !d.is_published).length,
    };
  }

  async uploadFile(file: File, docId: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
    const path = `sops/${docId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: file.type || `application/${ext}`, upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
    return data.publicUrl;
  }
}

export const sopAdminService = new SOPAdminService();
