export interface AssignedLeadView {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  pipeline_stage: string | null;
  pipeline_stage_color: string | null;
  priority: string | null;
  last_activity_at: string | null;
  created_at: string;
}
