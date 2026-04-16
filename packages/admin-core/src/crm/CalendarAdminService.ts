import { supabase } from '@mpbhealth/database';

export interface CalendarEvent {
  id: string;
  org_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  event_type: string | null;
  color: string | null;
  attendees: unknown[];
  reminders: unknown[];
  recurrence_rule: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarEventCreateInput = Pick<
  CalendarEvent,
  'title' | 'start_time' | 'end_time'
> &
  Partial<
    Pick<
      CalendarEvent,
      | 'description'
      | 'all_day'
      | 'location'
      | 'event_type'
      | 'color'
      | 'attendees'
      | 'reminders'
      | 'recurrence_rule'
    >
  >;
export type CalendarEventUpdateInput = Partial<CalendarEventCreateInput>;

export class CalendarAdminService {
  async getAll(filters?: {
    month?: string;
    eventType?: string;
  }): Promise<CalendarEvent[]> {
    let query = supabase
      .from('calendar_events')
      .select('id, org_id, title, description, start_time, end_time, all_day, location, event_type, color, attendees, reminders, recurrence_rule, created_by, created_at, updated_at')
      .order('start_time', { ascending: true });

    if (filters?.month) {
      const start = new Date(filters.month + '-01T00:00:00Z');
      const end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      query = query
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());
    }
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as CalendarEvent[];
  }

  async getById(id: string): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, org_id, title, description, start_time, end_time, all_day, location, event_type, color, attendees, reminders, recurrence_rule, created_by, created_at, updated_at')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as unknown as CalendarEvent;
  }

  async create(input: CalendarEventCreateInput): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({ ...input, all_day: input.all_day ?? false })
      .select('id, org_id, title, description, start_time, end_time, all_day, location, event_type, color, attendees, reminders, recurrence_rule, created_by, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as CalendarEvent;
  }

  async update(
    id: string,
    input: CalendarEventUpdateInput,
  ): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, org_id, title, description, start_time, end_time, all_day, location, event_type, color, attendees, reminders, recurrence_rule, created_by, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as unknown as CalendarEvent;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getUpcoming(limit = 10): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, org_id, title, description, start_time, end_time, all_day, location, event_type, color, attendees, reminders, recurrence_rule, created_by, created_at, updated_at')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data || []) as unknown as CalendarEvent[];
  }
}

export const calendarAdminService = new CalendarAdminService();
