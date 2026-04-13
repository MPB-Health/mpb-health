export interface SLAConfig {
  id: string;
  org_id: string;
  sla_hours: number;
  business_hours_start: string;
  business_hours_end: string;
  business_days: number[];
  timezone: string;
  escalation_to: string[];
  escalation_email: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SLAConfigInput {
  sla_hours?: number;
  business_hours_start?: string;
  business_hours_end?: string;
  business_days?: number[];
  timezone?: string;
  escalation_to?: string[];
  escalation_email?: boolean;
  is_active?: boolean;
}

export interface SLAOverdueLead {
  lead_id: string;
  lead_name: string;
  assigned_to: string | null;
  created_at: string;
  sla_deadline: string;
  hours_overdue: number;
}
