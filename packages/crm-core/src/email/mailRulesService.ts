// ============================================================================
// Mail Rules Service - Inbox rules CRUD and evaluation
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export type RuleConditionField = 'from' | 'to' | 'subject' | 'body' | 'has_attachments' | 'importance' | 'category';
export type RuleConditionOperator = 'contains' | 'not_contains' | 'equals' | 'starts_with' | 'ends_with' | 'matches_regex';
export type RuleActionType = 'move_to_folder' | 'add_label' | 'remove_label' | 'mark_read' | 'mark_flagged' | 'forward' | 'delete' | 'auto_reply' | 'assign_to_user';

export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string;
}

export interface RuleAction {
  type: RuleActionType;
  folder_id?: string;
  label?: string;
  forward_to?: string;
  reply_body?: string;
  assign_user_id?: string;
}

export interface MailRule {
  id: string;
  account_id: string;
  name: string;
  is_active: boolean;
  priority: number;
  stop_processing: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  times_applied: number;
  last_applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MailRuleCreateInput {
  account_id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority?: number;
  stop_processing?: boolean;
}

export interface MailRuleUpdateInput {
  name?: string;
  is_active?: boolean;
  conditions?: RuleCondition[];
  actions?: RuleAction[];
  priority?: number;
  stop_processing?: boolean;
}

// ============================================================================
// Service
// ============================================================================

export class MailRulesService {
  constructor(private supabase: SupabaseClient) {}

  async getRules(accountId: string): Promise<MailRule[]> {
    const { data, error } = await this.supabase
      .from('mail_rules')
      .select('*')
      .eq('account_id', accountId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getRule(id: string): Promise<MailRule | null> {
    const { data, error } = await this.supabase
      .from('mail_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async createRule(input: MailRuleCreateInput): Promise<MailRule> {
    const { data, error } = await this.supabase
      .from('mail_rules')
      .insert({
        account_id: input.account_id,
        name: input.name,
        conditions: input.conditions,
        actions: input.actions,
        priority: input.priority || 0,
        stop_processing: input.stop_processing || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRule(id: string, input: MailRuleUpdateInput): Promise<MailRule> {
    const { data, error } = await this.supabase
      .from('mail_rules')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRule(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('mail_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleRule(id: string, isActive: boolean): Promise<void> {
    await this.supabase
      .from('mail_rules')
      .update({ is_active: isActive })
      .eq('id', id);
  }

  async reorderRules(accountId: string, ruleIds: string[]): Promise<void> {
    for (let i = 0; i < ruleIds.length; i++) {
      await this.supabase
        .from('mail_rules')
        .update({ priority: i })
        .eq('id', ruleIds[i])
        .eq('account_id', accountId);
    }
  }
}

export function createMailRulesService(supabase: SupabaseClient): MailRulesService {
  return new MailRulesService(supabase);
}
