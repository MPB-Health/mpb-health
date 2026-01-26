import { supabase } from './supabase';

/**
 * Track email open event
 */
export async function trackEmailOpen(trackingToken: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('newsletter_queue')
      .update({
        status: 'opened',
        opened_at: new Date().toISOString(),
      })
      .eq('tracking_token', trackingToken)
      .is('opened_at', null);

    if (error) {
      console.error('Track email open error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Track email open exception:', error);
    return false;
  }
}

/**
 * Track email click event
 */
export async function trackEmailClick(trackingToken: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('newsletter_queue')
      .update({
        status: 'clicked',
        clicked_at: new Date().toISOString(),
      })
      .eq('tracking_token', trackingToken)
      .is('clicked_at', null);

    if (error) {
      console.error('Track email click error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Track email click exception:', error);
    return false;
  }
}

/**
 * Generate transparent 1x1 tracking pixel
 */
export function generateTrackingPixel(): Uint8Array {
  const base64Gif = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const binaryString = atob(base64Gif);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Get campaign tracking statistics
 */
export async function getCampaignTrackingStats(campaignId: string): Promise<{
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  uniqueOpens: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
}> {
  try {
    const { data, error } = await supabase
      .from('newsletter_queue')
      .select('status, opened_at, clicked_at, subscriber_id')
      .eq('campaign_id', campaignId);

    if (error) throw error;

    const sent = data?.filter((item) =>
      ['sent', 'opened', 'clicked'].includes(item.status)
    ) || [];

    const opens = data?.filter((item) => item.opened_at) || [];
    const clicks = data?.filter((item) => item.clicked_at) || [];

    const uniqueOpens = new Set(opens.map(item => item.subscriber_id)).size;
    const uniqueClicks = new Set(clicks.map(item => item.subscriber_id)).size;

    const totalSent = sent.length;
    const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;
    const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;

    return {
      totalSent,
      totalOpened: opens.length,
      totalClicked: clicks.length,
      uniqueOpens,
      uniqueClicks,
      openRate,
      clickRate,
      clickToOpenRate,
    };
  } catch (error) {
    console.error('Get campaign tracking stats error:', error);
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      uniqueOpens: 0,
      uniqueClicks: 0,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
    };
  }
}

/**
 * Get subscriber engagement history
 */
export async function getSubscriberEngagement(subscriberId: string): Promise<{
  totalReceived: number;
  totalOpened: number;
  totalClicked: number;
  averageOpenRate: number;
  averageClickRate: number;
  lastOpened?: string;
  lastClicked?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('newsletter_queue')
      .select('status, opened_at, clicked_at')
      .eq('subscriber_id', subscriberId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const received = data || [];
    const opened = data?.filter((item) => item.opened_at) || [];
    const clicked = data?.filter((item) => item.clicked_at) || [];

    const averageOpenRate = received.length > 0 ? (opened.length / received.length) * 100 : 0;
    const averageClickRate = received.length > 0 ? (clicked.length / received.length) * 100 : 0;

    const lastOpenedItem = opened[0];
    const lastClickedItem = clicked[0];

    return {
      totalReceived: received.length,
      totalOpened: opened.length,
      totalClicked: clicked.length,
      averageOpenRate,
      averageClickRate,
      lastOpened: lastOpenedItem?.opened_at,
      lastClicked: lastClickedItem?.clicked_at,
    };
  } catch (error) {
    console.error('Get subscriber engagement error:', error);
    return {
      totalReceived: 0,
      totalOpened: 0,
      totalClicked: 0,
      averageOpenRate: 0,
      averageClickRate: 0,
    };
  }
}

/**
 * Get top performing campaigns
 */
export async function getTopPerformingCampaigns(limit: number = 10): Promise<Array<{
  id: string;
  subject_line: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  sent_at: string;
}>> {
  try {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('id, subject_line, sent_count, open_rate, click_rate, send_at')
      .eq('status', 'sent')
      .order('open_rate', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((campaign) => ({
      id: campaign.id,
      subject_line: campaign.subject_line,
      sent_count: campaign.sent_count,
      open_rate: campaign.open_rate,
      click_rate: campaign.click_rate,
      sent_at: campaign.send_at!,
    }));
  } catch (error) {
    console.error('Get top performing campaigns error:', error);
    return [];
  }
}

/**
 * Get engagement trends over time
 */
export async function getEngagementTrends(days: number = 30): Promise<Array<{
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('newsletter_queue')
      .select('created_at, status, opened_at, clicked_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const dailyStats = new Map<string, {
      sent: number;
      opened: number;
      clicked: number;
    }>();

    data?.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];

      if (!dailyStats.has(date)) {
        dailyStats.set(date, { sent: 0, opened: 0, clicked: 0 });
      }

      const stats = dailyStats.get(date)!;

      if (['sent', 'opened', 'clicked'].includes(item.status)) {
        stats.sent++;
      }

      if (item.opened_at) {
        stats.opened++;
      }

      if (item.clicked_at) {
        stats.clicked++;
      }
    });

    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      sent: stats.sent,
      opened: stats.opened,
      clicked: stats.clicked,
      openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
      clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0,
    }));
  } catch (error) {
    console.error('Get engagement trends error:', error);
    return [];
  }
}
