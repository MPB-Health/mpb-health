// ============================================================================
// Priority Service — Manages Priority OS (lanes, items, scoring)
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  PriorityLane,
  PriorityItemWithDetails,
  ScoringRule,
  PowerListItem,
  CreateLaneInput,
  UpdateLaneInput,
  AddToLaneInput,
  MoveItemInput,
  SnoozeItemInput,
  CreateScoringRuleInput,
} from './types';

export class PriorityService {
  // =========================================================================
  // LANES
  // =========================================================================

  /**
   * Get all priority lanes for an org
   */
  async getLanes(orgId: string, includeInactive = false): Promise<PriorityLane[]> {
    let query = supabase
      .from('priority_lanes')
      .select('id, org_id, name, description, color, icon, order_index, is_default, is_active, auto_rules, max_items, created_by, created_at, updated_at')
      .eq('org_id', orgId)
      .order('order_index', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PriorityService] Failed to get lanes:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get a single lane by ID
   */
  async getLane(laneId: string): Promise<PriorityLane | null> {
    const { data, error } = await supabase
      .from('priority_lanes')
      .select('id, org_id, name, description, color, icon, order_index, is_default, is_active, auto_rules, max_items, created_by, created_at, updated_at')
      .eq('id', laneId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[PriorityService] Failed to get lane:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Create a new priority lane
   */
  async createLane(orgId: string, input: CreateLaneInput): Promise<PriorityLane> {
    const { data, error } = await supabase
      .from('priority_lanes')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        color: input.color || '#6B7280',
        icon: input.icon || 'flag',
        order_index: input.order_index ?? 0,
        is_default: input.is_default ?? false,
        auto_rules: input.auto_rules || [],
        max_items: input.max_items,
      })
      .select('id, org_id, name, description, color, icon, order_index, is_default, is_active, auto_rules, max_items, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('[PriorityService] Failed to create lane:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Update a priority lane
   */
  async updateLane(laneId: string, input: UpdateLaneInput): Promise<PriorityLane> {
    const { data, error } = await supabase
      .from('priority_lanes')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', laneId)
      .select('id, org_id, name, description, color, icon, order_index, is_default, is_active, auto_rules, max_items, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('[PriorityService] Failed to update lane:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Delete a priority lane
   */
  async deleteLane(laneId: string): Promise<void> {
    const { error } = await supabase
      .from('priority_lanes')
      .delete()
      .eq('id', laneId);

    if (error) {
      console.error('[PriorityService] Failed to delete lane:', error);
      throw error;
    }
  }

  /**
   * Reorder lanes
   */
  async reorderLanes(orgId: string, laneIds: string[]): Promise<void> {
    const updates = laneIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('priority_lanes')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('org_id', orgId);

      if (error) {
        console.error('[PriorityService] Failed to reorder lane:', error);
        throw error;
      }
    }
  }

  // =========================================================================
  // ITEMS
  // =========================================================================

  /**
   * Get the power list (prioritized items for today)
   */
  async getPowerList(orgId: string, userId?: string, limit = 20): Promise<PowerListItem[]> {
    const { data, error } = await supabase.rpc('get_power_list', {
      p_org_id: orgId,
      p_user_id: userId || null,
      p_limit: limit,
    });

    if (error) {
      console.error('[PriorityService] Failed to get power list:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get items in a specific lane
   */
  async getLaneItems(
    laneId: string,
    options: { includeCompleted?: boolean; limit?: number } = {}
  ): Promise<PriorityItemWithDetails[]> {
    let query = supabase
      .from('priority_items')
      .select(`
        *,
        lane:priority_lanes(*),
        lead:lead_submissions(id, first_name, last_name, email, phone, pipeline_stage, priority, last_contacted_at)
      `)
      .eq('lane_id', laneId)
      .order('score', { ascending: false })
      .order('rank', { ascending: true, nullsFirst: false });

    if (!options.includeCompleted) {
      query = query.is('completed_at', null);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PriorityService] Failed to get lane items:', error);
      throw error;
    }

    return (data || []) as unknown as PriorityItemWithDetails[];
  }

  /**
   * Get all items for a user
   */
  async getUserItems(
    orgId: string,
    userId: string,
    options: { includeCompleted?: boolean; includeSnoozed?: boolean } = {}
  ): Promise<PriorityItemWithDetails[]> {
    let query = supabase
      .from('priority_items')
      .select(`
        *,
        lane:priority_lanes(*),
        lead:lead_submissions(id, first_name, last_name, email, phone, pipeline_stage, priority, last_contacted_at)
      `)
      .eq('org_id', orgId)
      .eq('owner_user_id', userId)
      .order('score', { ascending: false });

    if (!options.includeCompleted) {
      query = query.is('completed_at', null);
    }

    if (!options.includeSnoozed) {
      query = query.or('snoozed_until.is.null,snoozed_until.lt.now()');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PriorityService] Failed to get user items:', error);
      throw error;
    }

    return (data || []) as unknown as PriorityItemWithDetails[];
  }

  /**
   * Add a lead/contact to a priority lane
   */
  async addToLane(orgId: string, input: AddToLaneInput): Promise<string> {
    if (input.lead_id) {
      const { data, error } = await supabase.rpc('add_to_priority_lane', {
        p_org_id: orgId,
        p_lane_id: input.lane_id,
        p_lead_id: input.lead_id,
        p_reason: input.reason || null,
        p_owner_user_id: input.owner_user_id || null,
      });

      if (error) {
        console.error('[PriorityService] Failed to add to lane:', error);
        throw error;
      }

      return data as any;
    }

    // Direct insert for contacts or when RPC not available
    const { data, error } = await supabase
      .from('priority_items')
      .insert({
        org_id: orgId,
        lane_id: input.lane_id,
        lead_id: input.lead_id,
        contact_id: input.contact_id,
        reason: input.reason,
        owner_user_id: input.owner_user_id,
        score: 50,
        source: 'manual',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[PriorityService] Failed to add to lane:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Move an item to a different lane
   */
  async moveItem(input: MoveItemInput): Promise<void> {
    const { error } = await supabase.rpc('move_priority_item', {
      p_item_id: input.item_id,
      p_new_lane_id: input.new_lane_id,
      p_new_rank: input.new_rank ?? null,
    });

    if (error) {
      console.error('[PriorityService] Failed to move item:', error);
      throw error;
    }
  }

  /**
   * Update item score
   */
  async updateScore(itemId: string, scoreDelta: number): Promise<void> {
    const { data: item } = await supabase
      .from('priority_items')
      .select('score')
      .eq('id', itemId)
      .single();

    if (!item) return;

    const newScore = Math.max(0, Math.min(100, item.score + scoreDelta));

    const { error } = await supabase
      .from('priority_items')
      .update({ score: newScore })
      .eq('id', itemId);

    if (error) {
      console.error('[PriorityService] Failed to update score:', error);
      throw error;
    }
  }

  /**
   * Snooze an item
   */
  async snoozeItem(input: SnoozeItemInput): Promise<void> {
    const { error } = await supabase.rpc('snooze_priority_item', {
      p_item_id: input.item_id,
      p_until: input.until.toISOString(),
      p_reason: input.reason || null,
    });

    if (error) {
      console.error('[PriorityService] Failed to snooze item:', error);
      throw error;
    }
  }

  /**
   * Unsnooze an item
   */
  async unsnoozeItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('priority_items')
      .update({
        snoozed_until: null,
        snooze_reason: null,
      })
      .eq('id', itemId);

    if (error) {
      console.error('[PriorityService] Failed to unsnooze item:', error);
      throw error;
    }
  }

  /**
   * Complete/dismiss an item
   */
  async completeItem(itemId: string, reason?: string): Promise<void> {
    const { error } = await supabase.rpc('complete_priority_item', {
      p_item_id: itemId,
      p_reason: reason || null,
    });

    if (error) {
      console.error('[PriorityService] Failed to complete item:', error);
      throw error;
    }
  }

  /**
   * Record an action on an item
   */
  async recordAction(itemId: string, nextActionAt?: Date): Promise<void> {
    const { error } = await supabase
      .from('priority_items')
      .update({
        last_action_at: new Date().toISOString(),
        next_action_at: nextActionAt?.toISOString() || null,
      })
      .eq('id', itemId);

    if (error) {
      console.error('[PriorityService] Failed to record action:', error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('priority_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('[PriorityService] Failed to delete item:', error);
      throw error;
    }
  }

  // =========================================================================
  // SCORING RULES
  // =========================================================================

  /**
   * Get all scoring rules for an org
   */
  async getScoringRules(orgId: string, activeOnly = true): Promise<ScoringRule[]> {
    let query = supabase
      .from('scoring_rules')
      .select('id, org_id, name, description, trigger_type, conditions, score_delta, lane_assignment, priority_boost, notify_owner, notification_message, is_active, execution_order, times_triggered, last_triggered_at, created_by, created_at, updated_at')
      .eq('org_id', orgId)
      .order('execution_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PriorityService] Failed to get scoring rules:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Create a scoring rule
   */
  async createScoringRule(orgId: string, input: CreateScoringRuleInput): Promise<ScoringRule> {
    const { data, error } = await supabase
      .from('scoring_rules')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        trigger_type: input.trigger_type,
        conditions: input.conditions || {},
        score_delta: input.score_delta ?? 0,
        lane_assignment: input.lane_assignment,
        priority_boost: input.priority_boost ?? false,
        notify_owner: input.notify_owner ?? false,
        notification_message: input.notification_message,
        execution_order: input.execution_order ?? 0,
        is_active: true,
      })
      .select('id, org_id, name, description, trigger_type, conditions, score_delta, lane_assignment, priority_boost, notify_owner, notification_message, is_active, execution_order, times_triggered, last_triggered_at, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('[PriorityService] Failed to create scoring rule:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Update a scoring rule
   */
  async updateScoringRule(ruleId: string, updates: Partial<CreateScoringRuleInput>): Promise<ScoringRule> {
    const { data, error } = await supabase
      .from('scoring_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select('id, org_id, name, description, trigger_type, conditions, score_delta, lane_assignment, priority_boost, notify_owner, notification_message, is_active, execution_order, times_triggered, last_triggered_at, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('[PriorityService] Failed to update scoring rule:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Toggle a scoring rule's active status
   */
  async toggleScoringRule(ruleId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('scoring_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId);

    if (error) {
      console.error('[PriorityService] Failed to toggle scoring rule:', error);
      throw error;
    }
  }

  /**
   * Delete a scoring rule
   */
  async deleteScoringRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('scoring_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('[PriorityService] Failed to delete scoring rule:', error);
      throw error;
    }
  }

  // =========================================================================
  // STATS
  // =========================================================================

  /**
   * Get priority stats for dashboard
   */
  async getStats(orgId: string, _userId?: string): Promise<{
    totalItems: number;
    byLane: { laneId: string; laneName: string; count: number }[];
    snoozedCount: number;
    completedToday: number;
  }> {
    // Get lane counts
    const { data: laneCounts, error: laneError } = await supabase
      .from('priority_items')
      .select('lane_id, priority_lanes(name)')
      .eq('org_id', orgId)
      .is('completed_at', null)
      .or('snoozed_until.is.null,snoozed_until.lt.now()');

    if (laneError) {
      console.error('[PriorityService] Failed to get stats:', laneError);
      throw laneError;
    }

    const byLane: Record<string, { laneId: string; laneName: string; count: number }> = {};
    for (const item of laneCounts || []) {
      const laneId = item.lane_id;
      const laneName = (item.priority_lanes as { name?: string } | null)?.name || 'Unknown';
      if (!byLane[laneId]) {
        byLane[laneId] = { laneId, laneName, count: 0 };
      }
      byLane[laneId].count++;
    }

    // Get snoozed count
    const { count: snoozedCount } = await supabase
      .from('priority_items')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('completed_at', null)
      .not('snoozed_until', 'is', null)
      .gt('snoozed_until', new Date().toISOString());

    // Get completed today count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: completedToday } = await supabase
      .from('priority_items')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('completed_at', todayStart.toISOString());

    return {
      totalItems: laneCounts?.length || 0,
      byLane: Object.values(byLane),
      snoozedCount: snoozedCount || 0,
      completedToday: completedToday || 0,
    };
  }
}

// Export singleton instance
export const priorityService = new PriorityService();
