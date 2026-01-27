import { supabase } from '@mpbhealth/database';

export interface CRMSummary {
  total_leads: number;
  new_today: number;
  leads_by_stage: { stage: string; count: number; color: string }[];
  conversion_rate: number;
  pending_tasks: number;
}

export class CRMBridgeService {
  async getCRMSummary(): Promise<CRMSummary> {
    const [totalLeads, newToday, stageData, convertedCount, pendingTasks] = await Promise.all([
      this.getTotalLeads(),
      this.getNewLeadsToday(),
      this.getLeadsByStage(),
      this.getConvertedCount(),
      this.getPendingTaskCount(),
    ]);

    const conversionRate = totalLeads > 0 ? (convertedCount / totalLeads) * 100 : 0;

    return {
      total_leads: totalLeads,
      new_today: newToday,
      leads_by_stage: stageData,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      pending_tasks: pendingTasks,
    };
  }

  private async getTotalLeads(): Promise<number> {
    const { count } = await supabase
      .from('zoho_lead_submissions')
      .select('id', { count: 'exact', head: true });
    return count || 0;
  }

  private async getNewLeadsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('zoho_lead_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    return count || 0;
  }

  private async getLeadsByStage(): Promise<{ stage: string; count: number; color: string }[]> {
    const { data: stages } = await supabase
      .from('crm_pipeline_stages')
      .select('id, name, color')
      .order('display_order', { ascending: true });

    if (!stages || stages.length === 0) return [];

    const results: { stage: string; count: number; color: string }[] = [];

    for (const stage of stages) {
      const { count } = await supabase
        .from('zoho_lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('pipeline_stage_id', stage.id);
      results.push({
        stage: stage.name,
        count: count || 0,
        color: stage.color || '#6B7280',
      });
    }

    return results;
  }

  private async getConvertedCount(): Promise<number> {
    // Find the "closed won" or final stage
    const { data: stages } = await supabase
      .from('crm_pipeline_stages')
      .select('id')
      .eq('is_won_stage', true)
      .limit(1);

    if (!stages || stages.length === 0) {
      // Fallback: count leads marked as converted
      const { count } = await supabase
        .from('zoho_lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'converted');
      return count || 0;
    }

    const { count } = await supabase
      .from('zoho_lead_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_stage_id', stages[0].id);
    return count || 0;
  }

  private async getPendingTaskCount(): Promise<number> {
    const { count } = await supabase
      .from('lead_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('completed', false);
    return count || 0;
  }
}

export const crmBridgeService = new CRMBridgeService();
