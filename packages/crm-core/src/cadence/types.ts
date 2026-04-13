export interface CadenceStep {
  delay_hours: number;
  action_type: 'call' | 'email' | 'sms' | 'linkedin_message' | 'task';
  template_id?: string;
  description?: string;
}

export interface FollowUpCadence {
  id: string;
  org_id: string;
  pipeline_stage_id: string | null;
  name: string;
  steps: CadenceStep[];
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CadenceCreateInput {
  name: string;
  pipeline_stage_id?: string | null;
  steps: CadenceStep[];
  is_default?: boolean;
  is_active?: boolean;
}

export interface CadenceUpdateInput {
  name?: string;
  pipeline_stage_id?: string | null;
  steps?: CadenceStep[];
  is_default?: boolean;
  is_active?: boolean;
}

export interface LeadCadenceState {
  id: string;
  lead_id: string;
  cadence_id: string;
  org_id: string;
  current_step: number;
  next_action_at: string | null;
  paused: boolean;
  paused_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
