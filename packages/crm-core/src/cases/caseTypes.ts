export type CaseStatus = 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'escalated' | 'resolved' | 'closed';
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type CaseOrigin = 'email' | 'phone' | 'web' | 'chat' | 'social' | 'internal';

export interface Case {
  id: string;
  org_id: string;
  case_number: string;
  subject: string;
  description: string | null;
  status: CaseStatus;
  priority: CasePriority;
  origin: CaseOrigin;
  category: string | null;
  subcategory: string | null;
  account_id: string | null;
  contact_id: string | null;
  owner_id: string | null;
  assigned_to: string | null;
  resolution: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  first_response_at: string | null;
  escalated_at: string | null;
  escalated_to: string | null;
  due_date: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CaseWithRelations extends Case {
  account?: { id: string; name: string } | null;
  contact?: { id: string; first_name: string; last_name: string; email: string | null } | null;
  owner?: { id: string; full_name: string | null; email: string } | null;
  assigned_user?: { id: string; full_name: string | null; email: string } | null;
  comments_count?: number;
}

export interface CaseComment {
  id: string;
  case_id: string;
  body: string;
  is_internal: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: { id: string; full_name: string | null; email: string } | null;
}

export interface CaseFilters {
  search?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  origin?: CaseOrigin;
  category?: string;
  account_id?: string;
  contact_id?: string;
  assigned_to?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CaseCreateInput {
  subject: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  origin?: CaseOrigin;
  category?: string;
  subcategory?: string;
  account_id?: string;
  contact_id?: string;
  assigned_to?: string;
  due_date?: string;
  tags?: string[];
}

export interface CaseUpdateInput extends Partial<CaseCreateInput> {
  resolution?: string;
}

export interface CaseCommentCreateInput {
  body: string;
  is_internal?: boolean;
}
