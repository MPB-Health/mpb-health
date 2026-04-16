import type { SupabaseClient } from '@supabase/supabase-js';
import type { PipelineStage, CRMDashboardStats } from './leadTypes';
import { DEFAULT_PIPELINE_STAGES } from './leadTypes';

export class PipelineService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all active pipeline stages
   */
  async getPipelineStages(): Promise<PipelineStage[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_pipeline_stages')
        .select('id, pipeline_id, name, display_name, probability, sort_order, is_won_stage, is_lost_stage, is_active, color, created_at')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to get pipeline stages:', error);
        return DEFAULT_PIPELINE_STAGES;
      }

      return data || DEFAULT_PIPELINE_STAGES;
    } catch (error) {
      console.error('Pipeline stages error:', error);
      return DEFAULT_PIPELINE_STAGES;
    }
  }

  /**
   * Get CRM dashboard statistics
   */
  async getDashboardStats(): Promise<CRMDashboardStats | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_crm_dashboard_stats');

      if (error) {
        console.error('Failed to get CRM dashboard stats:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0] as CRMDashboardStats;
      }

      return null;
    } catch (error) {
      console.error('CRM dashboard stats error:', error);
      return null;
    }
  }

  /**
   * Create a new pipeline stage
   */
  async createStage(
    stage: Omit<PipelineStage, 'id'>
  ): Promise<{ success: boolean; stageId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('crm_pipeline_stages')
        .insert(stage)
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, stageId: data?.id };
    } catch (error) {
      console.error('Create stage error:', error);
      return { success: false, error: 'Failed to create pipeline stage' };
    }
  }

  /**
   * Update a pipeline stage
   */
  async updateStage(
    id: string,
    updates: Partial<PipelineStage>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_pipeline_stages')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update stage error:', error);
      return { success: false, error: 'Failed to update pipeline stage' };
    }
  }

  /**
   * Reorder pipeline stages
   */
  async reorderStages(
    stageIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = stageIds.map((id, index) => ({
        id,
        sort_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await this.supabase
          .from('crm_pipeline_stages')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reorder stages error:', error);
      return { success: false, error: 'Failed to reorder pipeline stages' };
    }
  }

  /**
   * Delete a pipeline stage (soft delete by setting is_active to false)
   */
  async deleteStage(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_pipeline_stages')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete stage error:', error);
      return { success: false, error: 'Failed to delete pipeline stage' };
    }
  }
}

// Factory function
export function createPipelineService(supabase: SupabaseClient): PipelineService {
  return new PipelineService(supabase);
}
