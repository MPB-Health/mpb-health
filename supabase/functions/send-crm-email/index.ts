// Supabase Edge Function for sending CRM emails via Resend
// Deploy with: supabase functions deploy send-crm-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier, requireAuth, isValidEmail, logAuditEvent } from '../_shared/security.ts';
const log = createLogger('send-crm-email');

interface RequestBody {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template_id?: string;
  lead_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const FROM_EMAIL = Deno.env.get('CRM_FROM_EMAIL') || 'crm@mpb.health';
    const FROM_NAME = Deno.env.get('CRM_FROM_NAME') || 'MPB Health CRM';

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // SECURITY: Rate limit email sending (10 per minute per IP)
    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowSeconds: 60,
      keyPrefix: 'send-crm-email',
    });
    if (rateLimitResponse) return rateLimitResponse;

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // SECURITY: Require authentication - no unauthenticated email sending
    const { user, errorResponse } = await requireAuth(req, supabaseAuth);
    if (errorResponse) {
      return new Response(errorResponse.body, {
        status: errorResponse.status,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }
    const sentBy = user.userId || null;

    const body: RequestBody = await req.json();
    const { to, subject, html, text, template_id, lead_id } = body;

    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, html');
    }

    // SECURITY: Validate email format
    if (!isValidEmail(to)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        html,
        text: text || undefined,
        tags: [
          { name: 'type', value: 'crm_email' },
          ...(template_id ? [{ name: 'template_id', value: template_id }] : []),
          ...(lead_id ? [{ name: 'lead_id', value: lead_id }] : []),
        ],
      }),
    });

    let resendEmailId: string | null = null;
    let status = 'sent';

    if (response.ok) {
      const result = await response.json();
      resendEmailId = result.id || null;
    } else {
      const errorData = await response.json();
      status = 'failed';
      log.error('Resend error:', errorData);
    }

    // Log to crm_email_log
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('crm_email_log').insert({
      lead_id: lead_id || null,
      template_id: template_id || null,
      to_email: to,
      subject,
      body_preview: html.replace(/<[^>]*>/g, '').substring(0, 200),
      status,
      resend_email_id: resendEmailId,
      sent_by: sentBy,
    });

    if (status === 'failed') {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email via Resend' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, email_id: resendEmailId }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    log.error('Error sending CRM email:', error);
    // SECURITY: Don't leak internal error details to client
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process email request' }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
