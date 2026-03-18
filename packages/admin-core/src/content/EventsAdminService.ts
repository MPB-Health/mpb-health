import { supabase } from '@mpbhealth/database';

export type EventLocationType = 'in_person' | 'virtual' | 'hybrid';
export type EventType =
  | 'conference'
  | 'webinar'
  | 'training'
  | 'networking'
  | 'celebration'
  | 'community'
  | 'other';

export interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  event_date: string;
  event_end_date: string | null;
  location: string | null;
  location_type: EventLocationType;
  registration_url: string | null;
  event_type: EventType;
  organizer: string;
  max_attendees: number | null;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  gallery_images: string[];
  video_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EventCreateInput = Omit<AdminEvent, 'id' | 'created_at' | 'updated_at'>;
export type EventUpdateInput = Partial<Omit<AdminEvent, 'id' | 'created_at' | 'updated_at'>>;

export interface EventFilters {
  is_published?: boolean;
  event_type?: EventType;
  search?: string;
}

export class EventsAdminService {
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async getEvents(filters?: EventFilters): Promise<AdminEvent[]> {
    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }
    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getEvent(eventId: string): Promise<AdminEvent | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createEvent(event: EventCreateInput): Promise<AdminEvent> {
    const slug = event.slug || this.generateSlug(event.title);
    const { data, error } = await supabase
      .from('events')
      .insert({ ...event, slug })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateEvent(eventId: string, updates: EventUpdateInput): Promise<AdminEvent> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async publishEvent(eventId: string): Promise<AdminEvent> {
    return this.updateEvent(eventId, { is_published: true });
  }

  async unpublishEvent(eventId: string): Promise<AdminEvent> {
    return this.updateEvent(eventId, { is_published: false });
  }

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }
}

export const eventsAdminService = new EventsAdminService();
