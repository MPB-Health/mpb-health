import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: 'call' | 'meeting' | 'follow_up' | 'demo' | 'other';
  start_time: string;
  end_time: string;
  all_day: boolean;
  timezone: string;
  location: string | null;
  meeting_link: string | null;
  lead_id: string | null;
  lead_name?: string;
  assigned_to: string | null;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reminder_sent: boolean;
  reminder_minutes: number;
  external_calendar_id: string | null;
  external_event_id: string | null;
  last_synced_at: string | null;
  notes: string | null;
  outcome: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_type: CalendarEvent['event_type'];
  start_time: Date;
  end_time: Date;
  all_day?: boolean;
  location?: string;
  meeting_link?: string;
  lead_id?: string;
  reminder_minutes?: number;
  notes?: string;
}

export interface EventFilters {
  startDate?: Date;
  endDate?: Date;
  status?: CalendarEvent['status'][];
  event_type?: CalendarEvent['event_type'][];
  assigned_to?: string;
  lead_id?: string;
}

export interface DayEvents {
  date: Date;
  events: CalendarEvent[];
}

// ============================================================================
// Calendar Service
// ============================================================================

class CalendarService {
  // --------------------------------------------------------------------------
  // Event CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Create a new calendar event
   */
  async createEvent(data: CreateEventData): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: event, error } = await supabase
        .from('calendar_events')
        .insert({
          title: data.title,
          description: data.description || null,
          event_type: data.event_type,
          start_time: data.start_time.toISOString(),
          end_time: data.end_time.toISOString(),
          all_day: data.all_day || false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          location: data.location || null,
          meeting_link: data.meeting_link || null,
          lead_id: data.lead_id || null,
          assigned_to: user?.id,
          status: 'scheduled',
          reminder_minutes: data.reminder_minutes || 30,
          notes: data.notes || null,
          created_by: user?.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, eventId: event?.id };
    } catch (error) {
      console.error('Create event error:', error);
      return { success: false, error: 'Failed to create event' };
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'created_by'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update event error:', error);
      return { success: false, error: 'Failed to update event' };
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete event error:', error);
      return { success: false, error: 'Failed to delete event' };
    }
  }

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          lead:zoho_lead_submissions(first_name, last_name)
        `)
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Get event error:', error);
        return null;
      }

      return {
        ...data,
        lead_name: data.lead ? `${data.lead.first_name} ${data.lead.last_name}` : null,
      };
    } catch (error) {
      console.error('Get event error:', error);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Event Queries
  // --------------------------------------------------------------------------

  /**
   * Get events for a date range
   */
  async getEvents(filters: EventFilters = {}): Promise<CalendarEvent[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          lead:zoho_lead_submissions(first_name, last_name)
        `)
        .eq('assigned_to', user.id)
        .order('start_time', { ascending: true });

      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('start_time', filters.endDate.toISOString());
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.event_type && filters.event_type.length > 0) {
        query = query.in('event_type', filters.event_type);
      }

      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get events error:', error);
        return [];
      }

      return (data || []).map(event => ({
        ...event,
        lead_name: event.lead ? `${event.lead.first_name} ${event.lead.last_name}` : null,
      }));
    } catch (error) {
      console.error('Get events error:', error);
      return [];
    }
  }

  /**
   * Get events for a specific day
   */
  async getEventsForDay(date: Date): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getEvents({
      startDate: startOfDay,
      endDate: endOfDay,
    });
  }

  /**
   * Get events for a week
   */
  async getEventsForWeek(weekStart: Date): Promise<DayEvents[]> {
    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const events = await this.getEvents({
      startDate: weekStart,
      endDate: endOfWeek,
    });

    // Group events by day
    const dayEvents: DayEvents[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      dayEvents.push({
        date: day,
        events: events.filter(e => {
          const eventDate = new Date(e.start_time);
          return eventDate >= dayStart && eventDate <= dayEnd;
        }),
      });
    }

    return dayEvents;
  }

  /**
   * Get events for a month
   */
  async getEventsForMonth(year: number, month: number): Promise<Map<string, CalendarEvent[]>> {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const events = await this.getEvents({
      startDate: startOfMonth,
      endDate: endOfMonth,
    });

    // Group events by date string
    const eventsByDate = new Map<string, CalendarEvent[]>();
    
    events.forEach(event => {
      const dateKey = new Date(event.start_time).toISOString().split('T')[0];
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey)!.push(event);
    });

    return eventsByDate;
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getEvents({
      startDate: now,
      endDate,
      status: ['scheduled', 'confirmed'],
    });
  }

  /**
   * Get today's events
   */
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    return this.getEventsForDay(new Date());
  }

  /**
   * Get events for a specific lead
   */
  async getLeadEvents(leadId: string): Promise<CalendarEvent[]> {
    return this.getEvents({ lead_id: leadId });
  }

  // --------------------------------------------------------------------------
  // Event Status Management
  // --------------------------------------------------------------------------

  /**
   * Mark event as completed
   */
  async completeEvent(eventId: string, outcome?: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEvent(eventId, {
      status: 'completed',
      outcome,
    });
  }

  /**
   * Cancel an event
   */
  async cancelEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEvent(eventId, { status: 'cancelled' });
  }

  /**
   * Mark as no-show
   */
  async markNoShow(eventId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEvent(eventId, { status: 'no_show' });
  }

  /**
   * Confirm an event
   */
  async confirmEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEvent(eventId, { status: 'confirmed' });
  }

  // --------------------------------------------------------------------------
  // Reminder Management
  // --------------------------------------------------------------------------

  /**
   * Get events that need reminders sent
   */
  async getEventsNeedingReminders(): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      
      // Get events in the next 24 hours that haven't had reminders sent
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('reminder_sent', false)
        .in('status', ['scheduled', 'confirmed'])
        .gte('start_time', now.toISOString())
        .lte('start_time', new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Get reminder events error:', error);
        return [];
      }

      // Filter events where reminder time has passed
      return (data || []).filter(event => {
        const eventTime = new Date(event.start_time).getTime();
        const reminderTime = eventTime - (event.reminder_minutes * 60 * 1000);
        return now.getTime() >= reminderTime;
      });
    } catch (error) {
      console.error('Get reminder events error:', error);
      return [];
    }
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(eventId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateEvent(eventId, { reminder_sent: true });
  }

  // --------------------------------------------------------------------------
  // Quick Scheduling
  // --------------------------------------------------------------------------

  /**
   * Quick schedule a call with a lead
   */
  async scheduleCallWithLead(
    leadId: string,
    leadName: string,
    datetime: Date,
    durationMinutes: number = 30
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const endTime = new Date(datetime.getTime() + durationMinutes * 60 * 1000);

    return this.createEvent({
      title: `Call with ${leadName}`,
      event_type: 'call',
      start_time: datetime,
      end_time: endTime,
      lead_id: leadId,
      reminder_minutes: 15,
    });
  }

  /**
   * Quick schedule a follow-up
   */
  async scheduleFollowUp(
    leadId: string,
    leadName: string,
    datetime: Date,
    notes?: string
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const endTime = new Date(datetime.getTime() + 15 * 60 * 1000);

    return this.createEvent({
      title: `Follow up: ${leadName}`,
      event_type: 'follow_up',
      start_time: datetime,
      end_time: endTime,
      lead_id: leadId,
      reminder_minutes: 30,
      notes,
    });
  }

  // --------------------------------------------------------------------------
  // Calendar Stats
  // --------------------------------------------------------------------------

  /**
   * Get calendar statistics
   */
  async getCalendarStats(): Promise<{
    todayEvents: number;
    thisWeekEvents: number;
    completedThisWeek: number;
    noShowsThisWeek: number;
    upcomingCount: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          todayEvents: 0,
          thisWeekEvents: 0,
          completedThisWeek: 0,
          noShowsThisWeek: 0,
          upcomingCount: 0,
        };
      }

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('start_time, status')
        .eq('assigned_to', user.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString());

      if (error) {
        console.error('Get calendar stats error:', error);
        return {
          todayEvents: 0,
          thisWeekEvents: 0,
          completedThisWeek: 0,
          noShowsThisWeek: 0,
          upcomingCount: 0,
        };
      }

      const events = data || [];

      const todayEvents = events.filter(e => {
        const d = new Date(e.start_time);
        return d >= todayStart && d <= todayEnd;
      }).length;

      const completedThisWeek = events.filter(e => e.status === 'completed').length;
      const noShowsThisWeek = events.filter(e => e.status === 'no_show').length;

      // Get upcoming count
      const { count } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('start_time', now.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      return {
        todayEvents,
        thisWeekEvents: events.length,
        completedThisWeek,
        noShowsThisWeek,
        upcomingCount: count || 0,
      };
    } catch (error) {
      console.error('Get calendar stats error:', error);
      return {
        todayEvents: 0,
        thisWeekEvents: 0,
        completedThisWeek: 0,
        noShowsThisWeek: 0,
        upcomingCount: 0,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Get available time slots for a day
   */
  getAvailableSlots(
    events: CalendarEvent[],
    date: Date,
    slotDuration: number = 30,
    workdayStart: number = 9,
    workdayEnd: number = 17
  ): Date[] {
    const slots: Date[] = [];
    const day = new Date(date);
    day.setHours(workdayStart, 0, 0, 0);

    while (day.getHours() < workdayEnd) {
      const slotEnd = new Date(day.getTime() + slotDuration * 60 * 1000);
      
      // Check if slot conflicts with any event
      const hasConflict = events.some(event => {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        return (day >= eventStart && day < eventEnd) ||
               (slotEnd > eventStart && slotEnd <= eventEnd) ||
               (day <= eventStart && slotEnd >= eventEnd);
      });

      if (!hasConflict) {
        slots.push(new Date(day));
      }

      day.setMinutes(day.getMinutes() + slotDuration);
    }

    return slots;
  }

  /**
   * Format event time for display
   */
  formatEventTime(event: CalendarEvent): string {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);

    if (event.all_day) {
      return 'All day';
    }

    const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `${startTime} - ${endTime}`;
  }
}

export const calendarService = new CalendarService();

