export type CalendarEventType = 'meeting' | 'call' | 'follow_up' | 'deadline' | 'reminder' | 'other';
export type CalendarEventStatus = 'scheduled' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  org_id: string;
  lead_id?: string;
  title: string;
  description?: string;
  event_type: CalendarEventType;
  status: CalendarEventStatus;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  meeting_link?: string;
  reminder_minutes?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface CalendarEventCreateInput {
  lead_id?: string;
  title: string;
  description?: string;
  event_type: CalendarEventType;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  meeting_link?: string;
  reminder_minutes?: number;
}

export interface CalendarEventUpdateInput {
  title?: string;
  description?: string;
  event_type?: CalendarEventType;
  status?: CalendarEventStatus;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  location?: string;
  meeting_link?: string;
  reminder_minutes?: number;
}

export interface CalendarFilters {
  event_type?: CalendarEventType;
  status?: CalendarEventStatus;
  lead_id?: string;
  from?: string;
  to?: string;
}
