// ============================================================================
// Email Tracking Edge Function
// Handles open tracking (pixel) and click tracking (link redirects)
// Deploy with: supabase functions deploy email-tracking
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('email-tracking');

// 1x1 transparent GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
]);

// ============================================================================
// Types
// ============================================================================

interface TrackingData {
  tracking_id: string;
  tracking_type: 'open' | 'click';
  link_url?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  referer?: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // SECURITY: Rate limit tracking requests (200 per minute per IP)
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 200,
    windowSeconds: 60,
    keyPrefix: 'email-tracking',
  });
  if (rateLimitResponse) return rateLimitResponse;

  // Expected paths:
  // /email-tracking/open/{tracking_id}
  // /email-tracking/click/{tracking_id}?url={encoded_url}

  // Find the action and tracking_id in the path
  let action: string | null = null;
  let trackingId: string | null = null;

  for (let i = 0; i < pathParts.length; i++) {
    if (pathParts[i] === 'open' || pathParts[i] === 'click') {
      action = pathParts[i];
      trackingId = pathParts[i + 1] || null;
      break;
    }
  }

  if (!action || !trackingId) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract tracking data from request
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      req.headers.get('cf-connecting-ip') ||
                      'unknown';
    const referer = req.headers.get('referer') || '';

    const deviceType = detectDeviceType(userAgent);

    if (action === 'open') {
      // Track email open
      await trackOpen(supabase, {
        tracking_id: trackingId,
        tracking_type: 'open',
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        referer,
      });

      // Return tracking pixel
      return new Response(TRACKING_PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    if (action === 'click') {
      // Get redirect URL
      const redirectUrl = url.searchParams.get('url');
      if (!redirectUrl) {
        return new Response('Missing URL parameter', { status: 400 });
      }

      const decodedUrl = decodeURIComponent(redirectUrl);

      // SECURITY: Prevent open redirect attacks - only allow HTTPS URLs to trusted domains
      const ALLOWED_REDIRECT_DOMAINS = [
        'mpbhealth.com', 'www.mpbhealth.com', 'app.mpbhealth.com',
        'mpb.health', 'www.mpb.health', 'app.mpb.health',
        'crm.mpb.health', 'admin.mpb.health', 'advisor.mpb.health',
        'support.mpb.health',
      ];
      try {
        const parsedUrl = new URL(decodedUrl);
        if (parsedUrl.protocol !== 'https:' || !ALLOWED_REDIRECT_DOMAINS.some(d => parsedUrl.hostname === d || parsedUrl.hostname.endsWith('.' + d))) {
          log.warn('Blocked open redirect attempt', { url: decodedUrl, tracking_id: trackingId });
          return new Response('Redirect URL not allowed', { status: 403 });
        }
      } catch {
        return new Response('Invalid redirect URL', { status: 400 });
      }

      // Track click
      await trackClick(supabase, {
        tracking_id: trackingId,
        tracking_type: 'click',
        link_url: decodedUrl,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        referer,
      });

      // Redirect to original URL
      return new Response(null, {
        status: 302,
        headers: {
          'Location': decodedUrl,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  } catch (error) {
    log.error('Error:', error);

    // For open tracking, still return the pixel even if logging fails
    if (action === 'open') {
      return new Response(TRACKING_PIXEL, {
        headers: { 'Content-Type': 'image/gif' },
      });
    }

    // For click tracking, redirect only to validated URLs
    const redirectUrl = url.searchParams.get('url');
    if (redirectUrl) {
      const decoded = decodeURIComponent(redirectUrl);
      try {
        const parsedUrl = new URL(decoded);
        const ALLOWED_REDIRECT_DOMAINS = [
          'mpbhealth.com', 'www.mpbhealth.com', 'app.mpbhealth.com',
          'mpb.health', 'www.mpb.health', 'app.mpb.health',
          'crm.mpb.health', 'admin.mpb.health', 'advisor.mpb.health',
          'support.mpb.health',
        ];
        if (parsedUrl.protocol === 'https:' && ALLOWED_REDIRECT_DOMAINS.some(d => parsedUrl.hostname === d || parsedUrl.hostname.endsWith('.' + d))) {
          return new Response(null, {
            status: 302,
            headers: { 'Location': decoded },
          });
        }
      } catch {
        // Invalid URL - fall through to error
      }
    }

    return new Response('Error', { status: 500 });
  }
});

// ============================================================================
// Tracking Functions
// ============================================================================

async function trackOpen(
  supabase: ReturnType<typeof createClient>,
  data: TrackingData
): Promise<void> {
  const now = new Date().toISOString();

  // Find the email by tracking_id
  const { data: email } = await supabase
    .from('crm_email_log')
    .select('id, open_count, first_opened_at, ab_test_id, ab_variant')
    .eq('tracking_id', data.tracking_id)
    .single();

  if (!email) {
    log.info(`Email not found for tracking_id: ${data.tracking_id}`);
    return;
  }

  const isFirstOpen = !email.first_opened_at;

  // Insert tracking record
  await supabase.from('crm_email_tracking').insert({
    email_log_id: email.id,
    tracking_type: 'open',
    ip_address: data.ip_address,
    user_agent: data.user_agent,
    device_type: data.device_type,
    tracked_at: now,
  });

  // Update email log
  await supabase
    .from('crm_email_log')
    .update({
      open_count: (email.open_count || 0) + 1,
      first_opened_at: email.first_opened_at || now,
      last_opened_at: now,
      status: 'opened',
    })
    .eq('id', email.id);

  // Sales Plan 2026 A/B harness: only count *first* open per recipient so
  // refresh loops don't pad the success rate.
  if (isFirstOpen && email.ab_test_id && email.ab_variant) {
    const col = email.ab_variant === 'a' ? 'variant_a_success' : 'variant_b_success';
    const { data: test } = await supabase
      .from('crm_email_ab_tests')
      .select(`id, metric, ${col}`)
      .eq('id', email.ab_test_id)
      .single();
    if (test && test.metric === 'open') {
      const next = ((test as Record<string, number>)[col] ?? 0) + 1;
      await supabase
        .from('crm_email_ab_tests')
        .update({ [col]: next })
        .eq('id', email.ab_test_id);
    }
  }

  // Update thread if exists
  const { data: emailWithThread } = await supabase
    .from('crm_email_log')
    .select('thread_id')
    .eq('id', email.id)
    .single();

  if (emailWithThread?.thread_id) {
    await supabase
      .from('crm_email_threads')
      .update({ has_unread: false })
      .eq('id', emailWithThread.thread_id);
  }

  log.info(`Tracked open for email ${email.id}`);
}

async function trackClick(
  supabase: ReturnType<typeof createClient>,
  data: TrackingData
): Promise<void> {
  const now = new Date().toISOString();

  // Find the email by tracking_id
  const { data: email } = await supabase
    .from('crm_email_log')
    .select('id, click_count, ab_test_id, ab_variant')
    .eq('tracking_id', data.tracking_id)
    .single();

  if (!email) {
    log.info(`Email not found for tracking_id: ${data.tracking_id}`);
    return;
  }

  const isFirstClick = (email.click_count || 0) === 0;

  // Insert tracking record
  await supabase.from('crm_email_tracking').insert({
    email_log_id: email.id,
    tracking_type: 'click',
    link_url: data.link_url,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
    device_type: data.device_type,
    tracked_at: now,
  });

  // Update email log
  await supabase
    .from('crm_email_log')
    .update({
      click_count: (email.click_count || 0) + 1,
      status: 'clicked',
    })
    .eq('id', email.id);

  // Sales Plan 2026 A/B harness — only count the *first* click on a given
  // email so multi-click recipients don't skew the winner math.
  if (isFirstClick && email.ab_test_id && email.ab_variant) {
    const col = email.ab_variant === 'a' ? 'variant_a_success' : 'variant_b_success';
    const { data: test } = await supabase
      .from('crm_email_ab_tests')
      .select(`id, metric, ${col}`)
      .eq('id', email.ab_test_id)
      .single();
    if (test && test.metric === 'click') {
      const next = ((test as Record<string, number>)[col] ?? 0) + 1;
      await supabase
        .from('crm_email_ab_tests')
        .update({ [col]: next })
        .eq('id', email.ab_test_id);
    }
  }

  log.info(`Tracked click for email ${email.id}: ${data.link_url}`);
}

// ============================================================================
// Helper Functions
// ============================================================================

function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase();

  // Check for tablets first (they often include mobile keywords)
  if (
    ua.includes('ipad') ||
    ua.includes('tablet') ||
    (ua.includes('android') && !ua.includes('mobile'))
  ) {
    return 'tablet';
  }

  // Check for mobile
  if (
    ua.includes('mobile') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('android') ||
    ua.includes('blackberry') ||
    ua.includes('windows phone')
  ) {
    return 'mobile';
  }

  return 'desktop';
}
