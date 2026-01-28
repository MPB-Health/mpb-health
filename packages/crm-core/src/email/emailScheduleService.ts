import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EmailSchedule,
  EmailScheduleCreateInput,
  EmailScheduleUpdateInput,
  ScheduleStatus,
  ScheduleType,
} from './types';

export class EmailScheduleService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List email schedules
   */
  async list(filters?: {
    status?: ScheduleStatus;
    schedule_type?: ScheduleType;
    search?: string;
  }): Promise<EmailSchedule[]> {
    try {
      let query = this.supabase
        .from('email_schedules')
        .select(`
          *,
          template:template_id (name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.schedule_type) {
        query = query.eq('schedule_type', filters.schedule_type);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((s) => ({
        ...s,
        template_name: s.template?.name,
        recipient_filter: s.recipient_filter || {},
        recipient_list: s.recipient_list || [],
      }));
    } catch (err) {
      console.error('EmailScheduleService.list error:', err);
      return [];
    }
  }

  /**
   * Get a single schedule by ID
   */
  async get(id: string): Promise<EmailSchedule | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_schedules')
        .select(`
          *,
          template:template_id (name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        template_name: data.template?.name,
        recipient_filter: data.recipient_filter || {},
        recipient_list: data.recipient_list || [],
      };
    } catch (err) {
      console.error('EmailScheduleService.get error:', err);
      return null;
    }
  }

  /**
   * Create a new email schedule
   */
  async create(input: EmailScheduleCreateInput, orgId: string): Promise<EmailSchedule | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const nextRunAt = this.calculateNextRun(input.schedule_type, input.schedule_config);

      const { data, error } = await this.supabase
        .from('email_schedules')
        .insert({
          org_id: orgId,
          name: input.name,
          description: input.description,
          template_id: input.template_id,
          recipient_type: input.recipient_type,
          recipient_filter: input.recipient_filter || {},
          recipient_list: input.recipient_list || [],
          schedule_type: input.schedule_type,
          schedule_config: input.schedule_config,
          next_run_at: nextRunAt,
          status: 'active',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await this.logAudit('schedule.create', 'email_schedule', data.id, null, data);

      return data;
    } catch (err) {
      console.error('EmailScheduleService.create error:', err);
      return null;
    }
  }

  /**
   * Update an email schedule
   */
  async update(id: string, input: EmailScheduleUpdateInput): Promise<EmailSchedule | null> {
    try {
      const before = await this.get(id);

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.template_id !== undefined) updateData.template_id = input.template_id;
      if (input.recipient_type !== undefined) updateData.recipient_type = input.recipient_type;
      if (input.recipient_filter !== undefined) updateData.recipient_filter = input.recipient_filter;
      if (input.recipient_list !== undefined) updateData.recipient_list = input.recipient_list;
      if (input.schedule_type !== undefined) updateData.schedule_type = input.schedule_type;
      if (input.schedule_config !== undefined) updateData.schedule_config = input.schedule_config;
      if (input.status !== undefined) updateData.status = input.status;

      // Recalculate next run if schedule changed
      if (input.schedule_type || input.schedule_config) {
        const schedType = input.schedule_type || before?.schedule_type || 'once';
        const schedConfig = input.schedule_config || before?.schedule_config;
        if (schedConfig) {
          updateData.next_run_at = this.calculateNextRun(schedType, schedConfig);
        }
      }

      const { data, error } = await this.supabase
        .from('email_schedules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await this.logAudit('schedule.update', 'email_schedule', id, before, data);

      return data;
    } catch (err) {
      console.error('EmailScheduleService.update error:', err);
      return null;
    }
  }

  /**
   * Delete an email schedule
   */
  async delete(id: string): Promise<boolean> {
    try {
      const before = await this.get(id);

      const { error } = await this.supabase
        .from('email_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await this.logAudit('schedule.delete', 'email_schedule', id, before, null);

      return true;
    } catch (err) {
      console.error('EmailScheduleService.delete error:', err);
      return false;
    }
  }

  /**
   * Pause a schedule
   */
  async pause(id: string): Promise<boolean> {
    const result = await this.update(id, { status: 'paused' });
    return result !== null;
  }

  /**
   * Resume a paused schedule
   */
  async resume(id: string): Promise<boolean> {
    const schedule = await this.get(id);
    if (!schedule) return false;

    const nextRunAt = this.calculateNextRun(schedule.schedule_type, schedule.schedule_config);

    const { error } = await this.supabase
      .from('email_schedules')
      .update({
        status: 'active',
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('EmailScheduleService.resume error:', error);
      return false;
    }

    await this.logAudit('schedule.resume', 'email_schedule', id, null, { status: 'active' });

    return true;
  }

  /**
   * Get schedules due to run
   */
  async getDueSchedules(): Promise<EmailSchedule[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('email_schedules')
        .select(`
          *,
          template:template_id (name, subject, body)
        `)
        .eq('status', 'active')
        .lte('next_run_at', now);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('EmailScheduleService.getDueSchedules error:', err);
      return [];
    }
  }

  /**
   * Mark schedule as run and calculate next run time
   */
  async markAsRun(id: string, sentCount: number): Promise<void> {
    try {
      const schedule = await this.get(id);
      if (!schedule) return;

      const now = new Date().toISOString();
      let nextRunAt: string | null = null;
      let status: ScheduleStatus = 'active';

      // Calculate next run for recurring schedules
      if (schedule.schedule_type !== 'once') {
        nextRunAt = this.calculateNextRun(schedule.schedule_type, schedule.schedule_config);
      } else {
        status = 'completed';
      }

      await this.supabase
        .from('email_schedules')
        .update({
          last_run_at: now,
          next_run_at: nextRunAt,
          total_sent: schedule.total_sent + sentCount,
          status,
          updated_at: now,
        })
        .eq('id', id);
    } catch (err) {
      console.error('EmailScheduleService.markAsRun error:', err);
    }
  }

  /**
   * Calculate next run time based on schedule config
   */
  private calculateNextRun(
    scheduleType: ScheduleType,
    config: EmailSchedule['schedule_config']
  ): string | null {
    const now = new Date();
    const [hours, minutes] = (config.time || '09:00').split(':').map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    // If time has passed today, start from tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    switch (scheduleType) {
      case 'once':
        if (config.run_date) {
          return new Date(`${config.run_date}T${config.time}:00`).toISOString();
        }
        return nextRun.toISOString();

      case 'daily':
        return nextRun.toISOString();

      case 'weekly':
        if (config.days_of_week?.length) {
          // Find next matching day of week
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(nextRun);
            checkDate.setDate(checkDate.getDate() + i);
            if (config.days_of_week.includes(checkDate.getDay())) {
              if (checkDate > now) {
                return checkDate.toISOString();
              }
            }
          }
        }
        return nextRun.toISOString();

      case 'monthly':
        if (config.day_of_month) {
          nextRun.setDate(config.day_of_month);
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }
        }
        return nextRun.toISOString();

      default:
        return nextRun.toISOString();
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

export function createEmailScheduleService(supabase: SupabaseClient): EmailScheduleService {
  return new EmailScheduleService(supabase);
}
