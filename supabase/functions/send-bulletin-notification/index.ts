// Supabase Edge Function for sending bulletin notifications via Resend
// Deploy with: supabase functions deploy send-bulletin-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('send-bulletin-notification');

interface Recipient {
  advisor_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface RequestBody {
  notification_id: string;
  bulletin_id: string;
  bulletin_title: string;
  bulletin_excerpt: string;
  bulletin_slug: string;
  recipients: Recipient[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: authenticated CRUD endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'send-bulletin-notification',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const APP_URL = Deno.env.get('APP_URL') || 'https://mpbhealth.com';
    const FROM_EMAIL = Deno.env.get('BULLETIN_FROM_EMAIL') || 'advisors@mpb.health';
    const FROM_NAME = Deno.env.get('BULLETIN_FROM_NAME') || 'MPB Health Advisor Portal';

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const body: RequestBody = await req.json();
    const {
      notification_id,
      bulletin_id,
      bulletin_title,
      bulletin_excerpt,
      bulletin_slug,
      recipients
    } = body;

    if (!notification_id || !bulletin_id || !bulletin_title || !recipients?.length) {
      throw new Error('Missing required fields: notification_id, bulletin_id, bulletin_title, recipients');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate email HTML
    const bulletinUrl = `${APP_URL}/advisor/content/${bulletin_slug}`;
    const unsubscribeUrl = `${APP_URL}/advisor/settings?tab=notifications`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bulletin_title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                New Advisor Bulletin
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px;">
                MPB Health Advisor Portal
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 22px; font-weight: 600; line-height: 1.3;">
                ${bulletin_title}
              </h2>

              ${bulletin_excerpt ? `
              <p style="color: #4b5563; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                ${bulletin_excerpt.replace(/<[^>]*>/g, '').substring(0, 300)}${bulletin_excerpt.length > 300 ? '...' : ''}
              </p>
              ` : ''}

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); border-radius: 8px;">
                    <a href="${bulletinUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Read Full Bulletin
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; margin: 24px 0 0; font-size: 14px; line-height: 1.5;">
                This bulletin is available exclusively to MPB Health advisors.
                <a href="${bulletinUrl}" style="color: #3b82f6; text-decoration: none;">View in your Advisor Portal</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 8px; font-size: 12px; text-align: center;">
                You're receiving this email because you're a registered advisor with MPB Health.
              </p>
              <p style="color: #9ca3af; margin: 0; font-size: 12px; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Manage notification preferences</a>
                &nbsp;&bull;&nbsp;
                <a href="${APP_URL}/advisor" style="color: #6b7280; text-decoration: underline;">Advisor Portal</a>
              </p>
              <p style="color: #9ca3af; margin: 16px 0 0; font-size: 11px; text-align: center;">
                &copy; ${new Date().getFullYear()} MPB Health. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textContent = `
New Advisor Bulletin: ${bulletin_title}

${bulletin_excerpt ? bulletin_excerpt.replace(/<[^>]*>/g, '').substring(0, 500) : ''}

Read the full bulletin: ${bulletinUrl}

---
This bulletin is available exclusively to MPB Health advisors.
Manage notification preferences: ${unsubscribeUrl}

© ${new Date().getFullYear()} MPB Health. All rights reserved.
`;

    // Send emails via Resend batch API
    let successfulSends = 0;
    let failedSends = 0;
    const errors: string[] = [];

    // Resend allows batch sending up to 100 emails at a time
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const emailBatch = batch.map(recipient => ({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: recipient.email,
        subject: `New Bulletin: ${bulletin_title}`,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'type', value: 'bulletin' },
          { name: 'bulletin_id', value: bulletin_id },
          { name: 'notification_id', value: notification_id }
        ]
      }));

      try {
        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailBatch)
        });

        if (response.ok) {
          const result = await response.json();
          successfulSends += result.data?.length || batch.length;

          // Update recipient statuses
          for (const recipient of batch) {
            await supabase
              .from('bulletin_email_recipients')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('notification_id', notification_id)
              .eq('email', recipient.email);
          }
        } else {
          const errorData = await response.json();
          failedSends += batch.length;
          errors.push(errorData.message || 'Unknown error from Resend');

          // Update recipient statuses
          for (const recipient of batch) {
            await supabase
              .from('bulletin_email_recipients')
              .update({
                status: 'failed',
                error_message: errorData.message || 'Send failed'
              })
              .eq('notification_id', notification_id)
              .eq('email', recipient.email);
          }
        }
      } catch (batchError) {
        failedSends += batch.length;
        errors.push(batchError.message);
      }
    }

    const responseData = {
      success: failedSends === 0,
      notification_id,
      successful_sends: successfulSends,
      failed_sends: failedSends,
      total_recipients: recipients.length,
      errors: errors.length > 0 ? errors : undefined
    };

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: failedSends === recipients.length ? 500 : 200
      }
    );

  } catch (error) {
    log.error('Error sending bulletin notification:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
