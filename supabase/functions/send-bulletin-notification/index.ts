// Supabase Edge Function for sending bulletin notifications via Resend
// Deploy with: supabase functions deploy send-bulletin-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
import { wrapEmailLayout, emailCta } from "../_shared/emailLayout.ts";
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

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  // Rate limit: authenticated CRUD endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'send-bulletin-notification',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Verify caller is an admin — this endpoint can send bulk emails
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers });
    }

    const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), { status: 401, headers });
    }

    const { data: callerRoles } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .in('role', ['super_admin', 'admin']);

    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Only admins can send bulletin notifications' }), { status: 403, headers });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
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

    const accent = "#0d9488";
    const excerptText = bulletin_excerpt
      ? bulletin_excerpt.replace(/<[^>]*>/g, '').substring(0, 300) + (bulletin_excerpt.length > 300 ? '...' : '')
      : '';

    const bodyHtml = `
      <h2 style="color:#1f2937;margin:0 0 16px;font-size:20px;font-weight:600;line-height:1.3;">${bulletin_title}</h2>
      ${excerptText ? `<p style="color:#4b5563;margin:0 0 8px;font-size:15px;line-height:1.6;">${excerptText}</p>` : ''}
      ${emailCta(bulletinUrl, "Read Full Bulletin", accent)}
      <p style="color:#9ca3af;margin:24px 0 0;font-size:14px;line-height:1.5;text-align:center;">
        This bulletin is available exclusively to MPB Health advisors.<br/>
        <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;font-size:12px;">Manage notification preferences</a>
      </p>`;

    const htmlContent = wrapEmailLayout({
      appName: "Advisor Portal",
      accentColor: accent,
      heading: "New Advisor Bulletin",
      preheader: `New bulletin: ${bulletin_title}`,
      portalUrl: `${APP_URL}/advisor`,
      supportEmail: "advisors@mpb.health",
    }, bodyHtml);

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
