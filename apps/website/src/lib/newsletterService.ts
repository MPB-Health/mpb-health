import { supabase } from './supabase';
import { sendNewsletterWelcomeEmail } from './emailService';
import { addSubscriberToMailchimp, unsubscribeFromMailchimp } from './mailchimpService';

export interface NewsletterSubscription {
  id?: string;
  email: string;
  status: 'pending' | 'active' | 'unsubscribed' | 'bounced';
  source: string;
  confirmed_at?: string;
  unsubscribed_at?: string;
  created_at?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface SubscribeResult {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
}

export async function subscribeToNewsletter(
  email: string,
  source: string = 'footer'
): Promise<SubscribeResult> {
  try {
    const ipAddress = await getUserIP();
    const userAgent = navigator.userAgent;

    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('email, status')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking subscription:', checkError);
      return {
        success: false,
        message: 'An error occurred. Please try again.'
      };
    }

    if (existing) {
      if (existing.status === 'active') {
        return {
          success: true,
          message: 'You are already subscribed to our newsletter!',
          alreadySubscribed: true
        };
      } else if (existing.status === 'unsubscribed') {
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'active',
            confirmed_at: new Date().toISOString(),
            unsubscribed_at: null,
            source,
            ip_address: ipAddress,
            user_agent: userAgent
          })
          .eq('email', email);

        if (updateError) {
          console.error('Error re-subscribing:', updateError);
          return {
            success: false,
            message: 'Failed to re-subscribe. Please try again.'
          };
        }

        const _emailResult = await sendNewsletterWelcomeEmail(email);

        const mailchimpResult = await addSubscriberToMailchimp({
          email,
          status: 'subscribed',
          tags: [source, 'resubscribed']
        });

        if (!mailchimpResult.success) {
          console.warn('Mailchimp sync failed:', mailchimpResult.error);
        }

        return {
          success: true,
          message: 'Welcome back! You have been re-subscribed to our newsletter.'
        };
      }
    }

    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email,
        status: 'active',
        source,
        confirmed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (insertError) {
      console.error('Error subscribing:', insertError);
      return {
        success: false,
        message: 'Failed to subscribe. Please try again.'
      };
    }

    const emailResult = await sendNewsletterWelcomeEmail(email);

    if (!emailResult.success) {
      console.warn('Welcome email failed to send:', emailResult.error);
    }

    const mailchimpResult = await addSubscriberToMailchimp({
      email,
      status: 'subscribed',
      tags: [source]
    });

    if (!mailchimpResult.success) {
      console.warn('Mailchimp sync failed:', mailchimpResult.error);
    }

    return {
      success: true,
      message: 'Successfully subscribed! Check your email for a welcome message.'
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
}

export async function unsubscribeFromNewsletter(email: string): Promise<SubscribeResult> {
  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', email);

    if (error) {
      console.error('Error unsubscribing:', error);
      return {
        success: false,
        message: 'Failed to unsubscribe. Please try again.'
      };
    }

    const mailchimpResult = await unsubscribeFromMailchimp(email);

    if (!mailchimpResult.success) {
      console.warn('Mailchimp unsubscribe failed:', mailchimpResult.error);
    }

    return {
      success: true,
      message: 'You have been successfully unsubscribed.'
    };
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
}

export async function getSubscriptionStatus(email: string): Promise<NewsletterSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, status, source, confirmed_at, unsubscribed_at, created_at, ip_address, user_agent, metadata')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data as any;
  } catch (error) {
    console.error('Newsletter status check error:', error);
    return null;
  }
}

export async function getAllSubscribers(): Promise<NewsletterSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, status, source, confirmed_at, unsubscribed_at, created_at, ip_address, user_agent, metadata')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }

    return (data || []) as any;
  } catch (error) {
    console.error('Newsletter fetch error:', error);
    return [];
  }
}

export async function getActiveSubscribersCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) {
      console.error('Error counting subscribers:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Newsletter count error:', error);
    return 0;
  }
}

async function getUserIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Could not fetch IP address:', error);
    return undefined;
  }
}
