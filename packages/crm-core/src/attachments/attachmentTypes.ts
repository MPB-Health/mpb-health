export type AttachmentCategory = 'general' | 'contract' | 'id_document' | 'application' | 'medical' | 'correspondence' | 'image' | 'other';

export type AttachmentEntityType = 'lead' | 'contact' | 'deal' | 'case' | 'account';

export interface Attachment {
  id: string;
  org_id: string;
  entity_type: AttachmentEntityType;
  entity_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: AttachmentCategory;
  description: string | null;
  uploaded_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AttachmentWithUploader extends Attachment {
  uploader?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface AttachmentCreateInput {
  entity_type: AttachmentEntityType;
  entity_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category?: AttachmentCategory;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface AttachmentFilters {
  entity_type?: AttachmentEntityType;
  entity_id?: string;
  category?: AttachmentCategory;
  mime_type?: string;
  search?: string;
}
