import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AutomationRule,
  AutomationRuleCreateInput,
  AutomationRuleUpdateInput,
  AutomationExecutionLog,
  AutomationEvent,
} from './types';

export class AutomationService {
  constructor(
    private supabase: SupabaseClient,
    private supabaseUrl: string,
  ) {}

  // ─── CRUD ───────────────────────────────────────────────────────

  async listRules(): Promise<AutomationRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to list automation rules:', error);
        return [];
      }
      return data as AutomationRule[];
    } catch (err) {
      console.error('List automation rules error:', err);
      return [];
    }
  }

  async getRule(id: string): Promise<AutomationRule | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_automation_rules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get automation rule:', error);
        return null;
      }
      return data as AutomationRule;
    } catch (err) {
      console.error('Get automation rule error:', err);
      return null;
    }
  }

  async createRule(
    input: AutomationRuleCreateInput,
  ): Promise<{ success: boolean; data?: AutomationRule; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('ai_automation_rules')
        .insert({
          name: input.name,
          description: input.description ?? null,
          is_active: input.is_active ?? true,
          trigger_type: input.trigger_type,
          trigger_conditions: input.trigger_conditions ?? {},
          action_type: input.action_type,
          action_config: input.action_config ?? {},
          delay_minutes: input.delay_minutes ?? 0,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as AutomationRule };
    } catch (err) {
      console.error('Create automation rule error:', err);
      return { success: false, error: 'Failed to create rule' };
    }
  }

  async updateRule(
    id: string,
    updates: AutomationRuleUpdateInput,
  ): Promise<{ success: boolean; data?: AutomationRule; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('ai_automation_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as AutomationRule };
    } catch (err) {
      console.error('Update automation rule error:', err);
      return { success: false, error: 'Failed to update rule' };
    }
  }

  async deleteRule(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('ai_automation_rules')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      console.error('Delete automation rule error:', err);
      return { success: false, error: 'Failed to delete rule' };
    }
  }

  async toggleRule(
    id: string,
    isActive: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateRule(id, { is_active: isActive });
  }

  // ─── Execution History ──────────────────────────────────────────

  async getExecutionHistory(
    ruleId?: string,
    limit: number = 50,
  ): Promise<AutomationExecutionLog[]> {
    try {
      let query = this.supabase
        .from('automation_execution_log')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (ruleId) {
        query = query.eq('rule_id', ruleId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get execution history:', error);
        return [];
      }
      return data as AutomationExecutionLog[];
    } catch (err) {
      console.error('Get execution history error:', err);
      return [];
    }
  }

  // ─── Event Engine ───────────────────────────────────────────────

  async evaluateEvent(event: AutomationEvent): Promise<void> {
    try {
      const { data: rules, error } = await this.supabase
        .from('ai_automation_rules')
        .select('*')
        .eq('is_active', true)
        .eq('trigger_type', event.type);

      if (error || !rules?.length) return;

      for (const rule of rules as AutomationRule[]) {
        const matches = this.matchesConditions(rule.trigger_conditions, event);
        if (!matches) {
          await this.logExecution(rule, event.leadId, 'skipped', 'Conditions not met');
          continue;
        }

        try {
          const message = await this.executeAction(rule, event.leadId);
          await this.logExecution(rule, event.leadId, 'success', message);

          // Bump execution count
          await this.supabase
            .from('ai_automation_rules')
            .update({
              execution_count: (rule.execution_count || 0) + 1,
              last_executed_at: new Date().toISOString(),
            })
            .eq('id', rule.id);
        } catch (actionErr) {
          const msg = actionErr instanceof Error ? actionErr.message : 'Unknown error';
          await this.logExecution(rule, event.leadId, 'failed', msg);
        }
      }
    } catch (err) {
      console.error('Evaluate automation event error:', err);
    }
  }

  // ─── Private ────────────────────────────────────────────────────

  private matchesConditions(
    conditions: Record<string, unknown>,
    event: AutomationEvent,
  ): boolean {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    const data = event.data ?? {};

    // Stage change: check to_stage
    if (conditions.to_stage && data.to_stage !== conditions.to_stage) return false;

    // High score: check min_score
    if (conditions.min_score && typeof data.score === 'number') {
      if (data.score < (conditions.min_score as number)) return false;
    }

    // No activity: check days_inactive
    if (conditions.days_inactive && typeof data.days_inactive === 'number') {
      if (data.days_inactive < (conditions.days_inactive as number)) return false;
    }

    // Stages filter
    if (Array.isArray(conditions.stages) && data.current_stage) {
      if (!conditions.stages.includes(data.current_stage as string)) return false;
    }

    return true;
  }

  private async executeAction(rule: AutomationRule, leadId: string): Promise<string> {
    const config = rule.action_config;

    switch (rule.action_type) {
      case 'create_task': {
        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + ((config.due_hours as number) || 24));

        const { error } = await this.supabase.from('lead_tasks').insert({
          lead_id: leadId,
          title: (config.title as string) || `Auto: ${rule.name}`,
          task_type: (config.task_type as string) || 'follow_up',
          priority: (config.priority as string) || 'medium',
          due_date: dueDate.toISOString(),
          completed: false,
        });
        if (error) throw new Error(error.message);
        return `Task created: ${config.title || rule.name}`;
      }

      case 'send_notification': {
        const { error } = await this.supabase.from('crm_notifications').insert({
          lead_id: leadId,
          type: 'automation',
          title: `Automation: ${rule.name}`,
          message: rule.description || `Automation rule "${rule.name}" triggered`,
          urgency: (config.urgency as string) || 'normal',
          channels: config.channels || ['push'],
        });
        if (error) throw new Error(error.message);
        return `Notification sent: ${rule.name}`;
      }

      case 'assign_lead': {
        const userId = config.user_id as string;
        if (!userId) throw new Error('No user_id in action config');
        const { error } = await this.supabase
          .from('lead_submissions')
          .update({ assigned_to: userId })
          .eq('id', leadId);
        if (error) throw new Error(error.message);
        return `Lead assigned to ${userId}`;
      }

      case 'update_priority': {
        const priority = config.priority as string;
        if (!priority) throw new Error('No priority in action config');
        const { error } = await this.supabase
          .from('lead_submissions')
          .update({ priority })
          .eq('id', leadId);
        if (error) throw new Error(error.message);
        return `Priority updated to ${priority}`;
      }

      case 'send_email': {
        const templateId = config.template_id as string;
        if (!templateId) throw new Error('No template_id in action config');
        // Invoke the send-email edge function
        const { error } = await this.supabase.functions.invoke('send-crm-email', {
          body: { lead_id: leadId, template_id: templateId },
        });
        if (error) throw new Error(error.message);
        return `Email sent using template ${templateId}`;
      }

      case 'send_slack': {
        // Placeholder — Slack integration would go here
        return 'Slack action skipped (not configured)';
      }

      default:
        return `Unknown action type: ${rule.action_type}`;
    }
  }

  private async logExecution(
    rule: AutomationRule,
    leadId: string,
    status: 'success' | 'failed' | 'skipped',
    message: string,
  ): Promise<void> {
    try {
      await this.supabase.from('automation_execution_log').insert({
        rule_id: rule.id,
        rule_name: rule.name,
        trigger_type: rule.trigger_type,
        action_type: rule.action_type,
        lead_id: leadId,
        status,
        result_message: message,
      });
    } catch (err) {
      console.error('Failed to log automation execution:', err);
    }
  }
}

export function createAutomationService(
  supabase: SupabaseClient,
  supabaseUrl: string,
): AutomationService {
  return new AutomationService(supabase, supabaseUrl);
}
