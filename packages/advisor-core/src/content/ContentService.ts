import { supabase } from '@mpbhealth/database';
import type { SOPDocument, SOPCategory, Handbook, Bulletin } from '../types';

export class ContentService {
  // ========== SOP Documents ==========

  // Get all SOP documents
  async getSOPDocuments(filters?: {
    category?: string;
    search?: string;
    tags?: string[];
  }): Promise<SOPDocument[]> {
    let query = supabase
      .from('sop_documents')
      .select('*')
      .eq('is_published', true)
      .order('title', { ascending: true });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
      );
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get a single SOP document
  async getSOPDocument(documentId: string): Promise<SOPDocument | null> {
    const { data, error } = await supabase
      .from('sop_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get SOP categories
  async getSOPCategories(): Promise<SOPCategory[]> {
    const { data, error } = await supabase
      .from('sop_categories')
      .select('*, document_count:sop_documents(count)')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Track document view
  async trackSOPView(documentId: string): Promise<void> {
    await supabase.rpc('increment_sop_view_count', { doc_id: documentId });
  }

  // Get popular SOPs
  async getPopularSOPs(limit = 5): Promise<SOPDocument[]> {
    const { data, error } = await supabase
      .from('sop_documents')
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get recently updated SOPs
  async getRecentSOPs(limit = 5): Promise<SOPDocument[]> {
    const { data, error } = await supabase
      .from('sop_documents')
      .select('*')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ========== Handbooks ==========

  // Get all handbooks
  async getHandbooks(category?: string): Promise<Handbook[]> {
    let query = supabase
      .from('handbooks')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get a single handbook
  async getHandbook(handbookId: string): Promise<Handbook | null> {
    const { data, error } = await supabase
      .from('handbooks')
      .select('*')
      .eq('id', handbookId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ========== Bulletins ==========

  // Get all bulletins
  async getBulletins(filters?: {
    category?: string;
    includePast?: boolean;
  }): Promise<Bulletin[]> {
    const now = new Date().toISOString();

    let query = supabase
      .from('bulletins')
      .select('*')
      .lte('published_at', now)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (!filters?.includePast) {
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get active bulletins (not expired)
  async getActiveBulletins(): Promise<Bulletin[]> {
    return this.getBulletins({ includePast: false });
  }

  // Get urgent bulletins
  async getUrgentBulletins(): Promise<Bulletin[]> {
    const bulletins = await this.getActiveBulletins();
    return bulletins.filter(b => b.priority === 'urgent' || b.priority === 'high');
  }

  // Get a single bulletin
  async getBulletin(bulletinId: string): Promise<Bulletin | null> {
    const { data, error } = await supabase
      .from('bulletins')
      .select('*')
      .eq('id', bulletinId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Mark bulletin as read
  async markBulletinRead(bulletinId: string, advisorId: string): Promise<void> {
    const { data: bulletin } = await supabase
      .from('bulletins')
      .select('read_by')
      .eq('id', bulletinId)
      .single();

    if (!bulletin) return;

    const readBy = bulletin.read_by || [];
    if (!readBy.includes(advisorId)) {
      readBy.push(advisorId);
      await supabase
        .from('bulletins')
        .update({ read_by: readBy })
        .eq('id', bulletinId);
    }
  }

  // Get unread bulletin count
  async getUnreadBulletinCount(advisorId: string): Promise<number> {
    const bulletins = await this.getActiveBulletins();
    return bulletins.filter(b => !b.read_by?.includes(advisorId)).length;
  }

  // ========== Search ==========

  // Search across all content
  async searchContent(query: string): Promise<{
    sops: SOPDocument[];
    handbooks: Handbook[];
    bulletins: Bulletin[];
  }> {
    const [sops, handbooks, bulletins] = await Promise.all([
      this.getSOPDocuments({ search: query }),
      supabase
        .from('handbooks')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
        .then(r => r.data || []),
      supabase
        .from('bulletins')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .then(r => r.data || []),
    ]);

    return { sops, handbooks, bulletins };
  }

  // ========== Subscriptions ==========

  // Subscribe to new bulletins
  subscribeToBulletins(callback: (bulletin: Bulletin) => void) {
    return supabase
      .channel('bulletins')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bulletins',
        },
        (payload) => {
          callback(payload.new as Bulletin);
        }
      )
      .subscribe();
  }

  // Subscribe to SOP updates
  subscribeToSOPUpdates(callback: (sop: SOPDocument) => void) {
    return supabase
      .channel('sop-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sop_documents',
          filter: 'is_published=eq.true',
        },
        (payload) => {
          callback(payload.new as SOPDocument);
        }
      )
      .subscribe();
  }
}

export const contentService = new ContentService();
