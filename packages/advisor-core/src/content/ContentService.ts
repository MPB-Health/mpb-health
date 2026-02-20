import { supabase } from '@mpbhealth/database';
import type { SOPDocument, SOPCategory, Handbook, Bulletin, BulletinCategory } from '../types';

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

  // ========== Bulletins (from advisor_content table - CMS managed) ==========

  // Get bulletin categories
  async getBulletinCategories(): Promise<BulletinCategory[]> {
    const { data, error } = await supabase
      .from('advisor_content_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get all bulletins from advisor_content table
  async getBulletins(filters?: {
    category_id?: string;
    search?: string;
  }, advisorId?: string): Promise<Bulletin[]> {
    const now = new Date().toISOString();

    let query = supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(id, name, slug, description, display_order)
      `)
      .eq('content_type', 'bulletin')
      .eq('is_published', true)
      .lte('published_date', now)
      .order('published_date', { ascending: false });

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    // If advisorId provided, fetch read status
    let readContentIds: string[] = [];
    if (advisorId && data && data.length > 0) {
      const { data: views } = await supabase
        .from('advisor_content_views')
        .select('content_id')
        .eq('advisor_id', advisorId)
        .in('content_id', data.map(b => b.id));
      
      readContentIds = views?.map(v => v.content_id) || [];
    }

    return (data || []).map(bulletin => ({
      ...bulletin,
      is_read: readContentIds.includes(bulletin.id),
    }));
  }

  // Get active bulletins (published and current)
  async getActiveBulletins(advisorId?: string): Promise<Bulletin[]> {
    return this.getBulletins({}, advisorId);
  }

  // Get bulletins for the slider (most recent first)
  async getFeaturedBulletins(limit = 5): Promise<Bulletin[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(id, name, slug, description, display_order)
      `)
      .eq('content_type', 'bulletin')
      .eq('is_published', true)
      .lte('published_date', now)
      .order('published_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get a single bulletin
  async getBulletin(bulletinId: string): Promise<Bulletin | null> {
    const { data, error } = await supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(id, name, slug, description, display_order)
      `)
      .eq('id', bulletinId)
      .eq('content_type', 'bulletin')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Get bulletin by slug
  async getBulletinBySlug(slug: string): Promise<Bulletin | null> {
    const { data, error } = await supabase
      .from('advisor_content')
      .select(`
        *,
        category:advisor_content_categories(id, name, slug, description, display_order)
      `)
      .eq('slug', slug)
      .eq('content_type', 'bulletin')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Mark bulletin as read (using advisor_content_views table)
  async markBulletinRead(bulletinId: string, advisorId: string): Promise<void> {
    // Check if already viewed
    const { data: existing } = await supabase
      .from('advisor_content_views')
      .select('id')
      .eq('content_id', bulletinId)
      .eq('advisor_id', advisorId)
      .single();

    if (!existing) {
      // Create view record
      await supabase
        .from('advisor_content_views')
        .insert({
          content_id: bulletinId,
          advisor_id: advisorId,
        });

      // Increment view count
      await supabase.rpc('increment_advisor_content_view_count', { content_id: bulletinId });
    }
  }

  // Get unread bulletin count
  async getUnreadBulletinCount(advisorId: string): Promise<number> {
    // Get all active bulletins
    const { data: bulletins } = await supabase
      .from('advisor_content')
      .select('id')
      .eq('content_type', 'bulletin')
      .eq('is_published', true)
      .lte('published_date', new Date().toISOString());

    if (!bulletins || bulletins.length === 0) return 0;

    // Get viewed bulletins for this advisor
    const { data: views } = await supabase
      .from('advisor_content_views')
      .select('content_id')
      .eq('advisor_id', advisorId)
      .in('content_id', bulletins.map(b => b.id));

    const viewedIds = views?.map(v => v.content_id) || [];
    return bulletins.filter(b => !viewedIds.includes(b.id)).length;
  }

  // Toggle bookmark on a bulletin
  async toggleBulletinBookmark(bulletinId: string, advisorId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('advisor_content_bookmarks')
      .select('id')
      .eq('content_id', bulletinId)
      .eq('advisor_id', advisorId)
      .single();

    if (existing) {
      await supabase
        .from('advisor_content_bookmarks')
        .delete()
        .eq('id', existing.id);
      return false;
    } else {
      await supabase
        .from('advisor_content_bookmarks')
        .insert({
          content_id: bulletinId,
          advisor_id: advisorId,
        });
      return true;
    }
  }

  // Get bookmarked bulletins
  async getBookmarkedBulletins(advisorId: string): Promise<Bulletin[]> {
    const { data, error } = await supabase
      .from('advisor_content_bookmarks')
      .select(`
        content:advisor_content(
          *,
          category:advisor_content_categories(id, name, slug, description, display_order)
        )
      `)
      .eq('advisor_id', advisorId);

    if (error) throw error;
    
    // Extract content from each bookmark, filtering out nulls
    return (data || [])
      .map(b => b.content as unknown as Bulletin)
      .filter((content): content is Bulletin => content !== null);
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
      this.getBulletins({ search: query }),
    ]);

    return { sops, handbooks, bulletins };
  }

  // ========== Subscriptions ==========

  // Subscribe to new bulletins (from advisor_content)
  subscribeToBulletins(callback: (bulletin: Bulletin) => void) {
    return supabase
      .channel('advisor-content-bulletins')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'advisor_content',
          filter: 'content_type=eq.bulletin',
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
