export interface RecruitingRecord {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  npn: string | null;
  appointed_carriers: string[];
  agency_affiliation: string | null;
  state: string | null;
  city: string | null;
  pipeline_stage: string;
  workflow_subsection: string;
  linkedin_workflow_status: string | null;
  do_not_contact: boolean;
  priority: string;
  assigned_to: string | null;
  tags: string[];
  notes: string | null;
  last_contacted_at: string | null;
  last_touched_at: string | null;
  stage_changed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruitingPipelineStage {
  id: string;
  org_id: string;
  name: string;
  display_name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  is_terminal: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecruitingFilters {
  search?: string;
  stage?: string;
  workflowSubsection?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'last_touched_at' | 'created_at' | 'pipeline_stage' | 'assigned_to' | 'first_name';
  sortDir?: 'asc' | 'desc';
}

export interface RecruitingCreateInput {
  org_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  npn?: string | null;
  appointed_carriers?: string[];
  agency_affiliation?: string | null;
  state?: string | null;
  city?: string | null;
  pipeline_stage?: string;
  workflow_subsection?: string;
  assigned_to?: string | null;
  tags?: string[];
  notes?: string | null;
  created_by?: string | null;
}

export interface RecruitingUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  npn?: string | null;
  appointed_carriers?: string[];
  agency_affiliation?: string | null;
  state?: string | null;
  city?: string | null;
  pipeline_stage?: string;
  workflow_subsection?: string;
  linkedin_workflow_status?: string | null;
  do_not_contact?: boolean;
  priority?: string;
  assigned_to?: string | null;
  tags?: string[];
  notes?: string | null;
  last_touched_at?: string | null;
}

export interface BulkResult {
  success: number;
  failed: number;
  errors: string[];
}
