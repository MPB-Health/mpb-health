// ============================================================================
// Sequence Service — Manages automated outreach sequences
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  Sequence,
  SequenceWithSteps,
  SequenceStep,
  SequenceEnrollment,
  CreateSequenceInput,
  CreateStepInput,
  SequenceStatus,
} from './types';

export class SequenceService {
  // =========================================================================
  // SEQUENCES
  // =========================================================================

  /**
   * Get all sequences for an org
   */
  async getSequences(
    orgId: string,
    options: { status?: SequenceStatus; includeSteps?: boolean } = {}
  ): Promise<Sequence[] | SequenceWithSteps[]> {
    let query = supabase
      .from('sequences')
      .select(options.includeSteps ? '*, steps:sequence_steps(*)' : '*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SequenceService] Failed to get sequences:', error);
      throw error;
    }

    return (data || []) as unknown as Sequence[] | SequenceWithSteps[];
  }

  /**
   * Get a single sequence with its steps
   */
  async getSequence(sequenceId: string): Promise<SequenceWithSteps | null> {
    const { data, error } = await supabase
      .from('sequences')
      .select('*, steps:sequence_steps(*)')
      .eq('id', sequenceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[SequenceService] Failed to get sequence:', error);
      throw error;
    }

    if (data) {
      // Sort steps by step_number
      data.steps = (data.steps || []).sort(
        (a: SequenceStep, b: SequenceStep) => a.step_number - b.step_number
      );
    }

    return data as SequenceWithSteps | null;
  }

  /**
   * Create a new sequence
   */
  async createSequence(orgId: string, input: CreateSequenceInput): Promise<Sequence> {
    const { data, error } = await supabase
      .from('sequences')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        trigger_type: input.trigger_type || 'manual',
        trigger_conditions: input.trigger_conditions || {},
        send_window_start: input.send_window_start || '09:00',
        send_window_end: input.send_window_end || '17:00',
        send_days: input.send_days || ['mon', 'tue', 'wed', 'thu', 'fri'],
        timezone: input.timezone || 'America/New_York',
        exit_on_reply: input.exit_on_reply ?? true,
        exit_on_meeting_scheduled: input.exit_on_meeting_scheduled ?? true,
        exit_on_unsubscribe: input.exit_on_unsubscribe ?? true,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('[SequenceService] Failed to create sequence:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a sequence
   */
  async updateSequence(
    sequenceId: string,
    input: Partial<CreateSequenceInput>
  ): Promise<Sequence> {
    const { data, error } = await supabase
      .from('sequences')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sequenceId)
      .select()
      .single();

    if (error) {
      console.error('[SequenceService] Failed to update sequence:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update sequence status
   */
  async updateStatus(sequenceId: string, status: SequenceStatus): Promise<void> {
    const { error } = await supabase
      .from('sequences')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sequenceId);

    if (error) {
      console.error('[SequenceService] Failed to update status:', error);
      throw error;
    }
  }

  /**
   * Delete a sequence
   */
  async deleteSequence(sequenceId: string): Promise<void> {
    const { error } = await supabase
      .from('sequences')
      .delete()
      .eq('id', sequenceId);

    if (error) {
      console.error('[SequenceService] Failed to delete sequence:', error);
      throw error;
    }
  }

  /**
   * Duplicate a sequence
   */
  async duplicateSequence(sequenceId: string): Promise<Sequence> {
    const original = await this.getSequence(sequenceId);
    if (!original) throw new Error('Sequence not found');

    // Create new sequence
    const newSequence = await this.createSequence(original.org_id, {
      name: `${original.name} (Copy)`,
      description: original.description || undefined,
      trigger_type: original.trigger_type,
      trigger_conditions: original.trigger_conditions,
      send_window_start: original.send_window_start,
      send_window_end: original.send_window_end,
      send_days: original.send_days,
      timezone: original.timezone,
      exit_on_reply: original.exit_on_reply,
      exit_on_meeting_scheduled: original.exit_on_meeting_scheduled,
      exit_on_unsubscribe: original.exit_on_unsubscribe,
    });

    // Copy steps
    for (const step of original.steps) {
      await this.addStep(newSequence.id, {
        step_number: step.step_number,
        delay_days: step.delay_days,
        delay_hours: step.delay_hours,
        delay_minutes: step.delay_minutes,
        action_type: step.action_type,
        channel: step.channel || undefined,
        template_id: step.template_id || undefined,
        subject: step.subject || undefined,
        body_text: step.body_text || undefined,
        body_html: step.body_html || undefined,
        action_config: step.action_config,
        condition_type: step.condition_type,
      });
    }

    return newSequence;
  }

  // =========================================================================
  // STEPS
  // =========================================================================

  /**
   * Add a step to a sequence
   */
  async addStep(sequenceId: string, input: CreateStepInput): Promise<SequenceStep> {
    const { data, error } = await supabase
      .from('sequence_steps')
      .insert({
        sequence_id: sequenceId,
        step_number: input.step_number,
        delay_days: input.delay_days ?? 0,
        delay_hours: input.delay_hours ?? 0,
        delay_minutes: input.delay_minutes ?? 0,
        action_type: input.action_type,
        channel: input.channel,
        template_id: input.template_id,
        subject: input.subject,
        body_text: input.body_text,
        body_html: input.body_html,
        action_config: input.action_config || {},
        condition_type: input.condition_type || 'always',
      })
      .select()
      .single();

    if (error) {
      console.error('[SequenceService] Failed to add step:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a step
   */
  async updateStep(stepId: string, input: Partial<CreateStepInput>): Promise<SequenceStep> {
    const { data, error } = await supabase
      .from('sequence_steps')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stepId)
      .select()
      .single();

    if (error) {
      console.error('[SequenceService] Failed to update step:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a step
   */
  async deleteStep(stepId: string): Promise<void> {
    const { error } = await supabase
      .from('sequence_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      console.error('[SequenceService] Failed to delete step:', error);
      throw error;
    }
  }

  /**
   * Reorder steps
   */
  async reorderSteps(sequenceId: string, stepIds: string[]): Promise<void> {
    for (let i = 0; i < stepIds.length; i++) {
      const { error } = await supabase
        .from('sequence_steps')
        .update({ step_number: i + 1 })
        .eq('id', stepIds[i])
        .eq('sequence_id', sequenceId);

      if (error) {
        console.error('[SequenceService] Failed to reorder step:', error);
        throw error;
      }
    }
  }

  // =========================================================================
  // ENROLLMENTS
  // =========================================================================

  /**
   * Enroll a lead in a sequence
   */
  async enrollLead(orgId: string, sequenceId: string, leadId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('enroll_in_sequence', {
      p_org_id: orgId,
      p_sequence_id: sequenceId,
      p_lead_id: leadId,
    });

    if (error) {
      console.error('[SequenceService] Failed to enroll lead:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get enrollments for a sequence
   */
  async getEnrollments(
    sequenceId: string,
    options: { status?: string; limit?: number } = {}
  ): Promise<SequenceEnrollment[]> {
    let query = supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('enrolled_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SequenceService] Failed to get enrollments:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get enrollment for a specific lead
   */
  async getLeadEnrollment(
    sequenceId: string,
    leadId: string
  ): Promise<SequenceEnrollment | null> {
    const { data, error } = await supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('sequence_id', sequenceId)
      .eq('lead_id', leadId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[SequenceService] Failed to get enrollment:', error);
      throw error;
    }

    return data;
  }

  /**
   * Pause an enrollment
   */
  async pauseEnrollment(enrollmentId: string): Promise<void> {
    const { error } = await supabase
      .from('sequence_enrollments')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', enrollmentId);

    if (error) {
      console.error('[SequenceService] Failed to pause enrollment:', error);
      throw error;
    }
  }

  /**
   * Resume an enrollment
   */
  async resumeEnrollment(enrollmentId: string): Promise<void> {
    const { error } = await supabase
      .from('sequence_enrollments')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', enrollmentId);

    if (error) {
      console.error('[SequenceService] Failed to resume enrollment:', error);
      throw error;
    }
  }

  /**
   * Exit an enrollment
   */
  async exitEnrollment(enrollmentId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('sequence_enrollments')
      .update({
        status: 'exited',
        exit_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    if (error) {
      console.error('[SequenceService] Failed to exit enrollment:', error);
      throw error;
    }
  }

  /**
   * Get all active enrollments for a lead
   */
  async getLeadActiveEnrollments(leadId: string): Promise<SequenceEnrollment[]> {
    const { data, error } = await supabase
      .from('sequence_enrollments')
      .select('*, sequence:sequences(name, status)')
      .eq('lead_id', leadId)
      .eq('status', 'active');

    if (error) {
      console.error('[SequenceService] Failed to get lead enrollments:', error);
      throw error;
    }

    return data || [];
  }
}

export const sequenceService = new SequenceService();
