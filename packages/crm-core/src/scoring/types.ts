export interface ScoringWeightConfig {
  id: string;
  factor_key: string;
  factor_label: string;
  weight: number; // 0-100
  is_enabled: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ScoringWeightUpdateInput {
  factor_key: string;
  weight: number;
  is_enabled: boolean;
}

export interface LeadScoreBreakdown {
  lead_id: string;
  total_score: number;
  factors: ScoreFactorDetail[];
}

export interface ScoreFactorDetail {
  factor: string;
  points: number;
  positive: boolean;
  weight_applied: number;
}
