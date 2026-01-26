import { supabase } from './supabase';

export interface BulletinNotification {
  id: string;
  bulletin_id: string;
  sent_at: string;
  sent_by: string | null;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  status: 'pending' | 'sending' | 'completed' | 'failed';
  error_message: string | null;
  resend_batch_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BulletinRecipient {
  id: string;
  notification_id: string;
  advisor_id: string | null;
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  resend_message_id: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AdvisorEmail {
  advisor_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface SendNotificationResult {
  success: boolean;
  notification_id?: string;
  message: string;
  recipients_count?: number;
  error?: string;
}

export const bulletinNotificationService = {
  /**
   * Get active advisor emails for notification
   */
  async getActiveAdvisorEmails(): Promise<AdvisorEmail[]> {
    const { data, error } = await supabase.rpc('get_active_advisor_emails');

    if (error) {
      console.error('Error getting advisor emails:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Check if a bulletin has already been notified
   */
  async hasBeenNotified(bulletinId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('bulletin_email_notifications')
      .select('id')
      .eq('bulletin_id', bulletinId)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking notification status:', error);
      throw error;
    }

    return !!data;
  },

  /**
   * Get notification history for a bulletin
   */
  async getNotificationHistory(bulletinId: string): Promise<BulletinNotification[]> {
    const { data, error } = await supabase
      .from('bulletin_email_notifications')
      .select('*')
      .eq('bulletin_id', bulletinId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting notification history:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get the latest notification for a bulletin
   */
  async getLatestNotification(bulletinId: string): Promise<BulletinNotification | null> {
    const { data, error } = await supabase
      .from('bulletin_email_notifications')
      .select('*')
      .eq('bulletin_id', bulletinId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting latest notification:', error);
      throw error;
    }

    return data;
  },

  /**
   * Start a bulletin notification campaign
   */
  async startNotification(bulletinId: string): Promise<string> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc('start_bulletin_notification', {
      p_bulletin_id: bulletinId,
      p_sent_by: user?.user?.id || null
    });

    if (error) {
      console.error('Error starting notification:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    notificationId: string,
    status: string,
    successful?: number,
    failed?: number,
    errorMessage?: string,
    resendBatchId?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('update_bulletin_notification_status', {
      p_notification_id: notificationId,
      p_status: status,
      p_successful: successful ?? null,
      p_failed: failed ?? null,
      p_error_message: errorMessage ?? null,
      p_resend_batch_id: resendBatchId ?? null
    });

    if (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  },

  /**
   * Send bulletin notification emails via Edge Function
   */
  async sendBulletinNotification(
    bulletinId: string,
    bulletinTitle: string,
    bulletinExcerpt: string,
    bulletinSlug: string
  ): Promise<SendNotificationResult> {
    try {
      // Start the notification campaign
      const notificationId = await this.startNotification(bulletinId);

      // Update status to sending
      await this.updateNotificationStatus(notificationId, 'sending');

      // Get recipient count
      const recipients = await this.getActiveAdvisorEmails();

      // Call the Edge Function to send emails
      const { data, error } = await supabase.functions.invoke('send-bulletin-notification', {
        body: {
          notification_id: notificationId,
          bulletin_id: bulletinId,
          bulletin_title: bulletinTitle,
          bulletin_excerpt: bulletinExcerpt,
          bulletin_slug: bulletinSlug,
          recipients: recipients
        }
      });

      if (error) {
        await this.updateNotificationStatus(
          notificationId,
          'failed',
          0,
          recipients.length,
          error.message
        );
        throw error;
      }

      // Update with results from Edge Function
      if (data?.success) {
        await this.updateNotificationStatus(
          notificationId,
          'completed',
          data.successful_sends || recipients.length,
          data.failed_sends || 0,
          null,
          data.batch_id
        );

        return {
          success: true,
          notification_id: notificationId,
          message: `Successfully sent notification to ${data.successful_sends || recipients.length} advisors`,
          recipients_count: data.successful_sends || recipients.length
        };
      } else {
        await this.updateNotificationStatus(
          notificationId,
          'failed',
          data?.successful_sends || 0,
          data?.failed_sends || recipients.length,
          data?.error || 'Unknown error'
        );

        return {
          success: false,
          notification_id: notificationId,
          message: data?.error || 'Failed to send notifications',
          error: data?.error
        };
      }
    } catch (error) {
      console.error('Error sending bulletin notification:', error);
      return {
        success: false,
        message: 'Failed to send bulletin notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get all notifications with bulletin details
   */
  async getAllNotifications(): Promise<(BulletinNotification & { bulletin_title?: string })[]> {
    const { data, error } = await supabase
      .from('bulletin_email_notifications')
      .select(`
        *,
        advisor_content!bulletin_id (
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error getting all notifications:', error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      bulletin_title: item.advisor_content?.title
    }));
  },

  /**
   * Get notification recipients
   */
  async getNotificationRecipients(notificationId: string): Promise<BulletinRecipient[]> {
    const { data, error } = await supabase
      .from('bulletin_email_recipients')
      .select('*')
      .eq('notification_id', notificationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting notification recipients:', error);
      throw error;
    }

    return data || [];
  }
};
