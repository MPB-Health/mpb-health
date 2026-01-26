/**
 * Mailchimp Service - Proxy through Supabase Edge Function
 * 
 * This service calls a Supabase Edge Function to interact with Mailchimp,
 * keeping API keys secure on the server side and avoiding CORS issues.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface MailchimpSubscriber {
  email: string;
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
  firstName?: string;
  lastName?: string;
  tags?: string[];
  mergeFields?: Record<string, string>;
}

export interface MailchimpResponse {
  success: boolean;
  id?: string;
  error?: string;
  statusCode?: number;
}

function getEdgeFunctionUrl(action: string, params?: Record<string, string>): string {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured');
  }
  const url = new URL(`${SUPABASE_URL}/functions/v1/mailchimp`);
  url.searchParams.set('action', action);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

export async function addSubscriberToMailchimp(
  subscriber: MailchimpSubscriber
): Promise<MailchimpResponse> {
  if (!SUPABASE_URL) {
    console.warn('Supabase not configured, skipping Mailchimp sync');
    return {
      success: false,
      error: 'Supabase not configured'
    };
  }

  try {
    const response = await fetch(getEdgeFunctionUrl('subscribe'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: subscriber.email,
        status: subscriber.status,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        tags: subscriber.tags,
        mergeFields: subscriber.mergeFields,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Mailchimp API error:', data);
      return {
        success: false,
        error: data.error || 'Failed to add subscriber',
        statusCode: response.status
      };
    }

    return {
      success: true,
      id: data.id
    };
  } catch (error) {
    console.error('Mailchimp subscription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function unsubscribeFromMailchimp(email: string): Promise<MailchimpResponse> {
  if (!SUPABASE_URL) {
    console.warn('Supabase not configured, skipping Mailchimp sync');
    return {
      success: false,
      error: 'Supabase not configured'
    };
  }

  try {
    const response = await fetch(getEdgeFunctionUrl('unsubscribe'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mailchimp API error:', data);
      return {
        success: false,
        error: data.error || 'Failed to unsubscribe',
        statusCode: response.status
      };
    }

    return {
      success: true,
      id: data.id
    };
  } catch (error) {
    console.error('Mailchimp unsubscribe error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function updateSubscriberTags(
  email: string,
  tags: string[],
  action: 'add' | 'remove' = 'add'
): Promise<MailchimpResponse> {
  if (!SUPABASE_URL) {
    console.warn('Supabase not configured, skipping tag update');
    return {
      success: false,
      error: 'Supabase not configured'
    };
  }

  try {
    const response = await fetch(getEdgeFunctionUrl('update-tags'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, tags, action }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mailchimp tag update error:', data);
      return {
        success: false,
        error: data.error || 'Failed to update tags',
        statusCode: response.status
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Mailchimp tag update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getSubscriberInfo(email: string): Promise<any> {
  if (!SUPABASE_URL) {
    return null;
  }

  try {
    const response = await fetch(getEdgeFunctionUrl('get-info', { email }), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.subscriber || null;
  } catch (error) {
    console.error('Error fetching subscriber info:', error);
    return null;
  }
}

export async function bulkSyncToMailchimp(
  subscribers: MailchimpSubscriber[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  if (!SUPABASE_URL) {
    return {
      success: 0,
      failed: subscribers.length,
      errors: ['Supabase not configured']
    };
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Process subscribers sequentially to avoid rate limiting
  for (const subscriber of subscribers) {
    const result = await addSubscriberToMailchimp(subscriber);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      if (result.error) {
        results.errors.push(`${subscriber.email}: ${result.error}`);
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

export const mailchimpService = {
  addSubscriber: addSubscriberToMailchimp,
  unsubscribe: unsubscribeFromMailchimp,
  updateTags: updateSubscriberTags,
  getSubscriberInfo,
  bulkSync: bulkSyncToMailchimp
};
