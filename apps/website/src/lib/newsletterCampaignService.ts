import { supabase } from './supabase';

export interface NewsletterCampaign {
  id: string;
  blog_post_id?: string;
  subject_line: string;
  preview_text?: string;
  send_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  target_segment: Record<string, any>;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  open_rate: number;
  click_rate: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterQueueItem {
  id: string;
  campaign_id: string;
  subscriber_id: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounce_reason?: string;
  error_message?: string;
  tracking_token?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Create a new newsletter campaign
 */
export async function createNewsletterCampaign(
  campaign: Omit<
    NewsletterCampaign,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'sent_count'
    | 'delivered_count'
    | 'opened_count'
    | 'clicked_count'
    | 'bounced_count'
    | 'unsubscribed_count'
    | 'open_rate'
    | 'click_rate'
  >
): Promise<NewsletterCampaign | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .insert({
        ...campaign,
        created_by: user?.id,
      })
      .select('id, blog_post_id, subject_line, preview_text, send_at, status, target_segment, sent_count, delivered_count, opened_count, clicked_count, bounced_count, unsubscribed_count, open_rate, click_rate, created_by, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  } catch (error) {
    console.error('Create campaign error:', error);
    return null;
  }
}

/**
 * Get a campaign by ID
 */
export async function getNewsletterCampaign(campaignId: string): Promise<NewsletterCampaign | null> {
  try {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('id, blog_post_id, subject_line, preview_text, send_at, status, target_segment, sent_count, delivered_count, opened_count, clicked_count, bounced_count, unsubscribed_count, open_rate, click_rate, created_by, created_at, updated_at')
      .eq('id', campaignId)
      .single();

    if (error) throw error;
    return data as any;
  } catch (error) {
    console.error('Get campaign error:', error);
    return null;
  }
}

/**
 * Get all campaigns with optional filters
 */
export async function getNewsletterCampaigns(filters?: {
  status?: string;
  blogPostId?: string;
  limit?: number;
}): Promise<NewsletterCampaign[]> {
  try {
    let query = supabase
      .from('newsletter_campaigns')
      .select('id, blog_post_id, subject_line, preview_text, send_at, status, target_segment, sent_count, delivered_count, opened_count, clicked_count, bounced_count, unsubscribed_count, open_rate, click_rate, created_by, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.blogPostId) {
      query = query.eq('blog_post_id', filters.blogPostId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as any;
  } catch (error) {
    console.error('Get campaigns error:', error);
    return [];
  }
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: NewsletterCampaign['status']
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('newsletter_campaigns')
      .update({ status })
      .eq('id', campaignId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Update campaign status error:', error);
    return false;
  }
}

/**
 * Schedule a newsletter campaign
 */
export async function scheduleCampaign(
  campaignId: string,
  sendAt: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: updateError } = await supabase
      .from('newsletter_campaigns')
      .update({
        send_at: sendAt,
        status: 'scheduled',
      })
      .eq('id', campaignId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Schedule campaign error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send campaign immediately
 */
export async function sendCampaignNow(
  campaignId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateCampaignStatus(campaignId, 'sending');

    const { data: activeSubscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email')
      .eq('status', 'active');

    if (subscribersError) throw subscribersError;

    if (!activeSubscribers || activeSubscribers.length === 0) {
      throw new Error('No active subscribers found');
    }

    const queueItems = activeSubscribers.map((subscriber) => ({
      campaign_id: campaignId,
      subscriber_id: subscriber.id,
      status: 'pending' as const,
      tracking_token: generateTrackingToken(),
    }));

    const { error: queueError } = await supabase
      .from('newsletter_queue')
      .insert(queueItems);

    if (queueError) throw queueError;

    return { success: true };
  } catch (error) {
    console.error('Send campaign error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel a scheduled campaign
 */
export async function cancelCampaign(campaignId: string): Promise<boolean> {
  return updateCampaignStatus(campaignId, 'cancelled');
}

/**
 * Get campaign queue items
 */
export async function getCampaignQueue(campaignId: string): Promise<NewsletterQueueItem[]> {
  try {
    const { data, error } = await supabase
      .from('newsletter_queue')
      .select('id, campaign_id, subscriber_id, status, sent_at, opened_at, clicked_at, bounce_reason, error_message, tracking_token, metadata, created_at')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  } catch (error) {
    console.error('Get campaign queue error:', error);
    return [];
  }
}

/**
 * Track email open
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

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Track email open error:', error);
    return false;
  }
}

/**
 * Track email click
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

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Track email click error:', error);
    return false;
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string): Promise<{
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
}> {
  try {
    const { data, error } = await supabase
      .from('newsletter_queue')
      .select('status, opened_at, clicked_at')
      .eq('campaign_id', campaignId);

    if (error) throw error;

    const sent = data?.filter((item) => ['sent', 'opened', 'clicked'].includes(item.status)) || [];
    const opened = data?.filter((item) => item.opened_at) || [];
    const clicked = data?.filter((item) => item.clicked_at) || [];
    const bounced = data?.filter((item) => item.status === 'bounced') || [];

    const totalSent = sent.length;
    const totalOpened = opened.length;
    const totalClicked = clicked.length;
    const totalBounced = bounced.length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const clickToOpenRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      openRate,
      clickRate,
      clickToOpenRate,
    };
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
    };
  }
}

/**
 * Generate a unique tracking token
 */
function generateTrackingToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get campaign performance comparison
 */
export async function getCampaignPerformanceComparison(): Promise<{
  campaigns: Array<{
    id: string;
    subject_line: string;
    sent_count: number;
    open_rate: number;
    click_rate: number;
    sent_at: string;
  }>;
  avgOpenRate: number;
  avgClickRate: number;
}> {
  try {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('id, subject_line, sent_count, open_rate, click_rate, send_at')
      .eq('status', 'sent')
      .order('send_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const campaigns = (data || []).map((c) => ({
      id: c.id,
      subject_line: c.subject_line,
      sent_count: c.sent_count,
      open_rate: c.open_rate,
      click_rate: c.click_rate,
      sent_at: c.send_at!,
    }));

    const avgOpenRate =
      campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + c.open_rate, 0) / campaigns.length
        : 0;

    const avgClickRate =
      campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + c.click_rate, 0) / campaigns.length
        : 0;

    return {
      campaigns,
      avgOpenRate,
      avgClickRate,
    };
  } catch (error) {
    console.error('Get campaign performance comparison error:', error);
    return {
      campaigns: [],
      avgOpenRate: 0,
      avgClickRate: 0,
    };
  }
}
