import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Document,
  DocumentWithRelations,
  DocumentFilters,
  DocumentCreateInput,
  DocumentUpdateInput,
} from './documentTypes';

export class DocumentService {
  constructor(private supabase: SupabaseClient) {}

  async getDocuments(
    filters: DocumentFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<{ documents: DocumentWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_documents')
        .select(`
          *,
          uploader:uploaded_by(id, full_name, email)
        `, { count: 'exact' });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
      }
      if (filters.folder) {
        query = query.eq('folder', filters.folder);
      }
      if (filters.mime_type) {
        query = query.ilike('mime_type', `${filters.mime_type}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get documents:', error);
        return { documents: [], total: 0 };
      }

      return { documents: data as DocumentWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get documents error:', error);
      return { documents: [], total: 0 };
    }
  }

  async getDocument(id: string): Promise<DocumentWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_documents')
        .select(`
          *,
          uploader:uploaded_by(id, full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get document:', error);
        return null;
      }

      return data as DocumentWithRelations;
    } catch (error) {
      console.error('Get document error:', error);
      return null;
    }
  }

  async createDocument(
    input: DocumentCreateInput
  ): Promise<{ success: boolean; document?: Document; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_documents')
        .insert({
          ...input,
          category: input.category || 'general',
          is_public: input.is_public ?? false,
          tags: input.tags || [],
          metadata: {},
          uploaded_by: user.user.id,
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, document: data as Document };
    } catch (error) {
      console.error('Create document error:', error);
      return { success: false, error: 'Failed to create document' };
    }
  }

  async updateDocument(
    id: string,
    updates: DocumentUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_documents')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update document error:', error);
      return { success: false, error: 'Failed to update document' };
    }
  }

  async deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the document first to find the storage path
      const { data: doc } = await this.supabase
        .from('crm_documents')
        .select('file_path')
        .eq('id', id)
        .single();

      if (doc?.file_path) {
        // Remove the file from storage
        await this.supabase.storage
          .from('crm-documents')
          .remove([doc.file_path]);
      }

      const { error } = await this.supabase
        .from('crm_documents')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete document error:', error);
      return { success: false, error: 'Failed to delete document' };
    }
  }

  async getDocumentsByEntity(
    entityType: string,
    entityId: string
  ): Promise<Document[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get documents by entity:', error);
        return [];
      }

      return data as Document[];
    } catch (error) {
      console.error('Get documents by entity error:', error);
      return [];
    }
  }

  async getFolders(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_documents')
        .select('folder')
        .not('folder', 'is', null)
        .order('folder', { ascending: true });

      if (error) {
        console.error('Failed to get folders:', error);
        return [];
      }

      // Extract distinct folder values
      const folders = [...new Set((data || []).map((d: { folder: string }) => d.folder))];
      return folders;
    } catch (error) {
      console.error('Get folders error:', error);
      return [];
    }
  }
}

export function createDocumentService(supabase: SupabaseClient): DocumentService {
  return new DocumentService(supabase);
}
