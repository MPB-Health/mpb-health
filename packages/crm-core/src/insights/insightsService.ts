import type { SupabaseClient } from '@supabase/supabase-js';
import type { AILeadInsight, AIGeneratedDraft } from './types';

export class InsightsService {
  constructor(
    private supabase: SupabaseClient,
    private supabaseUrl: string
  ) {}

  async getInsights(leadId: string): Promise<AILeadInsight | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_lead_insights')
        .select('id, lead_id, ai_score, conversion_probability, score_factors, recommended_action, recommended_channel, follow_up_urgency, conversation_summary, next_actions, created_at, updated_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching insights:', error);
        return null;
      }
      return data as any;
    } catch (error) {
      console.error('Error fetching insights:', error);
      return null;
    }
  }

  async refreshInsights(leadId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Call the calculate_lead_score_factors RPC if available
      const { error: rpcError } = await this.supabase.rpc('calculate_lead_score_factors', {
        p_lead_id: leadId,
      });

      if (rpcError) {
        // Fallback: invoke AI edge function directly
        return this.invokeAIAgent(leadId, 'analyze');
      }

      return { success: true };
    } catch (error) {
      console.error('Error refreshing insights:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async generateDraft(
    leadId: string,
    type: 'email' | 'sms'
  ): Promise<{ success: boolean; draft?: AIGeneratedDraft; error?: string }> {
    try {
      const result = await this.invokeAIAgent(leadId, `draft_${type}`);
      if (!result.success) return { success: false, error: result.error };

      // The edge function should return the draft in its response
      return {
        success: true,
        draft: result.data as unknown as AIGeneratedDraft,
      };
    } catch (error) {
      console.error('Error generating draft:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async suggestNextActions(leadId: string): Promise<string[]> {
    try {
      const insights = await this.getInsights(leadId);
      return insights?.next_actions || [];
    } catch (error) {
      console.error('Error getting next actions:', error);
      return [];
    }
  }

  private async invokeAIAgent(
    leadId: string,
    action: string
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${this.supabaseUrl}/functions/v1/ai-crm-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ lead_id: leadId, action }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: text || 'AI agent request failed' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error invoking AI agent:', error);
      return { success: false, error: 'Failed to reach AI service' };
    }
  }
}

export function createInsightsService(supabase: SupabaseClient, supabaseUrl: string): InsightsService {
  return new InsightsService(supabase, supabaseUrl);
}
