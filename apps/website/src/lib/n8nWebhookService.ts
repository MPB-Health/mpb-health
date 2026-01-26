import { supabase } from './supabase';

export interface WebhookDeliveryLog {
  id: string;
  webhook_url: string;
  event_type: string;
  payload: Record<string, any>;
  response_status?: number;
  response_body?: string;
  success: boolean;
  retry_count: number;
  error_message?: string;
  created_at: string;
}

export interface TriggerWebhookRequest {
  eventType: string;
  webhookUrl: string;
  data: Record<string, any>;
  retryConfig?: {
    maxRetries?: number;
    retryDelay?: number;
  };
}

export interface TriggerWebhookResponse {
  success: boolean;
  message?: string;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
}

/**
 * Trigger an n8n webhook with automatic retry logic
 */
export async function triggerN8nWebhook(
  request: TriggerWebhookRequest
): Promise<TriggerWebhookResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/trigger-n8n-webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger webhook');
    }

    return await response.json();
  } catch (error) {
    console.error('Trigger webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Trigger webhook when blog post is published
 */
export async function triggerBlogPublishedWebhook(
  blogPost: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    author: string;
    published_date: string;
    featured_image_url: string;
    category: string;
    tags?: string[];
  },
  webhookUrl: string
): Promise<TriggerWebhookResponse> {
  const baseUrl = window.location.origin;

  return triggerN8nWebhook({
    eventType: 'blog_published',
    webhookUrl,
    data: {
      blog_post: {
        ...blogPost,
        full_url: `${baseUrl}/blog/${blogPost.slug}`,
      },
      timestamp: new Date().toISOString(),
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 2000,
    },
  });
}

/**
 * Trigger webhook when newsletter campaign is scheduled
 */
export async function triggerNewsletterScheduledWebhook(
  campaign: {
    id: string;
    blog_post_id: string;
    subject_line: string;
    preview_text?: string;
    send_at: string;
    target_segment: Record<string, any>;
  },
  webhookUrl: string
): Promise<TriggerWebhookResponse> {
  return triggerN8nWebhook({
    eventType: 'newsletter_scheduled',
    webhookUrl,
    data: {
      campaign,
      timestamp: new Date().toISOString(),
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 2000,
    },
  });
}

/**
 * Trigger webhook for newsletter sending
 */
export async function triggerNewsletterSendWebhook(
  campaign: {
    id: string;
    blog_post_id: string;
    subject_line: string;
  },
  subscribers: Array<{
    id: string;
    email: string;
    tracking_token: string;
  }>,
  webhookUrl: string
): Promise<TriggerWebhookResponse> {
  return triggerN8nWebhook({
    eventType: 'newsletter_send',
    webhookUrl,
    data: {
      campaign,
      subscribers,
      timestamp: new Date().toISOString(),
    },
    retryConfig: {
      maxRetries: 5,
      retryDelay: 3000,
    },
  });
}

/**
 * Get webhook delivery logs
 */
export async function getWebhookDeliveryLogs(
  filters?: {
    eventType?: string;
    success?: boolean;
    limit?: number;
  }
): Promise<WebhookDeliveryLog[]> {
  try {
    let query = supabase
      .from('webhook_delivery_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    if (filters?.success !== undefined) {
      query = query.eq('success', filters.success);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get webhook logs error:', error);
    return [];
  }
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(): Promise<{
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deliveriesByEventType: Record<string, number>;
  averageRetryCount: number;
}> {
  try {
    const { data, error } = await supabase
      .from('webhook_delivery_logs')
      .select('success, event_type, retry_count');

    if (error) throw error;

    const stats = {
      totalDeliveries: data?.length || 0,
      successfulDeliveries: data?.filter((log) => log.success).length || 0,
      failedDeliveries: data?.filter((log) => !log.success).length || 0,
      deliveriesByEventType: {} as Record<string, number>,
      averageRetryCount: 0,
    };

    if (data) {
      data.forEach((log) => {
        stats.deliveriesByEventType[log.event_type] =
          (stats.deliveriesByEventType[log.event_type] || 0) + 1;
      });

      const totalRetries = data.reduce((sum, log) => sum + (log.retry_count || 0), 0);
      stats.averageRetryCount = data.length > 0 ? totalRetries / data.length : 0;
    }

    return stats;
  } catch (error) {
    console.error('Get webhook stats error:', error);
    return {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      deliveriesByEventType: {},
      averageRetryCount: 0,
    };
  }
}

/**
 * Test a webhook URL
 */
export async function testWebhook(webhookUrl: string): Promise<TriggerWebhookResponse> {
  return triggerN8nWebhook({
    eventType: 'webhook_test',
    webhookUrl,
    data: {
      test: true,
      message: 'This is a test webhook from MPB Health',
      timestamp: new Date().toISOString(),
    },
    retryConfig: {
      maxRetries: 1,
      retryDelay: 1000,
    },
  });
}

/**
 * Validate webhook URL format
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Get webhook health status
 */
export async function getWebhookHealth(webhookUrl: string): Promise<{
  healthy: boolean;
  lastSuccess?: string;
  lastFailure?: string;
  successRate: number;
}> {
  try {
    const { data, error } = await supabase
      .from('webhook_delivery_logs')
      .select('success, created_at')
      .eq('webhook_url', webhookUrl)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const recentLogs = data || [];
    const successCount = recentLogs.filter((log) => log.success).length;
    const successRate = recentLogs.length > 0 ? (successCount / recentLogs.length) * 100 : 0;

    const lastSuccessLog = recentLogs.find((log) => log.success);
    const lastFailureLog = recentLogs.find((log) => !log.success);

    return {
      healthy: successRate >= 80,
      lastSuccess: lastSuccessLog?.created_at,
      lastFailure: lastFailureLog?.created_at,
      successRate,
    };
  } catch (error) {
    console.error('Get webhook health error:', error);
    return {
      healthy: false,
      successRate: 0,
    };
  }
}
