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

export interface LeadDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  secondary_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  date_of_birth: string | null;
  medicare_number: string | null;
  pipeline_stage: string | null;
  pipeline_stage_color: string | null;
  priority: string | null;
  source: string | null;
  assigned_to: string | null;
  assigned_advisor_name: string | null;
  last_contacted_at: string | null;
  last_activity_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: 'call' | 'email' | 'sms' | 'meeting' | 'note' | 'status_change';
  title: string;
  description: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}
