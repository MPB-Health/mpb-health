// ============================================================================
// Usage Service — Tracks and manages usage metrics and limits
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type { UsageRecord, UsageWithLimit, UsageSummary } from './types';

export type UsageMetric =
  | 'users_count'
  | 'leads_count'
  | 'messages_sent'
  | 'sequences_active'
  | 'ai_assists_used'
  | 'storage_used_mb'
  | 'messages_sms'
  | 'messages_email'
  | 'ai_message_assists'
  | 'ai_score_adjustments';

export class UsageService {
  // =========================================================================
  // CURRENT USAGE
  // =========================================================================

  /**
   * Get current usage record for an organization
   */
  async getCurrentUsage(orgId: string): Promise<UsageRecord | null> {
    const { data, error } = await supabase
      .from('usage_records')
      .select('id, org_id, subscription_id, period_start, period_end, users_count, leads_count, messages_sent, sequences_active, ai_assists_used, storage_used_mb, messages_sms, messages_email, ai_message_assists, ai_score_adjustments, is_current, finalized_at, created_at, updated_at')
      .eq('org_id', orgId)
      .eq('is_current', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[UsageService] Failed to get current usage:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Get usage with limits for an organization
   */
  async getUsageWithLimits(orgId: string): Promise<UsageWithLimit[]> {
    const { data, error } = await supabase.rpc('get_usage_with_limits', {
      p_org_id: orgId,
    });

    if (error) {
      console.error('[UsageService] Failed to get usage with limits:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get usage summary with additional context
   */
  async getUsageSummary(orgId: string): Promise<UsageSummary | null> {
    const [currentUsage, usageWithLimits] = await Promise.all([
      this.getCurrentUsage(orgId),
      this.getUsageWithLimits(orgId),
    ]);

    if (!currentUsage) {
      return null;
    }

    const limitsExceeded = usageWithLimits
      .filter(u => u.limit_value !== null && u.current_value >= u.limit_value)
      .map(u => u.metric);

    const periodEnd = new Date(currentUsage.period_end);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      period_start: currentUsage.period_start,
      period_end: currentUsage.period_end,
      metrics: usageWithLimits,
      limits_exceeded: limitsExceeded,
      days_remaining: daysRemaining,
    };
  }

  // =========================================================================
  // USAGE TRACKING
  // =========================================================================

  /**
   * Increment a usage metric
   */
  async incrementUsage(orgId: string, metric: UsageMetric, amount: number = 1): Promise<void> {
    const { error } = await supabase.rpc('increment_usage', {
      p_org_id: orgId,
      p_metric: metric,
      p_amount: amount,
    });

    if (error) {
      console.error('[UsageService] Failed to increment usage:', error);
      throw error;
    }
  }

  /**
   * Track a message sent
   */
  async trackMessageSent(orgId: string, channel: 'sms' | 'email'): Promise<void> {
    await Promise.all([
      this.incrementUsage(orgId, 'messages_sent', 1),
      this.incrementUsage(orgId, channel === 'sms' ? 'messages_sms' : 'messages_email', 1),
    ]);
  }

  /**
   * Track AI assist usage
   */
  async trackAIAssist(orgId: string, type: 'message' | 'score'): Promise<void> {
    await Promise.all([
      this.incrementUsage(orgId, 'ai_assists_used', 1),
      this.incrementUsage(orgId, type === 'message' ? 'ai_message_assists' : 'ai_score_adjustments', 1),
    ]);
  }

  /**
   * Update user count
   */
  async updateUserCount(orgId: string, count: number): Promise<void> {
    const current = await this.getCurrentUsage(orgId);
    if (!current) return;

    const { error } = await supabase
      .from('usage_records')
      .update({ users_count: count })
      .eq('id', current.id);

    if (error) {
      console.error('[UsageService] Failed to update user count:', error);
      throw error;
    }
  }

  /**
   * Update lead count
   */
  async updateLeadCount(orgId: string, count: number): Promise<void> {
    const current = await this.getCurrentUsage(orgId);
    if (!current) return;

    const { error } = await supabase
      .from('usage_records')
      .update({ leads_count: count })
      .eq('id', current.id);

    if (error) {
      console.error('[UsageService] Failed to update lead count:', error);
      throw error;
    }
  }

  /**
   * Update active sequences count
   */
  async updateSequenceCount(orgId: string, count: number): Promise<void> {
    const current = await this.getCurrentUsage(orgId);
    if (!current) return;

    const { error } = await supabase
      .from('usage_records')
      .update({ sequences_active: count })
      .eq('id', current.id);

    if (error) {
      console.error('[UsageService] Failed to update sequence count:', error);
      throw error;
    }
  }

  /**
   * Update storage usage
   */
  async updateStorageUsage(orgId: string, usedMb: number): Promise<void> {
    const current = await this.getCurrentUsage(orgId);
    if (!current) return;

    const { error } = await supabase
      .from('usage_records')
      .update({ storage_used_mb: usedMb })
      .eq('id', current.id);

    if (error) {
      console.error('[UsageService] Failed to update storage usage:', error);
      throw error;
    }
  }

  // =========================================================================
  // LIMIT CHECKING
  // =========================================================================

  /**
   * Check if a usage limit has been exceeded
   */
  async checkLimitExceeded(orgId: string, metric: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_usage_limit', {
      p_org_id: orgId,
      p_metric: metric,
    });

    if (error) {
      console.error('[UsageService] Failed to check limit:', error);
      return false;
    }

    return data as any;
  }

  /**
   * Check if user can perform an action (within limits)
   */
  async canPerformAction(
    orgId: string,
    action: 'send_message' | 'add_lead' | 'add_sequence' | 'use_ai_assist'
  ): Promise<{ allowed: boolean; reason?: string }> {
    const metricMap: Record<typeof action, string> = {
      send_message: 'messages',
      add_lead: 'leads',
      add_sequence: 'sequences',
      use_ai_assist: 'ai_assists',
    };

    const metric = metricMap[action];
    const exceeded = await this.checkLimitExceeded(orgId, metric);

    if (exceeded) {
      return {
        allowed: false,
        reason: `You have reached your ${metric.replace('_', ' ')} limit for this billing period.`,
      };
    }

    return { allowed: true };
  }

  // =========================================================================
  // USAGE HISTORY
  // =========================================================================

  /**
   * Get usage history for an organization
   */
  async getUsageHistory(
    orgId: string,
    options: { months?: number } = {}
  ): Promise<UsageRecord[]> {
    const months = options.months || 12;
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const { data, error } = await supabase
      .from('usage_records')
      .select('id, org_id, subscription_id, period_start, period_end, users_count, leads_count, messages_sent, sequences_active, ai_assists_used, storage_used_mb, messages_sms, messages_email, ai_message_assists, ai_score_adjustments, is_current, finalized_at, created_at, updated_at')
      .eq('org_id', orgId)
      .gte('period_start', since.toISOString())
      .order('period_start', { ascending: false });

    if (error) {
      console.error('[UsageService] Failed to get usage history:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Finalize current period and start new one
   */
  async finalizePeriod(orgId: string): Promise<void> {
    const { error } = await supabase.rpc('finalize_usage_period', {
      p_org_id: orgId,
    });

    if (error) {
      console.error('[UsageService] Failed to finalize period:', error);
      throw error;
    }
  }

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  /**
   * Get usage trends (comparison between periods)
   */
  async getUsageTrends(orgId: string): Promise<{
    current: UsageRecord | null;
    previous: UsageRecord | null;
    changes: Record<string, { value: number; percent: number }>;
  }> {
    const history = await this.getUsageHistory(orgId, { months: 2 });

    const current = history.find(u => u.is_current) || history[0] || null;
    const previous = history.find(u => !u.is_current && u.finalized_at) || history[1] || null;

    const changes: Record<string, { value: number; percent: number }> = {};

    if (current && previous) {
      const metrics: (keyof UsageRecord)[] = [
        'messages_sent',
        'leads_count',
        'ai_assists_used',
        'sequences_active',
      ];

      metrics.forEach(metric => {
        const currentVal = (current[metric] as number) || 0;
        const previousVal = (previous[metric] as number) || 0;
        const change = currentVal - previousVal;
        const percent = previousVal > 0 ? (change / previousVal) * 100 : 0;

        changes[metric] = {
          value: change,
          percent: Math.round(percent * 10) / 10,
        };
      });
    }

    return { current, previous, changes };
  }

  /**
   * Calculate projected usage for end of period
   */
  async getProjectedUsage(orgId: string): Promise<Record<string, number>> {
    const summary = await this.getUsageSummary(orgId);
    if (!summary) return {};

    const periodStart = new Date(summary.period_start);
    const periodEnd = new Date(summary.period_end);
    const now = new Date();

    const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);

    if (daysElapsed <= 0) return {};

    const projections: Record<string, number> = {};

    summary.metrics.forEach(metric => {
      const dailyRate = metric.current_value / daysElapsed;
      const projected = Math.round(dailyRate * totalDays);
      projections[metric.metric] = projected;
    });

    return projections;
  }
}

export const usageService = new UsageService();
