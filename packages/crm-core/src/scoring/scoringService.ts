import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScoringWeightConfig, ScoringWeightUpdateInput, LeadScoreBreakdown, ScoreFactorDetail } from './types';

export class ScoringService {
  constructor(private supabase: SupabaseClient) {}

  async getWeights(): Promise<ScoringWeightConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from('lead_scoring_config')
        .select('id, factor_key, factor_label, weight, is_enabled, description, created_at, updated_at')
        .order('factor_key', { ascending: true });

      if (error) {
        console.error('Failed to get scoring weights:', error);
        return [];
      }
      return data as unknown as ScoringWeightConfig[];
    } catch (err) {
      console.error('Get scoring weights error:', err);
      return [];
    }
  }

  async updateWeights(inputs: ScoringWeightUpdateInput[]): Promise<{ success: boolean; error?: string }> {
    try {
      for (const input of inputs) {
        const { error } = await this.supabase
          .from('lead_scoring_config')
          .update({
            weight: input.weight,
            is_enabled: input.is_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('factor_key', input.factor_key);

        if (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err) {
      console.error('Update scoring weights error:', err);
      return { success: false, error: 'Failed to update weights' };
    }
  }

  async getScoreBreakdown(leadId: string): Promise<LeadScoreBreakdown | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_lead_insights')
        .select('ai_score, score_factors')
        .eq('lead_id', leadId)
        .single();

      if (error || !data) return null;

      const rawFactors = (data.score_factors || []) as unknown as Array<{
        factor?: string;
        label?: string;
        points?: number;
        positive?: boolean;
        weight?: number;
      }>;

      const factors: ScoreFactorDetail[] = rawFactors.map((f) => ({
        factor: f.factor || f.label || 'Unknown',
        points: f.points || 0,
        positive: f.positive !== false,
        weight_applied: f.weight || 0,
      }));

      return {
        lead_id: leadId,
        total_score: data.ai_score || 0,
        factors,
      };
    } catch (err) {
      console.error('Get score breakdown error:', err);
      return null;
    }
  }

  async recalculateAllScores(): Promise<{ success: boolean; error?: string }> {
    try {
      // Trigger the database function to recalculate all scores
      const { error } = await this.supabase.rpc('recalculate_lead_scores');
      if (error) {
        // If the RPC doesn't exist, it's not a hard failure
        console.warn('recalculate_lead_scores RPC not available:', error.message);
        return { success: false, error: 'Score recalculation function not available' };
      }
      return { success: true };
    } catch (err) {
      console.error('Recalculate scores error:', err);
      return { success: false, error: 'Failed to recalculate scores' };
    }
  }
}

export function createScoringService(supabase: SupabaseClient): ScoringService {
  return new ScoringService(supabase);
}
