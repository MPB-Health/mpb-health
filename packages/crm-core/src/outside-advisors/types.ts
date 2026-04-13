export interface OutsideAdvisor {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutsideAdvisorInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  is_active?: boolean;
  notes?: string;
}

export interface AdvisorProduction {
  advisor_id: string;
  advisor_name: string;
  leads_month: number;
  closed_month: number;
  leads_ytd: number;
  closed_ytd: number;
}
