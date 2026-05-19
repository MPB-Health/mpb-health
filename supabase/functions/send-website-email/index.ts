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
  /** Cloudflare Turnstile token for bot verification */
  captchaToken?: string;
}

const DEFAULT_FROM = 'MPB Health <notifications@mpb.health>';
const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * `emailType` values that are allowed to target recipients outside of
 * `@mympb.com` / `@mpb.health`. These are transactional flows where the
 * recipient is, by design, an external user (newsletter subscriber, lead,
 * invitee, etc.). For every type on this list we additionally require a
 * single recipient so the function still cannot be abused as a fan-out
 * spam relay.
 */
const EXTERNAL_RECIPIENT_EMAIL_TYPES = new Set<string>([
  'newsletter-welcome',
  'lead-welcome',
  'user-invitation',
]);

const INTERNAL_RECIPIENT_DOMAINS = ['@mympb.com', '@mpb.health'];

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
    const { to, subject, html, text, replyTo, emailType, captchaToken } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Turnstile CAPTCHA verification for public form submissions ---
    const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (TURNSTILE_SECRET_KEY && captchaToken) {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: captchaToken,
          remoteip: clientIp,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        log.warn('Turnstile verification failed', { errors: verifyData['error-codes'] });
        return new Response(
          JSON.stringify({ success: false, error: 'CAPTCHA verification failed. Please try again.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    } else if (TURNSTILE_SECRET_KEY && !captchaToken && !emailType) {
      return new Response(
        JSON.stringify({ success: false, error: 'CAPTCHA token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validate each recipient address
    const recipients = Array.isArray(to) ? to : [to];
    const externalAllowed = !!emailType && EXTERNAL_RECIPIENT_EMAIL_TYPES.has(emailType);

    // Externally-addressed transactional emails must be 1:1 — the allowlist
    // exists so we can reach a known user, not so we can blast many addresses.
    if (externalAllowed && recipients.length !== 1) {
      return new Response(
        JSON.stringify({ success: false, error: 'External recipients are limited to a single address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    for (const addr of recipients) {
      if (!isValidEmail(addr)) {
        return new Response(
          JSON.stringify({ success: false, error: `Invalid email address: ${addr}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      if (externalAllowed) continue;

      // Default policy: restrict to internal staff domains to prevent use as a spam relay.
      const lower = addr.toLowerCase();
      const isInternal = INTERNAL_RECIPIENT_DOMAINS.some((domain) => lower.endsWith(domain));
      if (!isInternal) {
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
