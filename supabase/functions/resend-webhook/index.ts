// ============================================================================
// Resend Webhook Handler
// Processes email delivery events from Resend
// Deploy with: supabase functions deploy resend-webhook
//
// Configure webhook in Resend dashboard:
// URL: https://your-project.supabase.co/functions/v1/resend-webhook
// Events: email.sent, email.delivered, email.bounced, email.complained
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { verifySvixSignature } from '../_shared/svix.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('resend-webhook');

const RESEND_WEBHOOK_EXTRA_HEADERS =
  'Content-Type, Authorization, X-Client-Info, Apikey, authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature';

// ============================================================================
// Types
// ============================================================================

type WebhookEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface WebhookPayload {
  type: WebhookEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Bounce specific
    bounce?: {
      message: string;
      type: 'hard' | 'soft';
    };
    // Complaint specific
    complaint?: {
      type: string;
    };
    // Click specific (Resend's native tracking)
    click?: {
      link: string;
      timestamp: string;
      userAgent: string;
      ipAddress: string;
    };
    // Open specific (Resend's native tracking)
    open?: {
      timestamp: string;
      userAgent: string;
      ipAddress: string;
    };
  };
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req, { allowHeaders: RESEND_WEBHOOK_EXTRA_HEADERS });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Rate limit: webhook receiver (server-to-server)
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 200,
    windowSeconds: 60,
    keyPrefix: 'resend-webhook',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // Verify webhook signature — reject unverified requests
    if (!RESEND_WEBHOOK_SECRET) {
      log.error('RESEND_WEBHOOK_SECRET is not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook verification is not configured' }),
        { headers: { ...getCorsHeaders(req, { allowHeaders: RESEND_WEBHOOK_EXTRA_HEADERS }), 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      log.warn('Missing required Svix headers');
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature headers' }),
        { headers: { ...getCorsHeaders(req, { allowHeaders: RESEND_WEBHOOK_EXTRA_HEADERS }), 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Read raw body for signature verification (must happen before parsing JSON)
    const rawBody = await req.text();

    try {
      await verifySvixSignature(RESEND_WEBHOOK_SECRET, svixId, svixTimestamp, svixSignature, rawBody);
      log.info('Webhook signature verified successfully');
    } catch (verifyError) {
      log.error(`Signature verification failed: ${verifyError.message}`);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { headers: { ...getCorsHeaders(req, { allowHeaders: RESEND_WEBHOOK_EXTRA_HEADERS }), 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    log.info(`Received event: ${payload.type} for email ${payload.data.email_id}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find email by Resend ID
    const { data: email, error: findError } = await supabase
      .from('crm_email_log')
      .select('id, status, lead_id')
      .eq('resend_email_id', payload.data.email_id)
      .single();

    if (findError || !email) {
      log.info(`Email not found for Resend ID: ${payload.data.email_id}`);
      // Return 200 anyway to acknowledge receipt
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...getCorsHeaders(req, { allowHeaders: RESEND_WEBHOOK_EXTRA_HEADERS }), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Process event based on type
    switch (payload.type) {
      case 'email.sent':
        await handleEmailSent(supabase, email.id);
        break;

      case 'email.delivered':
        await handleEmailDelivered(supabase, email.id);
        break;

      case 'email.delivery_delayed':
        await handleDeliveryDelayed(supabase, email.id);
        break;

      case 'email.bounced':
        await handleEmailBounced(supabase, email.id, email.lead_id, payload.data.bounce);
        break;

      case 'email.complained':
        await handleEmailComplained(supabase, email.id, email.lead_id, payload.data.complaint);
        break;

      case 'email.opened':
        // Only use if not using our custom tracking
        if (payload.data.open) {
          await handleEmailOpened(supabase, email.id, payload.data.open);
        }
        break;

      case 'email.clicked':
        // Only use if not using our custom tracking
        if (payload.data.click) {
          await handleEmailClicked(supabase, email.id, payload.data.click);
        }
        break;

      default:
        log.info(`Unhandled event type: ${payload.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, event: payload.type }),
      {
        headers: { ...getCorsHeaders(req, { allowHeaders: RESEND_WEBHOOK_EXTRA_HEADERS }), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    log.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...getCorsHeaders(req, { allowHeaders: RESEND_WEBHOOK_EXTRA_HEADERS }), 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// Event Handlers
// ============================================================================

async function handleEmailSent(
  supabase: ReturnType<typeof createClient>,
  emailId: string
): Promise<void> {
  // Email was accepted by Resend and queued for delivery
  await supabase
    .from('crm_email_log')
    .update({
      status: 'sent',
      metadata: supabase.rpc('jsonb_set_key', {
        target: 'metadata',
        key: 'resend_status',
        value: '"sent"',
      }),
    })
    .eq('id', emailId);

  log.info(`Email ${emailId} marked as sent`);
}

async function handleEmailDelivered(
  supabase: ReturnType<typeof createClient>,
  emailId: string
): Promise<void> {
  // Email was successfully delivered to recipient's mail server
  await supabase
    .from('crm_email_log')
    .update({
      status: 'delivered',
      metadata: supabase.rpc('jsonb_set_key', {
        target: 'metadata',
        key: 'delivered_at',
        value: `"${new Date().toISOString()}"`,
      }),
    })
    .eq('id', emailId);

  log.info(`Email ${emailId} marked as delivered`);
}

async function handleDeliveryDelayed(
  supabase: ReturnType<typeof createClient>,
  emailId: string
): Promise<void> {
  // Delivery is delayed (temporary issue)
  const { data: email } = await supabase
    .from('crm_email_log')
    .select('metadata')
    .eq('id', emailId)
    .single();

  const metadata = email?.metadata || {};
  metadata.delivery_delayed = true;
  metadata.delay_count = (metadata.delay_count || 0) + 1;
  metadata.last_delay_at = new Date().toISOString();

  await supabase
    .from('crm_email_log')
    .update({ metadata })
    .eq('id', emailId);

  log.info(`Email ${emailId} delivery delayed`);
}

async function handleEmailBounced(
  supabase: ReturnType<typeof createClient>,
  emailId: string,
  leadId: string | null,
  bounce?: { message: string; type: 'hard' | 'soft' }
): Promise<void> {
  // Email bounced
  await supabase
    .from('crm_email_log')
    .update({
      status: 'bounced',
      metadata: {
        bounce_type: bounce?.type || 'unknown',
        bounce_message: bounce?.message || 'Unknown bounce reason',
        bounced_at: new Date().toISOString(),
      },
    })
    .eq('id', emailId);

  // Log activity for lead
  if (leadId) {
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      activity_type: 'note',
      title: `Email bounced (${bounce?.type || 'unknown'})`,
      description: bounce?.message || 'Email could not be delivered',
      metadata: {
        email_id: emailId,
        bounce_type: bounce?.type,
      },
    });

    // Optionally mark lead email as invalid for hard bounces
    if (bounce?.type === 'hard') {
      await supabase
        .from('lead_submissions')
        .update({
          tags: supabase.rpc('array_append_unique', {
            row_id: leadId,
            column_name: 'tags',
            value: 'email-bounced',
          }),
        })
        .eq('id', leadId);
    }
  }

  log.info(`Email ${emailId} bounced: ${bounce?.type}`);
}

async function handleEmailComplained(
  supabase: ReturnType<typeof createClient>,
  emailId: string,
  leadId: string | null,
  complaint?: { type: string }
): Promise<void> {
  // Recipient marked email as spam
  await supabase
    .from('crm_email_log')
    .update({
      status: 'failed',
      metadata: {
        complaint_type: complaint?.type || 'spam',
        complained_at: new Date().toISOString(),
      },
    })
    .eq('id', emailId);

  // Important: Track this lead as having complained
  if (leadId) {
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      activity_type: 'note',
      title: 'Email marked as spam',
      description: 'Recipient reported this email as spam. Consider removing from email list.',
      metadata: {
        email_id: emailId,
        complaint_type: complaint?.type,
      },
    });

    // Tag the lead
    await supabase
      .from('lead_submissions')
      .update({
        tags: supabase.rpc('array_append_unique', {
          row_id: leadId,
          column_name: 'tags',
          value: 'spam-complaint',
        }),
      })
      .eq('id', leadId);
  }

  log.info(`Email ${emailId} received spam complaint`);
}

async function handleEmailOpened(
  supabase: ReturnType<typeof createClient>,
  emailId: string,
  openData: { timestamp: string; userAgent: string; ipAddress: string }
): Promise<void> {
  // Use Resend's native open tracking (if not using custom pixel)
  const { data: email } = await supabase
    .from('crm_email_log')
    .select('open_count, first_opened_at')
    .eq('id', emailId)
    .single();

  if (!email) return;

  await supabase
    .from('crm_email_log')
    .update({
      status: 'opened',
      open_count: (email.open_count || 0) + 1,
      first_opened_at: email.first_opened_at || openData.timestamp,
      last_opened_at: openData.timestamp,
    })
    .eq('id', emailId);

  // Insert tracking record
  await supabase.from('crm_email_tracking').insert({
    email_log_id: emailId,
    tracking_type: 'open',
    ip_address: openData.ipAddress,
    user_agent: openData.userAgent,
    tracked_at: openData.timestamp,
  });

  log.info(`Email ${emailId} opened (via Resend tracking)`);
}

async function handleEmailClicked(
  supabase: ReturnType<typeof createClient>,
  emailId: string,
  clickData: { link: string; timestamp: string; userAgent: string; ipAddress: string }
): Promise<void> {
  // Use Resend's native click tracking (if not using custom tracking)
  const { data: email } = await supabase
    .from('crm_email_log')
    .select('click_count')
    .eq('id', emailId)
    .single();

  if (!email) return;

  await supabase
    .from('crm_email_log')
    .update({
      status: 'clicked',
      click_count: (email.click_count || 0) + 1,
    })
    .eq('id', emailId);

  // Insert tracking record
  await supabase.from('crm_email_tracking').insert({
    email_log_id: emailId,
    tracking_type: 'click',
    link_url: clickData.link,
    ip_address: clickData.ipAddress,
    user_agent: clickData.userAgent,
    tracked_at: clickData.timestamp,
  });

  log.info(`Email ${emailId} link clicked: ${clickData.link}`);
}
