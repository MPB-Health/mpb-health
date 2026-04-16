import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FollowUpCadence,
  CadenceCreateInput,
  CadenceUpdateInput,
  LeadCadenceState,
  CadenceStep,
} from './types';

export class CadenceService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  async getCadences(): Promise<FollowUpCadence[]> {
    const { data, error } = await this.supabase
      .from('crm_follow_up_cadences')
      .select('id, org_id, pipeline_stage_id, name, steps, is_default, is_active, created_by, created_at, updated_at')
      .eq('org_id', this.orgId)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Failed to get cadences:', error);
      return [];
    }
    return data as unknown as FollowUpCadence[];
  }

  async getCadence(id: string): Promise<FollowUpCadence | null> {
    const { data, error } = await this.supabase
      .from('crm_follow_up_cadences')
      .select('id, org_id, pipeline_stage_id, name, steps, is_default, is_active, created_by, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as unknown as FollowUpCadence;
  }

  async createCadence(input: CadenceCreateInput): Promise<FollowUpCadence | null> {
    const { data: { user } } = await this.supabase.auth.getUser();

    if (input.is_default) {
      await this.supabase
        .from('crm_follow_up_cadences')
        .update({ is_default: false })
        .eq('org_id', this.orgId)
        .eq('is_default', true);
    }

    const { data, error } = await this.supabase
      .from('crm_follow_up_cadences')
      .insert({
        org_id: this.orgId,
        ...input,
        created_by: user?.id,
      })
      .select('id, org_id, pipeline_stage_id, name, steps, is_default, is_active, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('Failed to create cadence:', error);
      return null;
    }
    return data as unknown as FollowUpCadence;
  }

  async updateCadence(
    id: string,
    input: CadenceUpdateInput
  ): Promise<FollowUpCadence | null> {
    if (input.is_default) {
      await this.supabase
        .from('crm_follow_up_cadences')
        .update({ is_default: false })
        .eq('org_id', this.orgId)
        .eq('is_default', true)
        .neq('id', id);
    }

    const { data, error } = await this.supabase
      .from('crm_follow_up_cadences')
      .update(input)
      .eq('id', id)
      .select('id, org_id, pipeline_stage_id, name, steps, is_default, is_active, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('Failed to update cadence:', error);
      return null;
    }
    return data as unknown as FollowUpCadence;
  }

  async deleteCadence(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('crm_follow_up_cadences')
      .delete()
      .eq('id', id);

    return !error;
  }

  async enrollLead(
    leadId: string,
    cadenceId?: string
  ): Promise<LeadCadenceState | null> {
    let targetCadenceId = cadenceId;

    if (!targetCadenceId) {
      const { data: defaultCadence } = await this.supabase
        .from('crm_follow_up_cadences')
        .select('id')
        .eq('org_id', this.orgId)
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();

      if (!defaultCadence) return null;
      targetCadenceId = defaultCadence.id;
    }

    if (!targetCadenceId) return null;

    const cadence = await this.getCadence(targetCadenceId);
    if (!cadence || !cadence.steps.length) return null;

    const steps = cadence.steps as unknown as CadenceStep[];
    const firstStep = steps[0];
    const nextActionAt = new Date(
      Date.now() + firstStep.delay_hours * 60 * 60 * 1000
    );

    const { data, error } = await this.supabase
      .from('crm_lead_cadence_state')
      .upsert(
        {
          lead_id: leadId,
          cadence_id: targetCadenceId,
          org_id: this.orgId,
          current_step: 0,
          next_action_at: nextActionAt.toISOString(),
          paused: false,
          paused_reason: null,
          completed_at: null,
        },
        { onConflict: 'lead_id,cadence_id' }
      )
      .select('id, lead_id, cadence_id, org_id, current_step, next_action_at, paused, paused_reason, completed_at, created_at, updated_at')
      .single();

    if (error) {
      console.error('Failed to enroll lead in cadence:', error);
      return null;
    }
    return data as unknown as LeadCadenceState;
  }

  async advanceStep(leadId: string): Promise<LeadCadenceState | null> {
    const state = await this.getLeadCadenceState(leadId);
    if (!state || state.paused || state.completed_at) return state;

    const cadence = await this.getCadence(state.cadence_id);
    if (!cadence) return state;

    const steps = cadence.steps as unknown as CadenceStep[];
    const nextStepIdx = state.current_step + 1;

    if (nextStepIdx >= steps.length) {
      const { data } = await this.supabase
        .from('crm_lead_cadence_state')
        .update({
          current_step: nextStepIdx,
          completed_at: new Date().toISOString(),
          next_action_at: null,
        })
        .eq('id', state.id)
        .select('id, lead_id, cadence_id, org_id, current_step, next_action_at, paused, paused_reason, completed_at, created_at, updated_at')
        .single();

      return data as unknown as LeadCadenceState | null;
    }

    const nextStep = steps[nextStepIdx];
    const nextActionAt = new Date(
      Date.now() + nextStep.delay_hours * 60 * 60 * 1000
    );

    const { data } = await this.supabase
      .from('crm_lead_cadence_state')
      .update({
        current_step: nextStepIdx,
        next_action_at: nextActionAt.toISOString(),
      })
      .eq('id', state.id)
      .select('id, lead_id, cadence_id, org_id, current_step, next_action_at, paused, paused_reason, completed_at, created_at, updated_at')
      .single();

    return data as unknown as LeadCadenceState | null;
  }

  async pauseCadence(
    leadId: string,
    reason: string
  ): Promise<LeadCadenceState | null> {
    const state = await this.getLeadCadenceState(leadId);
    if (!state) return null;

    const { data } = await this.supabase
      .from('crm_lead_cadence_state')
      .update({ paused: true, paused_reason: reason })
      .eq('id', state.id)
      .select('id, lead_id, cadence_id, org_id, current_step, next_action_at, paused, paused_reason, completed_at, created_at, updated_at')
      .single();

    return data as unknown as LeadCadenceState | null;
  }

  async resumeCadence(leadId: string): Promise<LeadCadenceState | null> {
    const state = await this.getLeadCadenceState(leadId);
    if (!state || !state.paused) return state;

    const cadence = await this.getCadence(state.cadence_id);
    if (!cadence) return state;

    const steps = cadence.steps as unknown as CadenceStep[];
    const currentStep = steps[state.current_step];
    const nextActionAt = currentStep
      ? new Date(Date.now() + currentStep.delay_hours * 60 * 60 * 1000)
      : null;

    const { data } = await this.supabase
      .from('crm_lead_cadence_state')
      .update({
        paused: false,
        paused_reason: null,
        next_action_at: nextActionAt?.toISOString() || null,
      })
      .eq('id', state.id)
      .select('id, lead_id, cadence_id, org_id, current_step, next_action_at, paused, paused_reason, completed_at, created_at, updated_at')
      .single();

    return data as unknown as LeadCadenceState | null;
  }

  async getLeadCadenceState(leadId: string): Promise<LeadCadenceState | null> {
    const { data } = await this.supabase
      .from('crm_lead_cadence_state')
      .select('id, lead_id, cadence_id, org_id, current_step, next_action_at, paused, paused_reason, completed_at, created_at, updated_at')
      .eq('lead_id', leadId)
      .eq('org_id', this.orgId)
      .is('completed_at', null)
      .maybeSingle();

    return data as unknown as LeadCadenceState | null;
  }

  async getOverdueLeads(): Promise<LeadCadenceState[]> {
    const { data, error } = await this.supabase
      .from('crm_lead_cadence_state')
      .select('id, lead_id, cadence_id, org_id, current_step, next_action_at, paused, paused_reason, completed_at, created_at, updated_at')
      .eq('org_id', this.orgId)
      .eq('paused', false)
      .is('completed_at', null)
      .lt('next_action_at', new Date().toISOString());

    if (error) return [];
    return data as unknown as LeadCadenceState[];
  }
}

export function createCadenceService(
  supabase: SupabaseClient,
  orgId: string
): CadenceService {
  return new CadenceService(supabase, orgId);
}
