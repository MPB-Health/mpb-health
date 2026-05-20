export interface AssignedLeadView {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  pipeline_stage: string | null;
  pipeline_stage_color: string | null;
  priority: string | null;
  lead_score: number | null;
  lead_source: string | null;
  state: string | null;
  last_activity_at: string | null;
  next_followup_at: string | null;
  created_at: string;
}

export interface LeadDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  pipeline_stage: string | null;
  pipeline_stage_color: string | null;
  priority: string | null;
  lead_score: number | null;
  lead_source: string | null;
  plan_type: string | null;
  primary_concern: string | null;
  household_size: number | null;
  assigned_to: string | null;
  assigned_advisor_name: string | null;
  last_contacted_at: string | null;
  last_activity_at: string | null;
  next_followup_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string | null;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LeadTask {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  due_date: string | null;
  priority: string | null;
  completed: boolean;
  completed_at: string | null;
  assigned_to: string | null;
  created_at: string | null;
}

export interface AdvisorLeadUpdateInput {
  pipeline_stage?: string | null;
  priority?: string | null;
  tags?: string[] | null;
  last_contacted_at?: string | null;
  last_activity_at?: string | null;
  next_followup_at?: string | null;
}

export interface CreateLeadTaskInput {
  lead_id: string;
  title: string;
  description?: string | null;
  task_type?: string;
  due_date?: string | null;
  priority?: string;
  assigned_to?: string;
  org_id?: string;
}

export interface LogLeadActivityInput {
  activity_type: string;
  title: string;
  description?: string | null;
  org_id?: string;
}
