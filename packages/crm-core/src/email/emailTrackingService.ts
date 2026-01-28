import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EmailTracking,
  EmailTrackingStats,
  EmailLogEntry,
  EmailLogFilters,
  TrackingType,
  DeviceType,
} from './types';

export class EmailTrackingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Record an email open event
   */
  async trackOpen(
    trackingId: string,
    metadata?: {
      ip_address?: string;
      user_agent?: string;
    }
  ): Promise<boolean> {
    try {
      // Find email by tracking_id
      const { data: email, error: emailError } = await this.supabase
        .from('crm_email_log')
        .select('id')
        .eq('tracking_id', trackingId)
        .single();

      if (emailError || !email) return false;

      const deviceType = this.parseDeviceType(metadata?.user_agent);

      const { error } = await this.supabase
        .from('email_tracking')
        .insert({
          email_log_id: email.id,
          tracking_type: 'open',
          ip_address: metadata?.ip_address,
          user_agent: metadata?.user_agent,
          device_type: deviceType,
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('EmailTrackingService.trackOpen error:', err);
      return false;
    }
  }

  /**
   * Record an email click event
   */
  async trackClick(
    trackingId: string,
    linkUrl: string,
    metadata?: {
      ip_address?: string;
      user_agent?: string;
    }
  ): Promise<boolean> {
    try {
      // Find email by tracking_id
      const { data: email, error: emailError } = await this.supabase
        .from('crm_email_log')
        .select('id')
        .eq('tracking_id', trackingId)
        .single();

      if (emailError || !email) return false;

      const deviceType = this.parseDeviceType(metadata?.user_agent);

      const { error } = await this.supabase
        .from('email_tracking')
        .insert({
          email_log_id: email.id,
          tracking_type: 'click',
          link_url: linkUrl,
          ip_address: metadata?.ip_address,
          user_agent: metadata?.user_agent,
          device_type: deviceType,
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('EmailTrackingService.trackClick error:', err);
      return false;
    }
  }

  /**
   * Get tracking events for an email
   */
  async getEmailTracking(emailLogId: string): Promise<EmailTracking[]> {
    try {
      const { data, error } = await this.supabase
        .from('email_tracking')
        .select('*')
        .eq('email_log_id', emailLogId)
        .order('tracked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('EmailTrackingService.getEmailTracking error:', err);
      return [];
    }
  }

  /**
   * Get email log with enhanced filtering
   */
  async getEmailLog(
    filters?: EmailLogFilters,
    pagination?: { page: number; pageSize: number }
  ): Promise<{ data: EmailLogEntry[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_email_log')
        .select('*', { count: 'exact' })
        .order('sent_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.template_id) {
        query = query.eq('template_id', filters.template_id);
      }
      if (filters?.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters?.sent_by) {
        query = query.eq('sent_by', filters.sent_by);
      }
      if (filters?.date_from) {
        query = query.gte('sent_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('sent_at', filters.date_to);
      }
      if (filters?.search) {
        query = query.or(`to_email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }
      if (filters?.has_opened) {
        query = query.gt('open_count', 0);
      }
      if (filters?.has_clicked) {
        query = query.gt('click_count', 0);
      }

      if (pagination) {
        const { page, pageSize } = pagination;
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      } else {
        query = query.limit(50);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data || [], total: count || 0 };
    } catch (err) {
      console.error('EmailTrackingService.getEmailLog error:', err);
      return { data: [], total: 0 };
    }
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStats(
    orgId: string,
    dateRange?: { from: string; to: string }
  ): Promise<EmailTrackingStats> {
    try {
      let emailQuery = this.supabase
        .from('crm_email_log')
        .select('id, open_count, click_count, first_opened_at, sent_at')
        .eq('org_id', orgId)
        .eq('status', 'sent');

      if (dateRange) {
        emailQuery = emailQuery.gte('sent_at', dateRange.from).lte('sent_at', dateRange.to);
      }

      const { data: emails, error: emailsError } = await emailQuery;
      if (emailsError) throw emailsError;

      const stats: EmailTrackingStats = {
        total_sent: emails?.length || 0,
        total_opened: 0,
        total_clicked: 0,
        open_rate: 0,
        click_rate: 0,
        click_to_open_rate: 0,
        opens_by_device: { desktop: 0, mobile: 0, tablet: 0 },
        opens_by_country: {},
        opens_over_time: [],
        top_clicked_links: [],
      };

      if (!emails?.length) return stats;

      // Calculate totals
      let openedCount = 0;
      let clickedCount = 0;
      const opensByDay: Record<string, number> = {};

      for (const email of emails) {
        if (email.open_count > 0) openedCount++;
        if (email.click_count > 0) clickedCount++;

        if (email.first_opened_at) {
          const day = email.first_opened_at.split('T')[0];
          opensByDay[day] = (opensByDay[day] || 0) + 1;
        }
      }

      stats.total_opened = openedCount;
      stats.total_clicked = clickedCount;
      stats.open_rate = stats.total_sent > 0
        ? Math.round((openedCount / stats.total_sent) * 1000) / 10
        : 0;
      stats.click_rate = stats.total_sent > 0
        ? Math.round((clickedCount / stats.total_sent) * 1000) / 10
        : 0;
      stats.click_to_open_rate = openedCount > 0
        ? Math.round((clickedCount / openedCount) * 1000) / 10
        : 0;

      stats.opens_over_time = Object.entries(opensByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Get detailed tracking data for device/country stats
      const emailIds = emails.map((e) => e.id);
      if (emailIds.length > 0) {
        const { data: trackingData } = await this.supabase
          .from('email_tracking')
          .select('device_type, location_country, link_url, tracking_type')
          .in('email_log_id', emailIds);

        if (trackingData) {
          const linkCounts: Record<string, number> = {};

          for (const t of trackingData) {
            // Device stats
            if (t.tracking_type === 'open' && t.device_type) {
              const device = t.device_type as DeviceType;
              stats.opens_by_device[device] = (stats.opens_by_device[device] || 0) + 1;
            }

            // Country stats
            if (t.tracking_type === 'open' && t.location_country) {
              stats.opens_by_country[t.location_country] =
                (stats.opens_by_country[t.location_country] || 0) + 1;
            }

            // Link clicks
            if (t.tracking_type === 'click' && t.link_url) {
              linkCounts[t.link_url] = (linkCounts[t.link_url] || 0) + 1;
            }
          }

          stats.top_clicked_links = Object.entries(linkCounts)
            .map(([url, count]) => ({ url, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        }
      }

      return stats;
    } catch (err) {
      console.error('EmailTrackingService.getTrackingStats error:', err);
      return {
        total_sent: 0,
        total_opened: 0,
        total_clicked: 0,
        open_rate: 0,
        click_rate: 0,
        click_to_open_rate: 0,
        opens_by_device: { desktop: 0, mobile: 0, tablet: 0 },
        opens_by_country: {},
        opens_over_time: [],
        top_clicked_links: [],
      };
    }
  }

  /**
   * Generate tracking pixel URL for email opens
   */
  generateTrackingPixel(trackingId: string, baseUrl: string): string {
    return `${baseUrl}/api/email/track/open?tid=${trackingId}`;
  }

  /**
   * Generate tracked link URL
   */
  generateTrackedLink(trackingId: string, originalUrl: string, baseUrl: string): string {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${baseUrl}/api/email/track/click?tid=${trackingId}&url=${encodedUrl}`;
  }

  /**
   * Add tracking to email HTML
   */
  addTrackingToHtml(html: string, trackingId: string, baseUrl: string): string {
    // Add tracking pixel before closing body tag
    const trackingPixel = `<img src="${this.generateTrackingPixel(trackingId, baseUrl)}" width="1" height="1" style="display:none;" alt="" />`;
    let trackedHtml = html.replace('</body>', `${trackingPixel}</body>`);

    // If no body tag, append to end
    if (!html.includes('</body>')) {
      trackedHtml = html + trackingPixel;
    }

    // Replace links with tracked versions
    trackedHtml = trackedHtml.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const trackedUrl = this.generateTrackedLink(trackingId, url, baseUrl);
        return `href="${trackedUrl}"`;
      }
    );

    return trackedHtml;
  }

  /**
   * Parse device type from user agent
   */
  private parseDeviceType(userAgent?: string): DeviceType {
    if (!userAgent) return 'desktop';

    const ua = userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      return 'mobile';
    }
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  }
}

export function createEmailTrackingService(supabase: SupabaseClient): EmailTrackingService {
  return new EmailTrackingService(supabase);
}
