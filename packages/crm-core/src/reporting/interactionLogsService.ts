import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  InteractionLog,
  InteractionLogCreateInput,
  InteractionFilters,
  InteractionStats,
  InteractionType,
} from './types';

export class InteractionLogsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List interaction logs with filters
   */
  async list(
    orgId: string,
    filters?: InteractionFilters,
    pagination?: { page: number; pageSize: number }
  ): Promise<{ data: InteractionLog[]; total: number }> {
    try {
      let query = this.supabase
        .from('interaction_logs')
        .select(`
        id, org_id, member_id, agent_id, interaction_type, direction, subject, summary, duration_seconds, outcome, sentiment, tags, metadata, created_at,
          agent:agent_id (email, raw_user_meta_data)
        `, { count: 'exact' })
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (filters?.member_id) {
        query = query.eq('member_id', filters.member_id);
      }
      if (filters?.agent_id) {
        query = query.eq('agent_id', filters.agent_id);
      }
      if (filters?.interaction_type) {
        query = query.eq('interaction_type', filters.interaction_type);
      }
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters?.outcome) {
        query = query.eq('outcome', filters.outcome);
      }
      if (filters?.sentiment) {
        query = query.eq('sentiment', filters.sentiment);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (pagination) {
        const { page, pageSize } = pagination;
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const interactions = (data || []).map((i) => ({
        ...i,
        agent_email: (i.agent as unknown as { email: string; raw_user_meta_data: { full_name?: string } } | null)?.email,
        agent_name: (i.agent as unknown as { email: string; raw_user_meta_data: { full_name?: string } } | null)?.raw_user_meta_data?.full_name,
        tags: i.tags || [],
        metadata: i.metadata || {},
      }));

      return { data: interactions, total: count || 0 };
    } catch (err) {
      console.error('InteractionLogsService.list error:', err);
      return { data: [], total: 0 };
    }
  }

  /**
   * Get a single interaction by ID
   */
  async get(id: string): Promise<InteractionLog | null> {
    try {
      const { data, error } = await this.supabase
        .from('interaction_logs')
        .select(`
        id, org_id, member_id, agent_id, interaction_type, direction, subject, summary, duration_seconds, outcome, sentiment, tags, metadata, created_at,
          agent:agent_id (email, raw_user_meta_data)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        agent_email: (data.agent as unknown as { email: string; raw_user_meta_data: { full_name?: string } } | null)?.email,
        agent_name: (data.agent as unknown as { email: string; raw_user_meta_data: { full_name?: string } } | null)?.raw_user_meta_data?.full_name,
        tags: data.tags || [],
        metadata: data.metadata || {},
      };
    } catch (err) {
      console.error('InteractionLogsService.get error:', err);
      return null;
    }
  }

  /**
   * Create a new interaction log
   */
  async create(input: InteractionLogCreateInput, orgId: string): Promise<InteractionLog | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await this.supabase
        .from('interaction_logs')
        .insert({
          org_id: orgId,
          member_id: input.member_id,
          agent_id: user.id,
          interaction_type: input.interaction_type,
          direction: input.direction,
          subject: input.subject,
          summary: input.summary,
          duration_seconds: input.duration_seconds,
          outcome: input.outcome,
          sentiment: input.sentiment,
          tags: input.tags || [],
          metadata: input.metadata || {},
        })
        .select('id, org_id, member_id, agent_id, interaction_type, direction, subject, summary, duration_seconds, outcome, sentiment, tags, metadata, created_at')
        .single();

      if (error) throw error;

      // Log to audit
      await this.logAudit('interaction.create', 'interaction_log', data.id, null, data);

      return data as any;
    } catch (err) {
      console.error('InteractionLogsService.create error:', err);
      return null;
    }
  }

  /**
   * Get interaction statistics
   */
  async getStats(orgId: string, dateRange?: { from: string; to: string }): Promise<InteractionStats> {
    try {
      let query = this.supabase
        .from('interaction_logs')
        .select('interaction_type, outcome, sentiment, duration_seconds, created_at')
        .eq('org_id', orgId);

      if (dateRange) {
        query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats: InteractionStats = {
        total_interactions: data?.length || 0,
        by_type: { call: 0, email: 0, chat: 0, meeting: 0, note: 0 },
        by_outcome: {},
        by_sentiment: {},
        avg_duration_seconds: 0,
        interactions_per_day: [],
      };

      if (!data?.length) return stats;

      let totalDuration = 0;
      let durationCount = 0;
      const byDay: Record<string, number> = {};

      for (const i of data) {
        // By type
        const type = i.interaction_type as unknown as InteractionType;
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;

        // By outcome
        if (i.outcome) {
          stats.by_outcome[i.outcome] = (stats.by_outcome[i.outcome] || 0) + 1;
        }

        // By sentiment
        if (i.sentiment) {
          stats.by_sentiment[i.sentiment] = (stats.by_sentiment[i.sentiment] || 0) + 1;
        }

        // Duration
        if (i.duration_seconds) {
          totalDuration += i.duration_seconds;
          durationCount++;
        }

        // By day
        const day = i.created_at.split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;
      }

      stats.avg_duration_seconds = durationCount > 0
        ? Math.round(totalDuration / durationCount)
        : 0;

      stats.interactions_per_day = Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return stats;
    } catch (err) {
      console.error('InteractionLogsService.getStats error:', err);
      return {
        total_interactions: 0,
        by_type: { call: 0, email: 0, chat: 0, meeting: 0, note: 0 },
        by_outcome: {},
        by_sentiment: {},
        avg_duration_seconds: 0,
        interactions_per_day: [],
      };
    }
  }

  /**
   * Get agent performance based on interactions
   */
  async getAgentInteractionStats(
    orgId: string,
    dateRange?: { from: string; to: string }
  ): Promise<Array<{
    agent_id: string;
    agent_email?: string;
    total_interactions: number;
    by_type: Record<InteractionType, number>;
    avg_duration_seconds: number;
    positive_sentiment_rate: number;
  }>> {
    try {
      let query = this.supabase
        .from('interaction_logs')
        .select(`
          agent_id,
          interaction_type,
          duration_seconds,
          sentiment,
          agent:agent_id (email)
        `)
        .eq('org_id', orgId);

      if (dateRange) {
        query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;

      const agentMap: Record<string, {
        agent_email?: string;
        interactions: typeof data;
      }> = {};

      for (const i of data || []) {
        if (!agentMap[i.agent_id]) {
          const agentData = i.agent as unknown as { email: string } | { email: string }[] | null;
          const agentEmail = Array.isArray(agentData) ? agentData[0]?.email : agentData?.email;
          agentMap[i.agent_id] = {
            agent_email: agentEmail,
            interactions: [],
          };
        }
        agentMap[i.agent_id].interactions.push(i);
      }

      return Object.entries(agentMap).map(([agent_id, { agent_email, interactions }]) => {
        const by_type: Record<InteractionType, number> = {
          call: 0, email: 0, chat: 0, meeting: 0, note: 0,
        };

        let totalDuration = 0;
        let durationCount = 0;
        let positiveCount = 0;

        for (const i of interactions) {
          const type = i.interaction_type as unknown as InteractionType;
          by_type[type] = (by_type[type] || 0) + 1;

          if (i.duration_seconds) {
            totalDuration += i.duration_seconds;
            durationCount++;
          }

          if (i.sentiment === 'positive') positiveCount++;
        }

        return {
          agent_id,
          agent_email,
          total_interactions: interactions.length,
          by_type,
          avg_duration_seconds: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
          positive_sentiment_rate: interactions.length > 0
            ? Math.round((positiveCount / interactions.length) * 100)
            : 0,
        };
      }).sort((a, b) => b.total_interactions - a.total_interactions);
    } catch (err) {
      console.error('InteractionLogsService.getAgentInteractionStats error:', err);
      return [];
    }
  }

  /**
   * Get member interaction history
   */
  async getMemberInteractions(memberId: string): Promise<InteractionLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('interaction_logs')
        .select(`
        id, org_id, member_id, agent_id, interaction_type, direction, subject, summary, duration_seconds, outcome, sentiment, tags, metadata, created_at,
          agent:agent_id (email, raw_user_meta_data)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((i) => ({
        ...i,
        agent_email: (i.agent as unknown as { email: string; raw_user_meta_data: { full_name?: string } } | null)?.email,
        agent_name: (i.agent as unknown as { email: string; raw_user_meta_data: { full_name?: string } } | null)?.raw_user_meta_data?.full_name,
        tags: i.tags || [],
        metadata: i.metadata || {},
      }));
    } catch (err) {
      console.error('InteractionLogsService.getMemberInteractions error:', err);
      return [];
    }
  }

  private async logAudit(
    action: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown
  ): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      await this.supabase.from('audit_logs').insert({
        user_id: user?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_json: before,
        after_json: after,
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }
}

export function createInteractionLogsService(supabase: SupabaseClient): InteractionLogsService {
  return new InteractionLogsService(supabase);
}
