export type TemplateType = 'email' | 'sms' | 'both';

export interface TemplateVariable {
  key: string;
  label: string;
  default_value?: string;
}

export interface CRMTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: TemplateType;
  category: string;
  subject: string | null;
  body: string;
  variables: TemplateVariable[];
  usage_count: number;
  last_used_at: string | null;
  is_ai_generated: boolean;
  ai_performance_score: number | null;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  template_type: TemplateType;
  category?: string;
  subject?: string;
  body: string;
  variables?: TemplateVariable[];
  is_ai_generated?: boolean;
  is_active?: boolean;
}

export interface TemplateUpdateInput {
  name?: string;
  description?: string;
  template_type?: TemplateType;
  category?: string;
  subject?: string;
  body?: string;
  variables?: TemplateVariable[];
  is_active?: boolean;
  is_default?: boolean;
}

export interface TemplateFilters {
  template_type?: TemplateType;
  category?: string;
  is_active?: boolean;
  search?: string;
}
