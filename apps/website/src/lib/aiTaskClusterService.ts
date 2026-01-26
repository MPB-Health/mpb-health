import { supabase } from './supabase';
import { crmService, type Lead, type LeadActivity, type LeadTask } from './crmService';

// ============================================================================
// Types
// ============================================================================

export interface AILeadInsights {
  id: string;
  lead_id: string;
  ai_score: number;
  score_factors: ScoreFactor[];
  conversion_probability: number;
  engagement_level: 'low' | 'medium' | 'high' | 'very_high';
  response_likelihood: 'low' | 'medium' | 'high';
  recommended_action: string | null;
  recommended_channel: 'call' | 'email' | 'sms' | 'meeting' | null;
  recommended_timing: string | null;
  follow_up_urgency: 'low' | 'normal' | 'high' | 'urgent';
  conversation_summary: string | null;
  key_points: string[];
  objections: string[];
  interests: string[];
  next_actions: NextAction[];
  draft_email_subject: string | null;
  draft_email_body: string | null;
  draft_sms: string | null;
  last_analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreFactor {
  factor: string;
  points: number;
  positive: boolean;
}

export interface NextAction {
  action: string;
  priority: 'low' | 'medium' | 'high';
  channel?: 'call' | 'email' | 'sms' | 'meeting';
  reasoning?: string;
}

export interface FollowUpSuggestion {
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  channel: 'call' | 'email' | 'sms' | 'meeting';
  timing: Date;
  reasoning: string;
  suggestedMessage?: string;
}

export interface LeadScoreResult {
  score: number;
  factors: ScoreFactor[];
  tier: 'cold' | 'warm' | 'hot' | 'very_hot';
  conversionProbability: number;
}

export interface ConversationSummary {
  summary: string;
  keyPoints: string[];
  objections: string[];
  interests: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  nextSteps: string[];
}

export interface DraftContent {
  emailSubject?: string;
  emailBody?: string;
  sms?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  trigger_conditions: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  delay_minutes: number;
  execution_count: number;
  last_executed_at: string | null;
}

export interface LeadWithInsights extends Lead {
  insights?: AILeadInsights | null;
  activities?: LeadActivity[];
  tasks?: LeadTask[];
}

// ============================================================================
// AI Task Cluster Service
// ============================================================================

class AITaskClusterService {
  private geminiEndpoint: string;

  constructor() {
    this.geminiEndpoint = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/ai-crm-agent';
  }

  // --------------------------------------------------------------------------
  // Lead Insights
  // --------------------------------------------------------------------------

  /**
   * Get AI insights for a specific lead
   */
  async getLeadInsights(leadId: string): Promise<AILeadInsights | null> {
    try {
      const { data, error } = await supabase
        .from('ai_lead_insights')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No insights yet, trigger analysis
          await this.analyzeLeadScore(leadId);
          return this.getLeadInsights(leadId);
        }
        console.error('Error fetching lead insights:', error);
        return null;
      }

