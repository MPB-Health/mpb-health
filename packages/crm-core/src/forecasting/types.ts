export type ForecastType = 'monthly' | 'quarterly' | 'annual';
export type ForecastStatus = 'draft' | 'active' | 'closed';
export type ForecastCategory = 'committed' | 'best_case' | 'pipeline' | 'omitted';

export interface Forecast {
  id: string;
  org_id: string;
  name: string;
  period_start: string;
  period_end: string;
  forecast_type: ForecastType;
  status: ForecastStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ForecastEntry {
  id: string;
  forecast_id: string;
  deal_id: string;
  user_id: string | null;
  amount: number;
  probability: number;
  weighted_amount: number;
  forecast_category: ForecastCategory;
  stage: string | null;
  close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForecastEntryWithDeal extends ForecastEntry {
  deal?: {
    id: string;
    name: string;
    account_id: string | null;
    owner_id: string | null;
    account?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface ForecastSummary {
  total_pipeline: number;
  committed: number;
  best_case: number;
  pipeline: number;
  omitted: number;
  closed_won: number;
  weighted_total: number;
  deal_count: number;
  forecast_accuracy: number | null;
}

export interface ForecastFilters {
  status?: ForecastStatus;
  forecast_type?: ForecastType;
  dateFrom?: string;
  dateTo?: string;
}

export interface ForecastCreateInput {
  name: string;
  period_start: string;
  period_end: string;
  forecast_type: ForecastType;
  status?: ForecastStatus;
}

export interface ForecastEntryUpdateInput {
  forecast_category?: ForecastCategory;
  amount?: number;
  probability?: number;
  notes?: string;
}

export interface DealStageMetrics {
  stage_id: string;
  stage_name: string;
  stage_display_name: string;
  sort_order: number;
  is_won_stage: boolean;
  is_lost_stage: boolean;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  win_rate: number;
  avg_deal_size: number;
  avg_days_in_stage: number;
}

export interface PipelineHealth {
  total_pipeline_value: number;
  committed_value: number;
  coverage_ratio: number;
  avg_deal_velocity_days: number;
  deals_at_risk: number;
  deals_closing_this_month: number;
}

export interface RepForecast {
  user_id: string;
  user_email: string;
  user_name: string | null;
  committed: number;
  best_case: number;
  pipeline: number;
  weighted_total: number;
  deal_count: number;
}
