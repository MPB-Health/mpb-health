import { supabase } from '@mpbhealth/database';

export interface QuoteResultsByDay {
  date: string;
  results_events: number;
  contact_events: number;
  lead_events: number;
}

export interface QuoteResultsAnalytics {
  period_days: number;
  since: string;
  sessions_with_results: number;
  sessions_converted: number;
  sessions_abandoned: number;
  conversion_rate: number;
  events_results_viewed: number;
  events_contact_opened: number;
  events_lead_submitted: number;
  by_day: QuoteResultsByDay[];
}

export type QuoteFunnelEventRow = {
  id: string;
  created_at: string;
  session_id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
};

export class QuoteResultsAnalyticsService {
  async getAnalytics(days: number): Promise<QuoteResultsAnalytics | null> {
    const { data, error } = await supabase.rpc('get_quote_results_analytics', {
      p_days: days,
    });
    if (error) {
      console.error('[QuoteResultsAnalytics]', error.message);
      return null;
    }
    if (!data || typeof data !== 'object') return null;
    const row = data as Record<string, unknown>;
    return {
      period_days: Number(row.period_days) || 0,
      since: String(row.since ?? ''),
      sessions_with_results: Number(row.sessions_with_results) || 0,
      sessions_converted: Number(row.sessions_converted) || 0,
      sessions_abandoned: Number(row.sessions_abandoned) || 0,
      conversion_rate: Number(row.conversion_rate) || 0,
      events_results_viewed: Number(row.events_results_viewed) || 0,
      events_contact_opened: Number(row.events_contact_opened) || 0,
      events_lead_submitted: Number(row.events_lead_submitted) || 0,
      by_day: Array.isArray(row.by_day) ? (row.by_day as QuoteResultsByDay[]) : [],
    };
  }

  async fetchRecentEvents(limit = 80): Promise<QuoteFunnelEventRow[]> {
    const { data, error } = await supabase
      .from('quote_calculator_funnel_events')
      .select('id, created_at, session_id, event_type, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as QuoteFunnelEventRow[];
  }

  /** Subscribe to new funnel rows (requires Realtime enabled on the table). */
  subscribeToInserts(onInsert: () => void): () => void {
    const channel = supabase
      .channel('quote_calculator_funnel_events_ins')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quote_calculator_funnel_events',
        },
        () => {
          onInsert();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }
}

export const quoteResultsAnalyticsService = new QuoteResultsAnalyticsService();
