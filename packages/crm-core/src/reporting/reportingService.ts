import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ReportDateRange,
  ConversionFunnelData,
  LeadSourceBreakdown,
  ResponseTimeMetrics,
  TeamPerformanceRow,
} from './types';

export class ReportingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Conversion funnel: leads grouped by pipeline stage with sequential conversion rates.
   */
  async getConversionFunnel(dateRange?: ReportDateRange): Promise<ConversionFunnelData[]> {
    try {
      // Get pipeline stages in order
      const { data: stages, error: stagesErr } = await this.supabase
        .from('crm_pipeline_stages')
        .select('*')
        .order('display_order', { ascending: true });

      if (stagesErr || !stages?.length) return [];

      // Count leads per stage
      let query = this.supabase
        .from('zoho_lead_submissions')
        .select('pipeline_stage');

      if (dateRange) {
        query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }

      const { data: leads, error: leadsErr } = await query;
      if (leadsErr) return [];

      const countMap: Record<string, number> = {};
      for (const lead of leads || []) {
        const s = lead.pipeline_stage || 'new';
        countMap[s] = (countMap[s] || 0) + 1;
      }

      const funnel: ConversionFunnelData[] = stages.map((stage, i) => {
        const count = countMap[stage.name] || 0;
        const prevCount = i > 0 ? (countMap[stages[i - 1].name] || 0) : count;
        const conversion_rate = prevCount > 0 ? (count / prevCount) * 100 : 0;

        return {
          stage: stage.name,
          display_name: stage.display_name,
          count,
          color: stage.color || '#6B7280',
          conversion_rate: i === 0 ? 100 : Math.round(conversion_rate * 10) / 10,
        };
      });

      return funnel;
    } catch (err) {
      console.error('getConversionFunnel error:', err);
      return [];
    }
  }

  /**
   * Lead source breakdown with conversion rates.
   */
  async getLeadSourceBreakdown(dateRange?: ReportDateRange): Promise<LeadSourceBreakdown[]> {
    try {
      let query = this.supabase
        .from('zoho_lead_submissions')
        .select('source_cta, utm_source, pipeline_stage, created_at');

      if (dateRange) {
        query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }

      const { data: leads, error } = await query;
      if (error || !leads) return [];

      const sourceMap: Record<string, { count: number; converted: number; totalDays: number }> = {};

      for (const lead of leads) {
        const source = lead.utm_source || lead.source_cta || 'Direct';
        if (!sourceMap[source]) {
          sourceMap[source] = { count: 0, converted: 0, totalDays: 0 };
        }
        sourceMap[source].count++;
        if (lead.pipeline_stage === 'won' || lead.pipeline_stage === 'enrolled') {
          sourceMap[source].converted++;
        }
      }

      return Object.entries(sourceMap)
        .map(([source, data]) => ({
          source,
          count: data.count,
          conversion_rate: data.count > 0 ? Math.round((data.converted / data.count) * 1000) / 10 : 0,
          avg_days_to_convert: data.converted > 0 ? Math.round(data.totalDays / data.converted) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      console.error('getLeadSourceBreakdown error:', err);
      return [];
    }
  }

  /**
   * Response time metrics: how quickly leads get first contact.
   */
  async getResponseTimeMetrics(dateRange?: ReportDateRange): Promise<ResponseTimeMetrics> {
    const empty: ResponseTimeMetrics = {
      avg_first_contact_hours: 0,
      median_first_contact_hours: 0,
      within_1h_percent: 0,
      within_24h_percent: 0,
    };

    try {
      let leadsQuery = this.supabase
        .from('zoho_lead_submissions')
        .select('id, created_at');

      if (dateRange) {
        leadsQuery = leadsQuery.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }

      const { data: leads, error: leadsErr } = await leadsQuery;
      if (leadsErr || !leads?.length) return empty;

      // Get first activity per lead
      const leadIds = leads.map((l) => l.id);
      const { data: activities, error: actErr } = await this.supabase
        .from('lead_activities')
        .select('lead_id, created_at')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: true });

      if (actErr || !activities?.length) return empty;

      // Map: leadId → first activity time
      const firstActivity: Record<string, string> = {};
      for (const a of activities) {
        if (!firstActivity[a.lead_id]) {
          firstActivity[a.lead_id] = a.created_at;
        }
      }

      const hours: number[] = [];
      for (const lead of leads) {
        const first = firstActivity[lead.id];
        if (first) {
          const diff = (new Date(first).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
          hours.push(diff);
        }
      }

      if (hours.length === 0) return empty;

      hours.sort((a, b) => a - b);
      const avg = hours.reduce((s, h) => s + h, 0) / hours.length;
      const median = hours[Math.floor(hours.length / 2)];
      const within1h = hours.filter((h) => h <= 1).length / hours.length * 100;
      const within24h = hours.filter((h) => h <= 24).length / hours.length * 100;

      return {
        avg_first_contact_hours: Math.round(avg * 10) / 10,
        median_first_contact_hours: Math.round(median * 10) / 10,
        within_1h_percent: Math.round(within1h),
        within_24h_percent: Math.round(within24h),
      };
    } catch (err) {
      console.error('getResponseTimeMetrics error:', err);
      return empty;
    }
  }

  /**
   * Team performance: leads, conversions, tasks per user.
   */
  async getTeamPerformance(dateRange?: ReportDateRange): Promise<TeamPerformanceRow[]> {
    try {
      let query = this.supabase
        .from('zoho_lead_submissions')
        .select('assigned_to, pipeline_stage');

      if (dateRange) {
        query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }

      const { data: leads, error: leadsErr } = await query;
      if (leadsErr || !leads) return [];

      // Group by assigned_to
      const userMap: Record<string, { assigned: number; converted: number }> = {};
      for (const lead of leads) {
        const uid = lead.assigned_to || 'unassigned';
        if (!userMap[uid]) userMap[uid] = { assigned: 0, converted: 0 };
        userMap[uid].assigned++;
        if (lead.pipeline_stage === 'won' || lead.pipeline_stage === 'enrolled') {
          userMap[uid].converted++;
        }
      }

      // Get task + activity counts per user
      const userIds = Object.keys(userMap).filter((u) => u !== 'unassigned');

      let taskCounts: Record<string, number> = {};
      let activityCounts: Record<string, number> = {};

      if (userIds.length > 0) {
        const { data: tasks } = await this.supabase
          .from('lead_tasks')
          .select('assigned_to')
          .eq('completed', true)
          .in('assigned_to', userIds);

        for (const t of tasks || []) {
          const uid = t.assigned_to;
          taskCounts[uid] = (taskCounts[uid] || 0) + 1;
        }

        const { data: acts } = await this.supabase
          .from('lead_activities')
          .select('created_by')
          .in('created_by', userIds);

        for (const a of acts || []) {
          const uid = a.created_by;
          activityCounts[uid] = (activityCounts[uid] || 0) + 1;
        }
      }

      // Get user emails
      const { data: profiles } = await this.supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const emailMap: Record<string, string> = {};
      for (const p of profiles || []) {
        emailMap[p.id] = p.email;
      }

      return Object.entries(userMap)
        .filter(([uid]) => uid !== 'unassigned')
        .map(([uid, data]) => ({
          user_id: uid,
          user_email: emailMap[uid] || uid,
          leads_assigned: data.assigned,
          leads_converted: data.converted,
          conversion_rate: data.assigned > 0 ? Math.round((data.converted / data.assigned) * 1000) / 10 : 0,
          avg_response_hours: 0, // Would need per-user first-activity calc
          tasks_completed: taskCounts[uid] || 0,
          activities_logged: activityCounts[uid] || 0,
        }))
        .sort((a, b) => b.leads_assigned - a.leads_assigned);
    } catch (err) {
      console.error('getTeamPerformance error:', err);
      return [];
    }
  }

  /**
   * Export report data as CSV string.
   */
  exportCSV(headers: string[], rows: Record<string, unknown>[]): string {
    const headerLine = headers.join(',');
    const dataLines = rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val == null) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(','),
    );
    return [headerLine, ...dataLines].join('\n');
  }
}

export function createReportingService(supabase: SupabaseClient): ReportingService {
  return new ReportingService(supabase);
}
