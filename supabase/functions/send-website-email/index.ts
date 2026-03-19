// Supabase Edge Function: send-website-email
// Handles all transactional emails originating from the public website (mpb.health).
// The Resend API key stays server-side — it is never exposed to the browser.
//
// Deploy: supabase functions deploy send-website-email
// Secret required: RESEND_API_KEY  (set via `supabase secrets set RESEND_API_KEY=...`)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier, isValidEmail } from '../_shared/security.ts';

const log = createLogger('send-website-email');

interface RequestBody {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Caller-supplied tag so we can trace email type in Resend logs */
  emailType?: string;
}

const DEFAULT_FROM = 'MPB Health <notifications@mpb.health>';
const RESEND_API_URL = 'https://api.resend.com/emails';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      log.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Rate limiting: 5 emails per minute per IP (public endpoint) ---
    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 5,
      windowSeconds: 60,
      keyPrefix: 'send-website-email',
    }, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    const body: RequestBody = await req.json();
    const { to, subject, html, text, replyTo, emailType } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validate each recipient address
    const recipients = Array.isArray(to) ? to : [to];
    for (const addr of recipients) {
      if (!isValidEmail(addr)) {
        return new Response(
          JSON.stringify({ success: false, error: `Invalid email address: ${addr}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Restrict to internal staff domains only — prevents use as a spam relay
      const lower = addr.toLowerCase();
      if (!lower.endsWith('@mympb.com') && !lower.endsWith('@mpb.health')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Recipient not allowed' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Send via Resend
    const payload: Record<string, unknown> = {
      from: DEFAULT_FROM,
      to: recipients,
      subject,
      html,
    };
    if (text) payload.text = text;
    if (replyTo) payload.reply_to = replyTo;
    if (emailType) payload.tags = [{ name: 'emailType', value: emailType }];

    const resendRes = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resendRes.ok) {
      const errData = await resendRes.json().catch(() => ({}));
      log.error('Resend API error', { status: resendRes.status, error: errData });
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email', details: errData }),
        { status: resendRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const result = await resendRes.json();
    log.info('Email sent', { id: result.id, emailType: emailType || 'generic', to: recipients });

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    log.error('Unexpected error', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
