import { supabase } from '@mpbhealth/database';
import type { CmsEvent } from '../types';

export interface EventFilters {
  search?: string;
  event_type?: string;
  is_published?: boolean;
}

export class EventsService {
  /** List all events (admin view — includes drafts) */
  async getEvents(filters?: EventFilters): Promise<CmsEvent[]> {
    let query = supabase
      .from('events')
      .select('id, title, slug, excerpt, content, featured_image_url, event_date, event_end_date, location, location_type, registration_url, event_type, organizer, max_attendees, is_published, is_featured, tags, gallery_images, video_url, created_by, created_at, updated_at')
      .order('event_date', { ascending: false });

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
      );
    }
    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  /** Get single event by ID */
  async getEvent(eventId: string): Promise<CmsEvent | null> {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, excerpt, content, featured_image_url, event_date, event_end_date, location, location_type, registration_url, event_type, organizer, max_attendees, is_published, is_featured, tags, gallery_images, video_url, created_by, created_at, updated_at')
      .eq('id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  /** Create event */
  async createEvent(
    event: Omit<CmsEvent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CmsEvent> {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select('id, title, slug, excerpt, content, featured_image_url, event_date, event_end_date, location, location_type, registration_url, event_type, organizer, max_attendees, is_published, is_featured, tags, gallery_images, video_url, created_by, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  /** Update event */
  async updateEvent(
    eventId: string,
    updates: Partial<CmsEvent>
  ): Promise<CmsEvent> {
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select('id, title, slug, excerpt, content, featured_image_url, event_date, event_end_date, location, location_type, registration_url, event_type, organizer, max_attendees, is_published, is_featured, tags, gallery_images, video_url, created_by, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  /** Delete event */
  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }
}

export const eventsService = new EventsService();
