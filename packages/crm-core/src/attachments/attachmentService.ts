import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Attachment,
  AttachmentWithUploader,
  AttachmentCreateInput,
  AttachmentFilters,
  AttachmentEntityType,
} from './attachmentTypes';

const BUCKET = 'crm-attachments';

export class AttachmentService {
  constructor(private supabase: SupabaseClient) {}

  async getAttachments(
    entityType: AttachmentEntityType,
    entityId: string,
    filters: AttachmentFilters = {},
  ): Promise<AttachmentWithUploader[]> {
    try {
      let query = this.supabase
        .from('crm_attachments')
        .select('id, org_id, entity_type, entity_id, file_name, file_size, file_type, storage_path, uploaded_by, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.mime_type) query = query.ilike('mime_type', `${filters.mime_type}%`);
      if (filters.search) query = query.ilike('file_name', `%${filters.search}%`);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get attachments:', error);
        return [];
      }

      return (data || []) as unknown as AttachmentWithUploader[];
    } catch (err) {
      console.error('Get attachments error:', err);
      return [];
    }
  }

  async uploadAttachment(
    file: File,
    input: Omit<AttachmentCreateInput, 'file_path' | 'file_size' | 'mime_type' | 'file_name'>,
  ): Promise<{ success: boolean; attachment?: Attachment; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) return { success: false, error: 'Not authenticated' };

      const ext = file.name.split('.').pop() || 'bin';
      const filePath = `${input.entity_type}/${input.entity_id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await this.supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data, error: insertError } = await this.supabase
        .from('crm_attachments')
        .insert({
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          category: input.category || 'general',
          description: input.description || null,
          uploaded_by: user.user.id,
          metadata: input.metadata || {},
        })
        .select('id, org_id, entity_type, entity_id, file_name, file_size, file_type, storage_path, uploaded_by, created_at')
        .single();

      if (insertError) {
        await this.supabase.storage.from(BUCKET).remove([filePath]);
        return { success: false, error: insertError.message };
      }

      return { success: true, attachment: data as unknown as Attachment };
    } catch (err) {
      console.error('Upload attachment error:', err);
      return { success: false, error: 'Upload failed' };
    }
  }

  async deleteAttachment(attachmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: attachment, error: fetchError } = await this.supabase
        .from('crm_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single();

      if (fetchError || !attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      await this.supabase.storage.from(BUCKET).remove([attachment.file_path]);

      const { error: deleteError } = await this.supabase
        .from('crm_attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Delete attachment error:', err);
      return { success: false, error: 'Delete failed' };
    }
  }

  async getDownloadUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, expiresIn);

      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  }

  async getAttachmentCount(entityType: AttachmentEntityType, entityId: string): Promise<number> {
    const { count } = await this.supabase
      .from('crm_attachments')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    return count || 0;
  }
}

export function createAttachmentService(supabase: SupabaseClient): AttachmentService {
  return new AttachmentService(supabase);
}