      return data as AILeadInsights;
    } catch (error) {
      console.error('Get lead insights error:', error);
      return null;
    }
  }

  /**
   * Get lead with all associated insights, activities, and tasks
   */
  async getLeadWithInsights(leadId: string): Promise<LeadWithInsights | null> {
    try {
      const { data, error } = await supabase.rpc('get_lead_with_insights', {
        p_lead_id: leadId
      });

      if (error) {
        console.error('Error fetching lead with insights:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      return {
        ...result.lead,
        insights: result.insights,
        activities: result.activities,
        tasks: result.tasks,
      } as LeadWithInsights;
    } catch (error) {
      console.error('Get lead with insights error:', error);
      return null;
    }
  }

  /**
   * Get top leads by AI score
   */
  async getTopScoredLeads(limit: number = 10): Promise<LeadWithInsights[]> {
    try {
      const { data, error } = await supabase
        .from('ai_lead_insights')
        .select(`
          *,
          lead:zoho_lead_submissions(*)
        `)
        .order('ai_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top scored leads:', error);
        return [];
      }

      return (data || []).map(item => ({
        ...item.lead,
        insights: item,
      }));
    } catch (error) {
      console.error('Get top scored leads error:', error);
      return [];
    }
  }

  /**
   * Get leads requiring urgent follow-up
   */
  async getUrgentFollowUps(): Promise<LeadWithInsights[]> {
    try {
      const { data, error } = await supabase
        .from('ai_lead_insights')
        .select(`
          *,
          lead:zoho_lead_submissions(*)
        `)
        .in('follow_up_urgency', ['high', 'urgent'])
        .order('follow_up_urgency', { ascending: false })
        .order('ai_score', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching urgent follow-ups:', error);
        return [];
      }

      return (data || []).map(item => ({
        ...item.lead,
        insights: item,
      }));
    } catch (error) {
      console.error('Get urgent follow-ups error:', error);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // AI Lead Scoring
  // --------------------------------------------------------------------------

  /**
   * Trigger AI score calculation for a lead (uses database function)
   */
  async analyzeLeadScore(leadId: string): Promise<LeadScoreResult | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_lead_score_factors', {
        p_lead_id: leadId
      });

      if (error) {
        console.error('Error calculating lead score:', error);
        return null;
      }

      const score = data?.score || 0;
      const factors = data?.factors || [];

      return {
        score,
        factors,
        tier: this.getScoreTier(score),
        conversionProbability: this.estimateConversionProbability(score),
      };
    } catch (error) {
      console.error('Analyze lead score error:', error);
      return null;
    }
  }

  /**
   * Batch analyze scores for multiple leads
   */
  async batchAnalyzeScores(leadIds: string[]): Promise<Map<string, LeadScoreResult>> {
    const results = new Map<string, LeadScoreResult>();

    await Promise.all(
      leadIds.map(async (leadId) => {
        const result = await this.analyzeLeadScore(leadId);
        if (result) {
          results.set(leadId, result);
        }
      })
    );

    return results;
  }

  private getScoreTier(score: number): 'cold' | 'warm' | 'hot' | 'very_hot' {
    if (score >= 80) return 'very_hot';
    if (score >= 60) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }

  private estimateConversionProbability(score: number): number {
    // Simple conversion probability based on score
    // In production, this would be based on historical data
    return Math.min(95, Math.max(5, score * 0.8 + 10));
  }

  // --------------------------------------------------------------------------
  // Smart Follow-up Suggestions
  // --------------------------------------------------------------------------

  /**
   * Get smart follow-up suggestion for a lead
   */
  async getFollowUpSuggestion(leadId: string): Promise<FollowUpSuggestion | null> {
    try {
      const lead = await crmService.getLead(leadId);
      if (!lead) return null;

      const insights = await this.getLeadInsights(leadId);
      const activities = await crmService.getActivities(leadId, 10);
      const tasks = await crmService.getTasks(leadId, false);

      // Calculate optimal follow-up based on multiple factors
      const suggestion = this.calculateFollowUpSuggestion(lead, insights, activities, tasks);

      // Update insights with recommendation
      if (suggestion) {
        await supabase
          .from('ai_lead_insights')
          .upsert({
            lead_id: leadId,
            recommended_action: suggestion.reasoning,
            recommended_channel: suggestion.channel,
            recommended_timing: suggestion.timing.toISOString(),
            follow_up_urgency: suggestion.urgency,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'lead_id' });
      }

      return suggestion;
    } catch (error) {
      console.error('Get follow-up suggestion error:', error);
      return null;
    }
  }

  private calculateFollowUpSuggestion(
    lead: Lead,
    insights: AILeadInsights | null,
    activities: LeadActivity[],
    tasks: LeadTask[]
  ): FollowUpSuggestion {
    const now = new Date();
    const lastContactedAt = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null;
    const daysSinceContact = lastContactedAt 
      ? Math.floor((now.getTime() - lastContactedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Determine urgency
    let urgency: FollowUpSuggestion['urgency'] = 'normal';
    if (insights?.ai_score && insights.ai_score >= 80) {
      urgency = 'urgent';
    } else if (insights?.ai_score && insights.ai_score >= 60) {
      urgency = 'high';
    } else if (daysSinceContact > 5) {
      urgency = 'high';
    } else if (daysSinceContact > 3) {
      urgency = 'normal';
    } else {
      urgency = 'low';
    }

    // Determine channel based on lead preference and history
    let channel: FollowUpSuggestion['channel'] = 'email';
    if (lead.contact_preference === 'call' || lead.contact_preference === 'phone') {
      channel = 'call';
    } else if (lead.contact_preference === 'text' || lead.contact_preference === 'sms') {
      channel = 'sms';
    } else {
      // Analyze activity history for preferred channel
      const callActivities = activities.filter(a => a.activity_type === 'call').length;
      const emailActivities = activities.filter(a => a.activity_type === 'email').length;
      
      if (callActivities > emailActivities && callActivities > 0) {
        channel = 'call';
      }
    }

    // Determine timing
    let timing = new Date();
    const pendingTasks = tasks.filter(t => !t.completed);
    
    if (pendingTasks.length > 0) {
      // Use next pending task due date
      const nextTask = pendingTasks.sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      )[0];
      timing = new Date(nextTask.due_date);
    } else if (urgency === 'urgent') {
      // Within 2 hours for urgent
      timing = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    } else if (urgency === 'high') {
      // Within 4 hours for high
      timing = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    } else if (urgency === 'normal') {
      // Tomorrow for normal
      timing = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      // 2-3 days for low
      timing = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    }

    // Generate reasoning
    const reasons: string[] = [];
    if (insights?.ai_score && insights.ai_score >= 70) {
      reasons.push(`High lead score (${insights.ai_score})`);
    }
    if (daysSinceContact > 3) {
      reasons.push(`${daysSinceContact} days since last contact`);
    }
    if (lead.pipeline_stage === 'qualified' || lead.pipeline_stage === 'proposal') {
      reasons.push(`Lead is in ${lead.pipeline_stage} stage`);
    }
    if (lead.contact_preference) {
      reasons.push(`Lead prefers ${lead.contact_preference}`);
    }

    const reasoning = reasons.length > 0 
      ? `Recommended based on: ${reasons.join(', ')}`
      : 'Standard follow-up timing';

    return {
      urgency,
      channel,
      timing,
      reasoning,
    };
  }

  // --------------------------------------------------------------------------
  // Conversation Summarization (AI-powered)
  // --------------------------------------------------------------------------

  /**
   * Generate AI summary of lead conversations
   */
  async summarizeConversation(leadId: string): Promise<ConversationSummary | null> {
    try {
      const lead = await crmService.getLead(leadId);
      if (!lead) return null;

      const activities = await crmService.getActivities(leadId, 50);
      
      if (activities.length === 0) {
        return {
          summary: 'No conversation history yet.',
          keyPoints: [],
          objections: [],
          interests: [],
          sentiment: 'neutral',
          nextSteps: ['Make initial contact'],
        };
      }

      // Call AI endpoint for summarization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(this.geminiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'summarize_conversation',
          lead: {
            name: `${lead.first_name} ${lead.last_name}`,
            stage: lead.pipeline_stage,
            source: lead.source_cta,
          },
          activities: activities.map(a => ({
            type: a.activity_type,
            title: a.title,
            description: a.description,
            date: a.created_at,
          })),
        }),
      });

      if (!response.ok) {
        // Fallback to basic summary if AI fails
        return this.generateBasicSummary(lead, activities);
      }

      const result = await response.json();
      
      // Update insights with summary
      await supabase
        .from('ai_lead_insights')
        .upsert({
          lead_id: leadId,
          conversation_summary: result.summary,
          key_points: result.keyPoints || [],
          objections: result.objections || [],
          interests: result.interests || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'lead_id' });

      return result;
    } catch (error) {
      console.error('Summarize conversation error:', error);
      // Return basic summary on error
      const lead = await crmService.getLead(leadId);
      const activities = await crmService.getActivities(leadId, 50);
      return this.generateBasicSummary(lead!, activities);
    }
  }

  private generateBasicSummary(lead: Lead, activities: LeadActivity[]): ConversationSummary {
    const calls = activities.filter(a => a.activity_type === 'call').length;
    const emails = activities.filter(a => a.activity_type === 'email').length;
    const notes = activities.filter(a => a.activity_type === 'note');

    const keyPoints: string[] = [];
    if (lead.primary_concern) {
      keyPoints.push(`Primary concern: ${lead.primary_concern}`);
    }
    if (lead.coverage_preference) {
      keyPoints.push(`Coverage preference: ${lead.coverage_preference}`);
    }
    if (lead.household_size) {
      keyPoints.push(`Household size: ${lead.household_size}`);
    }

    const summary = `${lead.first_name} ${lead.last_name} is in the ${lead.pipeline_stage} stage. ` +
      `Total interactions: ${calls} calls, ${emails} emails. ` +
      (keyPoints.length > 0 ? keyPoints.join('. ') : 'No detailed information captured yet.');

    return {
      summary,
      keyPoints,
      objections: [],
      interests: notes.map(n => n.title).slice(0, 3),
      sentiment: lead.pipeline_stage === 'lost' ? 'negative' : 'neutral',
      nextSteps: this.suggestNextSteps(lead),
    };
  }

  private suggestNextSteps(lead: Lead): string[] {
    const steps: string[] = [];

    switch (lead.pipeline_stage) {
      case 'new':
        steps.push('Make initial contact within 2 hours');
        steps.push('Qualify lead needs');
        break;
      case 'contacted':
        steps.push('Schedule follow-up call');
        steps.push('Send detailed plan information');
        break;
      case 'qualified':
        steps.push('Prepare personalized proposal');
        steps.push('Address any concerns');
        break;
      case 'proposal':
        steps.push('Follow up on proposal');
        steps.push('Handle objections');
        steps.push('Close the deal');
        break;
      case 'negotiation':
        steps.push('Address final concerns');
        steps.push('Prepare enrollment paperwork');
        break;
    }

    return steps;
  }

  // --------------------------------------------------------------------------
  // Draft Generation (AI-powered)
  // --------------------------------------------------------------------------

  /**
   * Generate AI draft email/SMS for a lead
   */
  async generateDraft(
    leadId: string,
    draftType: 'email' | 'sms',
    context?: string
  ): Promise<DraftContent | null> {
    try {
      const lead = await crmService.getLead(leadId);
      if (!lead) return null;

      const insights = await this.getLeadInsights(leadId);
      const suggestion = await this.getFollowUpSuggestion(leadId);

      // Call AI endpoint for draft generation
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(this.geminiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'generate_draft',
          draft_type: draftType,
          lead: {
            first_name: lead.first_name,
            last_name: lead.last_name,
            stage: lead.pipeline_stage,
            primary_concern: lead.primary_concern,
            coverage_preference: lead.coverage_preference,
            household_size: lead.household_size,
          },
          insights: insights ? {
            score: insights.ai_score,
            urgency: insights.follow_up_urgency,
            interests: insights.interests,
          } : null,
          context: context || suggestion?.reasoning,
        }),
      });

      if (!response.ok) {
        // Return template-based draft on error
        return this.generateTemplateDraft(lead, draftType);
      }

      const result = await response.json();

      // Store draft in insights
      await supabase
        .from('ai_lead_insights')
        .upsert({
          lead_id: leadId,
          draft_email_subject: result.emailSubject || null,
          draft_email_body: result.emailBody || null,
          draft_sms: result.sms || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'lead_id' });

      return result;
    } catch (error) {
      console.error('Generate draft error:', error);
      const lead = await crmService.getLead(leadId);
      return this.generateTemplateDraft(lead!, 'email');
    }
  }

  private generateTemplateDraft(lead: Lead, draftType: 'email' | 'sms'): DraftContent {
    if (draftType === 'sms') {
      return {
        sms: `Hi ${lead.first_name}! This is your advisor from MPB Health. Just following up on your health plan inquiry. Do you have a few minutes for a quick call? Reply or call us at (855) 816-4650.`,
      };
    }

    return {
      emailSubject: `${lead.first_name}, your health coverage options are ready`,
      emailBody: `Hi ${lead.first_name},

I hope this message finds you well! I wanted to follow up on your recent inquiry about health sharing programs.

Based on what you shared with us, I think we have some great options that could work for your ${lead.household_size ? `family of ${lead.household_size}` : 'situation'}.

Would you have a few minutes for a quick call? I'd love to walk you through the best options and answer any questions you might have.

Just reply to this email or give me a call at (855) 816-4650.

Best regards,
MPB Health Advisor`,
    };
  }

  // --------------------------------------------------------------------------
  // Auto-Task Generation
  // --------------------------------------------------------------------------

  /**
   * Check and execute automation rules
   */
  async checkAutomationRules(
    triggerType: string,
    context: Record<string, unknown>
  ): Promise<void> {
    try {
      const { data: rules, error } = await supabase
        .from('ai_automation_rules')
        .select('*')
        .eq('is_active', true)
        .eq('trigger_type', triggerType);

      if (error || !rules) {
        console.error('Error fetching automation rules:', error);
        return;
      }

      for (const rule of rules) {
        if (this.checkRuleConditions(rule.trigger_conditions, context)) {
          await this.executeRule(rule as AutomationRule, context);
        }
      }
    } catch (error) {
      console.error('Check automation rules error:', error);
    }
  }

  private checkRuleConditions(
    conditions: Record<string, unknown>,
    context: Record<string, unknown>
  ): boolean {
    // If no conditions, always match
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    // Check each condition
    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'min_score' && typeof value === 'number') {
        const score = context.score as number;
        if (!score || score < value) return false;
      }
      if (key === 'to_stage' && value !== context.new_stage) {
        return false;
      }
      if (key === 'days_inactive' && typeof value === 'number') {
        const daysInactive = context.days_inactive as number;
        if (!daysInactive || daysInactive < value) return false;
      }
      if (key === 'stages' && Array.isArray(value)) {
        const stage = context.stage as string;
        if (!stage || !value.includes(stage)) return false;
      }
    }

    return true;
  }

  private async executeRule(
    rule: AutomationRule,
    context: Record<string, unknown>
  ): Promise<void> {
    try {
      const leadId = context.lead_id as string;
      const config = rule.action_config;

      switch (rule.action_type) {
        case 'create_task':
          if (leadId) {
            await crmService.createTask({
              lead_id: leadId,
              title: config.title as string || 'Auto-generated task',
              task_type: (config.task_type as LeadTask['task_type']) || 'follow_up',
              priority: (config.priority as LeadTask['priority']) || 'medium',
              due_date: new Date(
                Date.now() + ((config.due_hours as number) || 24) * 60 * 60 * 1000
              ).toISOString(),
            });
          }
          break;

        case 'send_notification':
          // This will be handled by the notification service
          console.log('Notification triggered by automation:', rule.name);
          break;

        case 'update_priority':
          if (leadId && config.priority) {
            await crmService.updateLead(leadId, {
              priority: config.priority as Lead['priority'],
            });
          }
          break;
      }

      // Update execution count
      await supabase
        .from('ai_automation_rules')
        .update({
          execution_count: rule.execution_count + 1,
          last_executed_at: new Date().toISOString(),
        })
        .eq('id', rule.id);
    } catch (error) {
      console.error('Execute rule error:', error);
    }
  }

  /**
   * Auto-create tasks for a new lead
   */
  async autoCreateTasksForNewLead(leadId: string): Promise<void> {
    await this.checkAutomationRules('new_lead', { lead_id: leadId });
  }

  /**
   * Check for leads needing follow-up and create tasks
   */
  async processInactiveLeads(): Promise<number> {
    try {
      const { data: leads, error } = await supabase
        .from('zoho_lead_submissions')
        .select('id, pipeline_stage, last_contacted_at, updated_at')
        .in('pipeline_stage', ['contacted', 'qualified', 'proposal', 'negotiation'])
        .lt('updated_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

      if (error || !leads) {
        console.error('Error fetching inactive leads:', error);
        return 0;
      }

      let tasksCreated = 0;
      for (const lead of leads) {
        const daysInactive = Math.floor(
          (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        await this.checkAutomationRules('no_activity', {
          lead_id: lead.id,
          stage: lead.pipeline_stage,
          days_inactive: daysInactive,
        });
        tasksCreated++;
      }

      return tasksCreated;
    } catch (error) {
      console.error('Process inactive leads error:', error);
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // Analytics & Reporting
  // --------------------------------------------------------------------------

  /**
   * Get AI insights summary for dashboard
   */
  async getInsightsSummary(): Promise<{
    averageScore: number;
    hotLeads: number;
    urgentFollowUps: number;
    scoreDistribution: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_lead_insights')
        .select('ai_score, follow_up_urgency');

      if (error || !data) {
        return {
          averageScore: 0,
          hotLeads: 0,
          urgentFollowUps: 0,
          scoreDistribution: {},
        };
      }

      const scores = data.map(d => d.ai_score || 0);
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const distribution: Record<string, number> = {
        'cold (0-39)': 0,
        'warm (40-59)': 0,
        'hot (60-79)': 0,
        'very_hot (80+)': 0,
      };

      scores.forEach(score => {
        if (score >= 80) distribution['very_hot (80+)']++;
        else if (score >= 60) distribution['hot (60-79)']++;
        else if (score >= 40) distribution['warm (40-59)']++;
        else distribution['cold (0-39)']++;
      });

      return {
        averageScore,
        hotLeads: data.filter(d => (d.ai_score || 0) >= 60).length,
        urgentFollowUps: data.filter(d => 
          d.follow_up_urgency === 'urgent' || d.follow_up_urgency === 'high'
        ).length,
        scoreDistribution: distribution,
      };
    } catch (error) {
      console.error('Get insights summary error:', error);
      return {
        averageScore: 0,
        hotLeads: 0,
        urgentFollowUps: 0,
        scoreDistribution: {},
      };
    }
  }

  // --------------------------------------------------------------------------
  // Templates
  // --------------------------------------------------------------------------

  /**
   * Get available CRM templates
   */
  async getTemplates(type?: 'email' | 'sms' | 'both'): Promise<Array<{
    id: string;
    name: string;
    template_type: string;
    category: string;
    subject: string | null;
    body: string;
    variables: string[];
    usage_count: number;
  }>> {
    try {
      let query = supabase
        .from('crm_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (type) {
        query = query.or(`template_type.eq.${type},template_type.eq.both`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get templates error:', error);
      return [];
    }
  }

  /**
   * Apply template with variable substitution
   */
  applyTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * Increment template usage count
   */
  async trackTemplateUsage(templateId: string): Promise<void> {
    await supabase
      .from('crm_templates')
      .update({
        usage_count: supabase.rpc('increment_usage_count'),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', templateId);
  }
}

export const aiTaskClusterService = new AITaskClusterService();

