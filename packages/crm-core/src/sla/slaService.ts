import type { SupabaseClient } from '@supabase/supabase-js';
import type { SLAConfig, SLAConfigInput, SLAOverdueLead } from './types';

export class SLAService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  async getConfig(): Promise<SLAConfig | null> {
    const { data, error } = await this.supabase
      .from('crm_sla_config')
      .select('*')
      .eq('org_id', this.orgId)
      .maybeSingle();

    if (error) {
      console.error('Failed to get SLA config:', error);
      return null;
    }
    return data as SLAConfig | null;
  }

  async upsertConfig(input: SLAConfigInput): Promise<SLAConfig | null> {
    const { data: existing } = await this.supabase
      .from('crm_sla_config')
      .select('id')
      .eq('org_id', this.orgId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await this.supabase
        .from('crm_sla_config')
        .update(input)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update SLA config:', error);
        return null;
      }
      return data as SLAConfig;
    }

    const { data, error } = await this.supabase
      .from('crm_sla_config')
      .insert({ org_id: this.orgId, ...input })
      .select()
      .single();

    if (error) {
      console.error('Failed to create SLA config:', error);
      return null;
    }
    return data as SLAConfig;
  }

  async createInitialContactTask(leadId: string): Promise<string | null> {
    const config = await this.getConfig();
    if (!config || !config.is_active) return null;

    const dueDate = this.calculateBusinessHourDeadline(
      new Date(),
      config.sla_hours,
      config.business_hours_start,
      config.business_hours_end,
      config.business_days,
      config.timezone
    );

    const { data: { user } } = await this.supabase.auth.getUser();

    const { data: lead } = await this.supabase
      .from('lead_submissions')
      .select('assigned_to, first_name, last_name')
      .eq('id', leadId)
      .single();

    const leadName = lead
      ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
      : 'Unknown';

    const { data, error } = await this.supabase
      .from('lead_tasks')
      .insert({
        lead_id: leadId,
        title: `Initial Contact — ${leadName}`,
        description: `SLA: Make initial contact within ${config.sla_hours} business hours.`,
        task_type: 'call',
        due_date: dueDate.toISOString(),
        priority: 'high',
        assigned_to: lead?.assigned_to || user?.id,
        created_by: user?.id,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create SLA task:', error);
      return null;
    }

    return data?.id || null;
  }

  async checkOverdue(): Promise<SLAOverdueLead[]> {
    const config = await this.getConfig();
    if (!config || !config.is_active) return [];

    const { data: leads, error } = await this.supabase
      .from('lead_submissions')
      .select('id, first_name, last_name, assigned_to, created_at')
      .eq('org_id', this.orgId)
      .is('last_contacted_at', null)
      .in('pipeline_stage', ['new', 'contacted'])
      .order('created_at', { ascending: true });

    if (error || !leads) return [];

    const now = new Date();
    const overdue: SLAOverdueLead[] = [];

    for (const lead of leads) {
      const deadline = this.calculateBusinessHourDeadline(
        new Date(lead.created_at),
        config.sla_hours,
        config.business_hours_start,
        config.business_hours_end,
        config.business_days,
        config.timezone
      );

      if (now > deadline) {
        const hoursOverdue = Math.round(
          (now.getTime() - deadline.getTime()) / (1000 * 60 * 60)
        );
        overdue.push({
          lead_id: lead.id,
          lead_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
          assigned_to: lead.assigned_to,
          created_at: lead.created_at,
          sla_deadline: deadline.toISOString(),
          hours_overdue: hoursOverdue,
        });
      }
    }

    return overdue;
  }

  async escalate(leadId: string): Promise<boolean> {
    const config = await this.getConfig();
    if (!config) return false;

    for (const userId of config.escalation_to) {
      await this.supabase.from('lead_notifications').insert({
        lead_id: leadId,
        user_id: userId,
        type: 'sla_breach',
        message: 'SLA breach: Lead has not been contacted within the required time.',
      });
    }

    return true;
  }

  private calculateBusinessHourDeadline(
    start: Date,
    hours: number,
    bhStart: string,
    bhEnd: string,
    businessDays: number[],
    _timezone: string
  ): Date {
    const [startH, startM] = bhStart.split(':').map(Number);
    const [endH, endM] = bhEnd.split(':').map(Number);
    const bhStartMinutes = startH * 60 + startM;
    const bhEndMinutes = endH * 60 + endM;
    const bhLengthMinutes = bhEndMinutes - bhStartMinutes;

    if (bhLengthMinutes <= 0) {
      return new Date(start.getTime() + hours * 60 * 60 * 1000);
    }

    let remainingMinutes = hours * 60;
    const cursor = new Date(start);

    const maxIterations = hours * 3;
    let iterations = 0;

    while (remainingMinutes > 0 && iterations < maxIterations) {
      iterations++;
      const dow = cursor.getDay();

      if (!businessDays.includes(dow)) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(startH, startM, 0, 0);
        continue;
      }

      const curMinutes = cursor.getHours() * 60 + cursor.getMinutes();

      if (curMinutes < bhStartMinutes) {
        cursor.setHours(startH, startM, 0, 0);
        continue;
      }

      if (curMinutes >= bhEndMinutes) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(startH, startM, 0, 0);
        continue;
      }

      const minutesLeftToday = bhEndMinutes - curMinutes;
      if (remainingMinutes <= minutesLeftToday) {
        cursor.setMinutes(cursor.getMinutes() + remainingMinutes);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= minutesLeftToday;
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(startH, startM, 0, 0);
      }
    }

    return cursor;
  }
}

export function createSLAService(
  supabase: SupabaseClient,
  orgId: string
): SLAService {
  return new SLAService(supabase, orgId);
}
