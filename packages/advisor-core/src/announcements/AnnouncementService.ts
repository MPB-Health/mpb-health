import { supabase } from '@mpbhealth/database';

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  content_html: string | null;
  type: 'info' | 'warning' | 'success' | 'error';
  start_date: string;
  end_date: string | null;
  is_dismissible: boolean;
  is_active: boolean;
  target_audience: 'all' | 'new_advisors' | 'certified';
  link_url: string | null;
  link_text: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

const DISMISSED_KEY = 'mpb_dismissed_announcements';

export class AnnouncementService {
  /**
   * Get active announcements whose start_date has passed and end_date (if set)
   * hasn't been reached yet.
   */
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('advisor_announcements')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Failed to fetch active announcements:', error);
      return [];
    }

    return (data as Announcement[]) || [];
  }

  /**
   * Get the list of dismissed announcement IDs from localStorage.
   */
  getDismissedIds(): string[] {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Dismiss an announcement by persisting its ID in localStorage.
   */
  dismissAnnouncement(announcementId: string): void {
    const dismissed = this.getDismissedIds();
    if (!dismissed.includes(announcementId)) {
      dismissed.push(announcementId);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  }

  /**
   * Filter out announcements the user has already dismissed.
   */
  filterDismissed(announcements: Announcement[]): Announcement[] {
    const dismissed = new Set(this.getDismissedIds());
    return announcements.filter((a) => !dismissed.has(a.id));
  }

  /**
   * Subscribe to real-time changes on the advisor_announcements table.
   * Calls the provided callback with a fresh list of active announcements
   * whenever an INSERT, UPDATE, or DELETE occurs.
   */
  subscribeToAnnouncements(callback: (announcements: Announcement[]) => void) {
    return supabase
      .channel('advisor-announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisor_announcements',
        },
        async () => {
          const announcements = await this.getActiveAnnouncements();
          callback(announcements);
        }
      )
      .subscribe();
  }
}

export const announcementService = new AnnouncementService();
