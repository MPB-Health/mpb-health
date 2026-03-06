export interface SavedView {
  id: string;
  org_id: string;
  module: string;
  name: string;
  filters: Record<string, unknown>;
  sort_field: string | null;
  sort_direction: 'asc' | 'desc';
  columns: string[] | null;
  is_default: boolean;
  is_shared: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface SavedViewCreateInput {
  module: string;
  name: string;
  filters: Record<string, unknown>;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  columns?: string[];
  is_default?: boolean;
  is_shared?: boolean;
}

export interface SavedViewUpdateInput {
  name?: string;
  filters?: Record<string, unknown>;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  columns?: string[];
  is_default?: boolean;
  is_shared?: boolean;
}
