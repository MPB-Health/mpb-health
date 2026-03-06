import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Forecast,
  ForecastEntry,
  ForecastEntryWithDeal,
  ForecastSummary,
  ForecastFilters,
  ForecastCreateInput,
  ForecastEntryUpdateInput,
  DealStageMetrics,
  PipelineHealth,
  RepForecast,
} from './types';

export class ForecastingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get forecasts with optional filters
   */
  async getForecasts(
    orgId: string,
    filters: ForecastFilters = {}
  ): Promise<Forecast[]> {
    try {
      let query = this.supabase
        .from('crm_forecasts')
        .select('*')
        .eq('org_id', orgId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.forecast_type) {
        query = query.eq('forecast_type', filters.forecast_type);
      }
      if (filters.dateFrom) {
        query = query.gte('period_start', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('period_end', filters.dateTo);
      }

      const { data, error } = await query.order('period_start', { ascending: false });

      if (error) {
        console.error('Failed to get forecasts:', error);
        return [];
      }

      return data as Forecast[];
    } catch (error) {
      console.error('Get forecasts error:', error);
      return [];
    }
  }

  /**
   * Get a single forecast with its entries
   */
  async getForecast(id: string): Promise<{
    forecast: Forecast | null;
    entries: ForecastEntryWithDeal[];
  }> {
    try {
      const [forecastRes, entriesRes] = await Promise.all([
        this.supabase
          .from('crm_forecasts')
          .select('*')
          .eq('id', id)
          .single(),
        this.supabase
          .from('crm_forecast_entries')
          .select(`
            *,
            deal:crm_deals!crm_forecast_entries_deal_id_fkey(
              id, name, account_id, owner_id,
              account:crm_accounts!crm_deals_account_id_fkey(id, name)
            )
          `)
          .eq('forecast_id', id)
          .order('forecast_category', { ascending: true })
          .order('amount', { ascending: false }),
      ]);

      if (forecastRes.error) {
        console.error('Failed to get forecast:', forecastRes.error);
        return { forecast: null, entries: [] };
      }

      return {
        forecast: forecastRes.data as Forecast,
        entries: (entriesRes.data || []) as ForecastEntryWithDeal[],
      };
    } catch (error) {
      console.error('Get forecast error:', error);
      return { forecast: null, entries: [] };
    }
  }

  /**
   * Create a new forecast period
   */
  async createForecast(
    orgId: string,
    input: ForecastCreateInput
  ): Promise<Forecast | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('crm_forecasts')
        .insert({
          org_id: orgId,
          name: input.name,
          period_start: input.period_start,
          period_end: input.period_end,
          forecast_type: input.forecast_type,
          status: input.status || 'draft',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create forecast:', error);
        return null;
      }

      return data as Forecast;
    } catch (error) {
      console.error('Create forecast error:', error);
      return null;
    }
  }

  /**
   * Update a forecast entry's category, amount, or probability
   */
  async updateForecastEntry(
    entryId: string,
    input: ForecastEntryUpdateInput
  ): Promise<ForecastEntry | null> {
    try {
      const updateData: Record<string, unknown> = {};
      if (input.forecast_category !== undefined) updateData.forecast_category = input.forecast_category;
      if (input.amount !== undefined) updateData.amount = input.amount;
      if (input.probability !== undefined) updateData.probability = input.probability;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const { data, error } = await this.supabase
        .from('crm_forecast_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update forecast entry:', error);
        return null;
      }

      return data as ForecastEntry;
    } catch (error) {
      console.error('Update forecast entry error:', error);
      return null;
    }
  }

  /**
   * Auto-populate entries from open deals that close within the forecast period
   */
  async autoPopulateEntries(forecastId: string): Promise<number> {
    try {
      // Get forecast period
      const { data: forecast, error: fError } = await this.supabase
        .from('crm_forecasts')
        .select('*')
        .eq('id', forecastId)
        .single();

      if (fError || !forecast) {
        console.error('Failed to get forecast for auto-populate:', fError);
        return 0;
      }

      // Get open deals closing within the period
      const { data: deals, error: dError } = await this.supabase
        .from('crm_deals')
        .select(`
          id, name, amount, probability, expected_close_date, owner_id,
          stage:crm_deal_stages!crm_deals_stage_id_fkey(name, probability)
        `)
        .eq('org_id', forecast.org_id)
        .is('won_at', null)
        .is('lost_at', null)
        .gte('expected_close_date', forecast.period_start)
        .lte('expected_close_date', forecast.period_end);

      if (dError || !deals || deals.length === 0) {
        return 0;
      }

      // Get existing entries to avoid duplicates
      const { data: existing } = await this.supabase
        .from('crm_forecast_entries')
        .select('deal_id')
        .eq('forecast_id', forecastId);

      const existingDealIds = new Set((existing || []).map((e: { deal_id: string }) => e.deal_id));
      const newEntries = deals
        .filter((d: { id: string }) => !existingDealIds.has(d.id))
        .map((d: Record<string, unknown>) => {
          const prob = (d.probability as number) || (d.stage as Record<string, unknown>)?.probability as number || 50;
          const amount = (d.amount as number) || 0;
          // Classify based on probability
          let category: string = 'pipeline';
          if (prob >= 90) category = 'committed';
          else if (prob >= 70) category = 'best_case';

          return {
            forecast_id: forecastId,
            deal_id: d.id,
            user_id: d.owner_id || null,
            amount,
            probability: prob,
            weighted_amount: Math.round(amount * prob / 100 * 100) / 100,
            forecast_category: category,
            stage: (d.stage as Record<string, unknown>)?.name || null,
            close_date: d.expected_close_date || null,
          };
        });

      if (newEntries.length === 0) return 0;

      const { error: iError } = await this.supabase
        .from('crm_forecast_entries')
        .insert(newEntries);

      if (iError) {
        console.error('Failed to auto-populate entries:', iError);
        return 0;
      }

      return newEntries.length;
    } catch (error) {
      console.error('Auto-populate entries error:', error);
      return 0;
    }
  }

  /**
   * Get aggregate forecast summary
   */
  async getForecastSummary(forecastId: string): Promise<ForecastSummary> {
    const empty: ForecastSummary = {
      total_pipeline: 0,
      committed: 0,
      best_case: 0,
      pipeline: 0,
      omitted: 0,
      closed_won: 0,
      weighted_total: 0,
      deal_count: 0,
      forecast_accuracy: null,
    };

    try {
      const { data: entries, error } = await this.supabase
        .from('crm_forecast_entries')
        .select(`
          amount, weighted_amount, forecast_category,
          deal:crm_deals!crm_forecast_entries_deal_id_fkey(won_at, amount)
        `)
        .eq('forecast_id', forecastId);

      if (error || !entries) return empty;

      let committed = 0;
      let best_case = 0;
      let pipeline = 0;
      let omitted = 0;
      let closed_won = 0;
      let weighted_total = 0;

      for (const entry of entries) {
        const e = entry as Record<string, unknown>;
        const amount = (e.amount as number) || 0;
        const weighted = (e.weighted_amount as number) || 0;
        const category = e.forecast_category as string;
        const deal = e.deal as Record<string, unknown> | null;

        if (deal?.won_at) {
          closed_won += (deal.amount as number) || 0;
        }

        switch (category) {
          case 'committed':
            committed += amount;
            break;
          case 'best_case':
            best_case += amount;
            break;
          case 'pipeline':
            pipeline += amount;
            break;
          case 'omitted':
            omitted += amount;
            break;
        }
        weighted_total += weighted;
      }

      const total_pipeline = committed + best_case + pipeline;

      // Calculate accuracy if there are closed deals
      let forecast_accuracy: number | null = null;
      if (committed > 0 && closed_won > 0) {
        forecast_accuracy = Math.round((closed_won / committed) * 100);
      }

      return {
        total_pipeline,
        committed,
        best_case,
        pipeline,
        omitted,
        closed_won,
        weighted_total,
        deal_count: entries.length,
        forecast_accuracy,
      };
    } catch (error) {
      console.error('Get forecast summary error:', error);
      return empty;
    }
  }

  /**
   * Get deal stage metrics (win rate, velocity, avg deal size by stage)
   */
  async getDealStageMetrics(orgId: string): Promise<DealStageMetrics[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_deal_stage_metrics')
        .select('*')
        .eq('org_id', orgId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to get deal stage metrics:', error);
        return [];
      }

      return (data || []) as DealStageMetrics[];
    } catch (error) {
      console.error('Get deal stage metrics error:', error);
      return [];
    }
  }

  /**
   * Get pipeline health summary
   */
  async getPipelineHealth(orgId: string): Promise<PipelineHealth> {
    const empty: PipelineHealth = {
      total_pipeline_value: 0,
      committed_value: 0,
      coverage_ratio: 0,
      avg_deal_velocity_days: 0,
      deals_at_risk: 0,
      deals_closing_this_month: 0,
    };

    try {
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get open deals
      const { data: deals, error } = await this.supabase
        .from('crm_deals')
        .select('id, amount, probability, expected_close_date, updated_at')
        .eq('org_id', orgId)
        .is('won_at', null)
        .is('lost_at', null);

      if (error || !deals) return empty;

      let total = 0;
      let committed = 0;
      let atRisk = 0;
      let closingThisMonth = 0;

      for (const deal of deals) {
        const amount = (deal.amount as number) || 0;
        const prob = (deal.probability as number) || 0;
        total += amount;

        if (prob >= 90) committed += amount;

        // Deals at risk: past close date or not updated in 30 days
        const closeDate = deal.expected_close_date ? new Date(deal.expected_close_date as string) : null;
        const updatedAt = deal.updated_at ? new Date(deal.updated_at as string) : null;

        if (closeDate && closeDate < now) {
          atRisk++;
        } else if (updatedAt && updatedAt < thirtyDaysAgo) {
          atRisk++;
        }

        if (closeDate && closeDate <= monthEnd && closeDate >= now) {
          closingThisMonth++;
        }
      }

      // Get average velocity from stage history
      const { data: history } = await this.supabase
        .from('crm_deal_stage_history')
        .select('deal_id, changed_at')
        .order('changed_at', { ascending: true });

      let avgVelocity = 0;
      if (history && history.length > 1) {
        const dealFirstLast: Record<string, { first: string; last: string }> = {};
        for (const h of history) {
          const dealId = h.deal_id as string;
          const changedAt = h.changed_at as string;
          if (!dealFirstLast[dealId]) {
            dealFirstLast[dealId] = { first: changedAt, last: changedAt };
          } else {
            dealFirstLast[dealId].last = changedAt;
          }
        }
        const velocities = Object.values(dealFirstLast)
          .map(v => (new Date(v.last).getTime() - new Date(v.first).getTime()) / 86400000)
          .filter(v => v > 0);

        if (velocities.length > 0) {
          avgVelocity = Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length);
        }
      }

      // Coverage ratio = total pipeline / committed target
      const coverageRatio = committed > 0 ? Math.round((total / committed) * 10) / 10 : 0;

      return {
        total_pipeline_value: total,
        committed_value: committed,
        coverage_ratio: coverageRatio,
        avg_deal_velocity_days: avgVelocity,
        deals_at_risk: atRisk,
        deals_closing_this_month: closingThisMonth,
      };
    } catch (error) {
      console.error('Get pipeline health error:', error);
      return empty;
    }
  }

  /**
   * Get forecast breakdown by rep
   */
  async getRepForecasts(forecastId: string): Promise<RepForecast[]> {
    try {
      const { data: entries, error } = await this.supabase
        .from('crm_forecast_entries')
        .select(`
          user_id, amount, weighted_amount, forecast_category
        `)
        .eq('forecast_id', forecastId)
        .neq('forecast_category', 'omitted');

      if (error || !entries) return [];

      // Group by user
      const repMap = new Map<string, RepForecast>();

      for (const entry of entries) {
        const e = entry as Record<string, unknown>;
        const userId = (e.user_id as string) || 'unassigned';

        if (!repMap.has(userId)) {
          repMap.set(userId, {
            user_id: userId,
            user_email: userId === 'unassigned' ? 'unassigned' : userId,
            user_name: null,
            committed: 0,
            best_case: 0,
            pipeline: 0,
            weighted_total: 0,
            deal_count: 0,
          });
        }

        const rep = repMap.get(userId)!;
        const amount = (e.amount as number) || 0;
        const weighted = (e.weighted_amount as number) || 0;
        const category = e.forecast_category as string;

        rep.deal_count++;
        rep.weighted_total += weighted;

        switch (category) {
          case 'committed':
            rep.committed += amount;
            break;
          case 'best_case':
            rep.best_case += amount;
            break;
          case 'pipeline':
            rep.pipeline += amount;
            break;
        }
      }

      return Array.from(repMap.values()).sort((a, b) => b.weighted_total - a.weighted_total);
    } catch (error) {
      console.error('Get rep forecasts error:', error);
      return [];
    }
  }
}

// Factory function
export function createForecastingService(supabase: SupabaseClient): ForecastingService {
  return new ForecastingService(supabase);
}
