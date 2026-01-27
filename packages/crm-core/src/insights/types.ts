export interface AILeadInsight {
  id: string;
  lead_id: string;
  ai_score: number;
  conversion_probability: number;
  score_factors: ScoreFactor[];
  recommended_action: string;
  recommended_channel: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  conversation_summary?: string;
  next_best_actions: string[];
  created_at: string;
  updated_at?: string;
}

export interface ScoreFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface AIGeneratedDraft {
  type: 'email' | 'sms';
  subject?: string;
  body: string;
}
