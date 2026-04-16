// ============================================================================
// AI Service — AI-assisted features for messaging and scoring
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  AISuggestion,
  AIScoringFactor,
  SuggestionType,
  MessageAssistRequest,
  MessageAssistResponse,
} from './types';

export class AIService {
  // =========================================================================
  // SUGGESTIONS
  // =========================================================================

  /**
   * Get suggestions for a user
   */
  async getSuggestions(
    userId: string,
    options: { type?: SuggestionType; status?: string; leadId?: string; limit?: number } = {}
  ): Promise<AISuggestion[]> {
    let query = supabase
      .from('ai_suggestions')
      .select('id, org_id, user_id, lead_id, conversation_id, suggestion_type, context_type, title, content, reasoning, confidence, original_message, suggested_message, tone, suggested_score_delta, suggested_lane_id, status, user_feedback, modified_content, shown_at, acted_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.type) {
      query = query.eq('suggestion_type', options.type);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.leadId) {
      query = query.eq('lead_id', options.leadId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AIService] Failed to get suggestions:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get pending suggestions for current context
   */
  async getPendingSuggestions(
    userId: string,
    context: { leadId?: string; conversationId?: string }
  ): Promise<AISuggestion[]> {
    let query = supabase
      .from('ai_suggestions')
      .select('id, org_id, user_id, lead_id, conversation_id, suggestion_type, context_type, title, content, reasoning, confidence, original_message, suggested_message, tone, suggested_score_delta, suggested_lane_id, status, user_feedback, modified_content, shown_at, acted_at, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (context.leadId) {
      query = query.eq('lead_id', context.leadId);
    }

    if (context.conversationId) {
      query = query.eq('conversation_id', context.conversationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AIService] Failed to get pending suggestions:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Record feedback on a suggestion
   */
  async recordSuggestionFeedback(
    suggestionId: string,
    status: 'accepted' | 'rejected' | 'modified' | 'ignored',
    feedback?: string,
    modifiedContent?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('record_ai_suggestion_feedback', {
      p_suggestion_id: suggestionId,
      p_status: status,
      p_feedback: feedback || null,
      p_modified_content: modifiedContent || null,
    });

    if (error) {
      console.error('[AIService] Failed to record feedback:', error);
      throw error;
    }
  }

  /**
   * Create an AI suggestion (typically called by backend AI processor)
   */
  async createSuggestion(
    orgId: string,
    userId: string,
    suggestion: {
      type: SuggestionType;
      contextType: string;
      title: string;
      content: string;
      reasoning?: string;
      confidence?: number;
      leadId?: string;
      conversationId?: string;
      originalMessage?: string;
      suggestedMessage?: string;
      tone?: string;
      suggestedScoreDelta?: number;
      suggestedLaneId?: string;
    }
  ): Promise<AISuggestion> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert({
        org_id: orgId,
        user_id: userId,
        suggestion_type: suggestion.type,
        context_type: suggestion.contextType,
        title: suggestion.title,
        content: suggestion.content,
        reasoning: suggestion.reasoning,
        confidence: suggestion.confidence,
        lead_id: suggestion.leadId,
        conversation_id: suggestion.conversationId,
        original_message: suggestion.originalMessage,
        suggested_message: suggestion.suggestedMessage,
        tone: suggestion.tone,
        suggested_score_delta: suggestion.suggestedScoreDelta,
        suggested_lane_id: suggestion.suggestedLaneId,
        shown_at: new Date().toISOString(),
      })
      .select('id, org_id, user_id, lead_id, conversation_id, suggestion_type, context_type, title, content, reasoning, confidence, original_message, suggested_message, tone, suggested_score_delta, suggested_lane_id, status, user_feedback, modified_content, shown_at, acted_at, created_at')
      .single();

    if (error) {
      console.error('[AIService] Failed to create suggestion:', error);
      throw error;
    }

    return data as any;
  }

  // =========================================================================
  // MESSAGE ASSIST (Mock implementation - would connect to actual AI in prod)
  // =========================================================================

  /**
   * Get AI assistance for a message
   * In production, this would call an actual AI API
   */
  async getMessageAssist(
    orgId: string,
    userId: string,
    request: MessageAssistRequest
  ): Promise<MessageAssistResponse> {
    // This is a mock implementation
    // In production, you would call Claude, OpenAI, or another AI service

    const { original_message, lead_name, tone = 'professional', action = 'improve' } = request;

    let suggestedMessage = original_message || '';
    let reasoning = '';
    const complianceIssues: string[] = [];

    // Mock AI processing based on action
    switch (action) {
      case 'improve':
        suggestedMessage = this.mockImproveMessage(suggestedMessage, tone, lead_name);
        reasoning = `Enhanced message with ${tone} tone and personalization.`;
        break;

      case 'shorten':
        suggestedMessage = this.mockShortenMessage(suggestedMessage);
        reasoning = 'Condensed message while preserving key information.';
        break;

      case 'expand':
        suggestedMessage = this.mockExpandMessage(suggestedMessage, tone);
        reasoning = 'Added more context and detail to the message.';
        break;

      case 'check_compliance': {
        const issues = this.mockCheckCompliance(suggestedMessage);
        complianceIssues.push(...issues);
        reasoning = issues.length > 0
          ? 'Found potential compliance concerns.'
          : 'No compliance issues detected.';
        break;
      }
    }

    // Create a suggestion record
    const suggestion = await this.createSuggestion(orgId, userId, {
      type: 'message_draft',
      contextType: 'compose',
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Message`,
      content: suggestedMessage,
      reasoning,
      confidence: 0.85,
      originalMessage: original_message,
      suggestedMessage,
      tone,
    });

    return {
      suggestion_id: suggestion.id,
      suggested_message: suggestedMessage,
      reasoning,
      compliance_issues: complianceIssues.length > 0 ? complianceIssues : undefined,
      confidence: 0.85,
    };
  }

  // Mock helper functions
  private mockImproveMessage(message: string, tone: string, leadName?: string): string {
    let improved = message;

    // Add personalization
    if (leadName && !message.toLowerCase().includes(leadName.toLowerCase())) {
      improved = `Hi ${leadName},\n\n${improved}`;
    }

    // Adjust tone
    if (tone === 'friendly' && !message.includes('!')) {
      improved = improved.replace(/\.$/, '!');
    }

    // Add closing if missing
    if (!improved.toLowerCase().includes('best') && !improved.toLowerCase().includes('thank')) {
      improved += '\n\nBest regards';
    }

    return improved;
  }

  private mockShortenMessage(message: string): string {
    // Simple mock - remove filler phrases
    return message
      .replace(/I just wanted to /gi, '')
      .replace(/I was wondering if /gi, '')
      .replace(/Please feel free to /gi, '')
      .replace(/Don't hesitate to /gi, '')
      .trim();
  }

  private mockExpandMessage(message: string, tone: string): string {
    let expanded = message;

    if (tone === 'empathetic') {
      expanded = `I understand this can be a lot to take in. ${expanded}`;
    }

    expanded += '\n\nPlease let me know if you have any questions or would like to discuss further.';

    return expanded;
  }

  private mockCheckCompliance(message: string): string[] {
    const issues: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Check for common Medicare compliance issues
    if (lowerMessage.includes('guarantee') || lowerMessage.includes('guaranteed')) {
      issues.push('Avoid using "guarantee" - Medicare plans cannot guarantee specific outcomes.');
    }

    if (lowerMessage.includes('free') && !lowerMessage.includes('obligation')) {
      issues.push('When mentioning "free", clarify there is no obligation.');
    }

    if (lowerMessage.includes('best plan') || lowerMessage.includes('best option')) {
      issues.push('Avoid superlatives like "best" - use comparative language instead.');
    }

    if (lowerMessage.includes('limited time') || lowerMessage.includes('act now')) {
      issues.push('Avoid urgency language that could be seen as pressure tactics.');
    }

    return issues;
  }

  // =========================================================================
  // SCORING FACTORS
  // =========================================================================

  /**
   * Get AI scoring factors for a lead
   */
  async getLeadScoringFactors(leadId: string): Promise<AIScoringFactor[]> {
    const { data, error } = await supabase
      .from('ai_scoring_factors')
      .select('id, org_id, lead_id, priority_item_id, factor_type, factor_name, score_impact, analysis_data, reasoning, valid_from, valid_until, is_active, created_at')
      .eq('lead_id', leadId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AIService] Failed to get scoring factors:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Calculate total AI score adjustment for a lead
   */
  async calculateScoreAdjustment(leadId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_ai_score_adjustment', {
      p_lead_id: leadId,
    });

    if (error) {
      console.error('[AIService] Failed to calculate adjustment:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Add a scoring factor for a lead
   */
  async addScoringFactor(
    orgId: string,
    factor: {
      leadId?: string;
      priorityItemId?: string;
      factorType: string;
      factorName: string;
      scoreImpact: number;
      analysisData?: Record<string, unknown>;
      reasoning?: string;
      validDays?: number;
    }
  ): Promise<AIScoringFactor> {
    const validUntil = factor.validDays
      ? new Date(Date.now() + factor.validDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('ai_scoring_factors')
      .insert({
        org_id: orgId,
        lead_id: factor.leadId,
        priority_item_id: factor.priorityItemId,
        factor_type: factor.factorType,
        factor_name: factor.factorName,
        score_impact: factor.scoreImpact,
        analysis_data: factor.analysisData || {},
        reasoning: factor.reasoning,
        valid_until: validUntil,
      })
      .select('id, org_id, lead_id, priority_item_id, factor_type, factor_name, score_impact, analysis_data, reasoning, valid_from, valid_until, is_active, created_at')
      .single();

    if (error) {
      console.error('[AIService] Failed to add scoring factor:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Deactivate a scoring factor
   */
  async deactivateScoringFactor(factorId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_scoring_factors')
      .update({ is_active: false })
      .eq('id', factorId);

    if (error) {
      console.error('[AIService] Failed to deactivate factor:', error);
      throw error;
    }
  }

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  /**
   * Get AI suggestion acceptance rate
   */
  async getSuggestionStats(
    orgId: string,
    options: { userId?: string; days?: number } = {}
  ): Promise<{
    total: number;
    accepted: number;
    rejected: number;
    modified: number;
    ignored: number;
    acceptanceRate: number;
  }> {
    let query = supabase
      .from('ai_suggestions')
      .select('status')
      .eq('org_id', orgId)
      .neq('status', 'pending');

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.days) {
      const since = new Date(Date.now() - options.days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AIService] Failed to get stats:', error);
      return {
        total: 0,
        accepted: 0,
        rejected: 0,
        modified: 0,
        ignored: 0,
        acceptanceRate: 0,
      };
    }

    const stats = {
      total: data?.length || 0,
      accepted: data?.filter((s) => s.status === 'accepted').length || 0,
      rejected: data?.filter((s) => s.status === 'rejected').length || 0,
      modified: data?.filter((s) => s.status === 'modified').length || 0,
      ignored: data?.filter((s) => s.status === 'ignored').length || 0,
      acceptanceRate: 0,
    };

    if (stats.total > 0) {
      stats.acceptanceRate = ((stats.accepted + stats.modified) / stats.total) * 100;
    }

    return stats;
  }
}

export const aiService = new AIService();
