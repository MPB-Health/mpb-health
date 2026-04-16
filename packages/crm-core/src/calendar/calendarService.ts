import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CalendarEvent,
  CalendarEventCreateInput,
  CalendarEventUpdateInput,
  CalendarFilters,
} from './types';

export class CalendarService {
  constructor(private supabase: SupabaseClient) {}

  async getEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      let query = this.supabase
        .from('calendar_events')
        .select('id, org_id, lead_id, title, description, event_type, status, start_time, end_time, all_day, location, meeting_link, reminder_minutes, created_by, created_at, updated_at')
        .order('start_time', { ascending: true });

      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters?.from) {
        query = query.gte('start_time', filters.from);
      }
      if (filters?.to) {
        query = query.lte('start_time', filters.to);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }
      return (data || []) as any;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async getEvent(id: string): Promise<CalendarEvent | null> {
    try {
      const { data, error } = await this.supabase
        .from('calendar_events')
        .select('id, org_id, lead_id, title, description, event_type, status, start_time, end_time, all_day, location, meeting_link, reminder_minutes, created_by, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching calendar event:', error);
        return null;
      }
      return data as any;
    } catch (error) {
      console.error('Error fetching calendar event:', error);
      return null;
    }
  }

  async getEventsForMonth(year: number, month: number): Promise<CalendarEvent[]> {
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    return this.getEvents({ from, to });
  }

  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date().toISOString();
    const future = new Date();
    future.setDate(future.getDate() + days);
    return this.getEvents({ from: now, to: future.toISOString(), status: 'scheduled' });
  }

  async createEvent(
    input: CalendarEventCreateInput
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const { data: userData } = await this.supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data, error } = await this.supabase
        .from('calendar_events')
        .insert({
          ...input,
          all_day: input.all_day ?? false,
          status: 'scheduled',
          created_by: userId,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating calendar event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, eventId: data.id };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async updateEvent(
    id: string,
    updates: CalendarEventUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating calendar event:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting calendar event:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }
}

export function createCalendarService(supabase: SupabaseClient): CalendarService {
  return new CalendarService(supabase);
}
