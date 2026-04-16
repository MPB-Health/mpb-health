import { supabase } from '@mpbhealth/database';
import type { DashboardMetrics, ActivityMetric, TopPerformer } from '../types';

export class AnalyticsService {
  // Get dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [
      userStats,
      advisorStats,
      enrollmentStats,
      leadStats,
    ] = await Promise.all([
      this.getUserStats(),
      this.getAdvisorStats(),
      this.getEnrollmentStats(),
      this.getLeadStats(),
    ]);

    return {
      total_users: userStats.total,
      active_users: userStats.active,
      total_advisors: advisorStats.total,
      active_advisors: advisorStats.active,
      pending_enrollments: enrollmentStats.pending,
      total_leads: leadStats.total,
      conversion_rate: leadStats.conversionRate,
      new_leads_today: leadStats.today,
      new_leads_this_week: leadStats.thisWeek,
      new_leads_this_month: leadStats.thisMonth,
    };
  }

  // Get user stats
  private async getUserStats(): Promise<{ total: number; active: number }> {
    const { count: total } = await supabase
      .from('admin_users')
      .select('id', { count: 'exact', head: true });

    const { count: active } = await supabase
      .from('admin_users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    return { total: total || 0, active: active || 0 };
  }

  // Get advisor stats
  private async getAdvisorStats(): Promise<{ total: number; active: number }> {
    const { count: total } = await supabase
      .from('advisor_profiles')
      .select('id', { count: 'exact', head: true });

    const { count: active } = await supabase
      .from('advisor_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    return { total: total || 0, active: active || 0 };
  }

  // Get enrollment stats
  private async getEnrollmentStats(): Promise<{ pending: number }> {
    try {
      const { count: pending, error } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) return { pending: 0 };
      return { pending: pending || 0 };
    } catch {
      return { pending: 0 };
    }
  }

  // Get lead stats
  private async getLeadStats(): Promise<{
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    conversionRate: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, today, thisWeek, thisMonth, converted] = await Promise.all([
      supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .then((r) => r.count || 0),
      supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString())
        .then((r) => r.count || 0),
      supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString())
        .then((r) => r.count || 0),
      supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .then((r) => r.count || 0),
      supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('pipeline_stage', 'closed_won')
        .then((r) => r.count || 0),
    ]);

    return {
      total,
      today,
      thisWeek,
      thisMonth,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
    };
  }

  // Get activity over time
  async getActivityOverTime(
    metric: 'leads' | 'users' | 'enrollments',
    days = 30
  ): Promise<ActivityMetric[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const table = {
      leads: 'lead_submissions',
      users: 'admin_users',
      enrollments: 'enrollments',
    }[metric];

    const { data, error } = await supabase
      .from(table)
      .select('created_at')
      .gte('created_at', fromDate.toISOString());

    if (error) return [];

    // Group by date
    const countByDate: Record<string, number> = {};
    (data || []).forEach((item) => {
      const date = item.created_at.split('T')[0];
      countByDate[date] = (countByDate[date] || 0) + 1;
    });

    // Fill in missing dates
    const result: ActivityMetric[] = [];
    const currentDate = new Date(fromDate);
    while (currentDate <= new Date()) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: countByDate[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  // Get top performers (advisors with most conversions)
  async getTopPerformers(limit = 5): Promise<TopPerformer[]> {
    const { data, error } = await supabase
      .from('lead_submissions')
      .select('assigned_to, pipeline_stage')
      .not('assigned_to', 'is', null);

    if (error) return [];

    // Count conversions per advisor
    const advisorStats: Record<string, { total: number; converted: number }> = {};
    (data || []).forEach((lead) => {
      if (!lead.assigned_to) return;
      if (!advisorStats[lead.assigned_to]) {
        advisorStats[lead.assigned_to] = { total: 0, converted: 0 };
      }
      advisorStats[lead.assigned_to].total++;
      if (lead.pipeline_stage === 'closed_won') {
        advisorStats[lead.assigned_to].converted++;
      }
    });

    // Get advisor names
    const advisorIds = Object.keys(advisorStats);
    const { data: advisors } = await supabase
      .from('advisor_profiles')
      .select('id, first_name, last_name')
      .in('id', advisorIds);

    const advisorMap = new Map(
      (advisors || []).map((a) => [a.id, `${a.first_name} ${a.last_name}`])
    );

    // Sort by conversions
    const performers: TopPerformer[] = Object.entries(advisorStats)
      .map(([id, stats]) => ({
        id,
        name: advisorMap.get(id) || 'Unknown',
        metric: stats.converted,
        change: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.metric - a.metric)
      .slice(0, limit);

    return performers;
  }

  // Get lead sources breakdown
  async getLeadSources(): Promise<{ source: string; count: number }[]> {
    const { data, error } = await supabase
      .from('lead_submissions')
      .select('utm_source');

    if (error) return [];

    const sourceCount: Record<string, number> = {};
    (data || []).forEach((lead) => {
      const source = lead.utm_source || 'Unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });

    return Object.entries(sourceCount)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Get pipeline breakdown
  async getPipelineBreakdown(): Promise<{ stage: string; count: number }[]> {
    const { data, error } = await supabase
      .from('lead_submissions')
      .select('pipeline_stage');

    if (error) return [];

    const stageCount: Record<string, number> = {};
    (data || []).forEach((lead) => {
      const stage = lead.pipeline_stage || 'Unknown';
      stageCount[stage] = (stageCount[stage] || 0) + 1;
    });

    return Object.entries(stageCount)
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Export analytics report
  async exportReport(
    type: 'leads' | 'users' | 'enrollments',
    fromDate: string,
    toDate: string
  ): Promise<string> {
    const table = {
      leads: 'lead_submissions',
      users: 'admin_users',
      enrollments: 'enrollments',
    }[type];

    const columnMap: Record<string, string> = {
      leads: 'id, first_name, last_name, email, phone, source_page, utm_source, utm_medium, utm_campaign, form_data, pipeline_stage, assigned_to, created_at',
      users: 'id, email, first_name, last_name, role, status, permissions, avatar_url, last_login_at, org_id, created_at, updated_at',
      enrollments: 'id, applicant_name, applicant_email, applicant_phone, application_type, status, submitted_at, reviewed_at, reviewed_by, documents, notes, metadata, created_at, updated_at',
    };

    const { data, error } = await supabase
      .from(table)
      .select(columnMap[type])
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    if (error) return '';

    // Convert to CSV
    if (!data || data.length === 0) return '';

    // TODO: HIPAA compliance — replace with logPhiExport() from @mpbhealth/auth
    // once @mpbhealth/auth is added as a dependency of admin-core.
    // PHI export events MUST be logged per HIPAA §164.312(b) audit controls.
    const { data: { session } } = await supabase.auth.getSession();
    console.warn(
      `[PHI-EXPORT] type=${type} table=${table} records=${data.length} range=${fromDate}..${toDate} user=${session?.user?.id ?? 'unknown'}`
    );

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

export const analyticsService = new AnalyticsService();
