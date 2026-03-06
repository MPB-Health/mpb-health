export type DocumentCategory = 'general' | 'contract' | 'proposal' | 'invoice' | 'report' | 'other';

export interface Document {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: DocumentCategory;
  entity_type: string | null;
  entity_id: string | null;
  folder: string | null;
  is_public: boolean;
  uploaded_by: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithRelations extends Document {
  uploader?: { id: string; full_name: string | null; email: string } | null;
}

export interface DocumentFilters {
  search?: string;
  category?: DocumentCategory;
  entity_type?: string;
  entity_id?: string;
  folder?: string;
  mime_type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DocumentCreateInput {
  name: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category?: DocumentCategory;
  entity_type?: string;
  entity_id?: string;
  folder?: string;
  is_public?: boolean;
  tags?: string[];
}

export interface DocumentUpdateInput {
  name?: string;
  description?: string;
  category?: DocumentCategory;
  folder?: string;
  is_public?: boolean;
  tags?: string[];
}
