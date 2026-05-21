import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { checkRateLimit, getClientIdentifier, isValidEmail, sanitizeInput } from '../_shared/security.ts';
import { wrapEmailLayout, emailCta } from "../_shared/emailLayout.ts";

interface RequestBody {
  recipientName: string;
  recipientEmail: string;
  advisorName: string;
  advisorUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    // SECURITY: Strict rate limiting to prevent email spam (5 per minute per IP)
    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 5,
      windowSeconds: 60,
      keyPrefix: 'share-advisor',
    });
    if (rateLimitResponse) return rateLimitResponse;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const body: RequestBody = await req.json();
    const { recipientName, recipientEmail, advisorName, advisorUrl } = body;

    if (!recipientName?.trim()) {
      return jsonResponse(req, 400, { success: false, error: 'Recipient name is required' });
    }
    if (!recipientEmail?.trim()) {
      return jsonResponse(req, 400, { success: false, error: 'Recipient email is required' });
    }
    // SECURITY: Validate email format
    if (!isValidEmail(recipientEmail.trim())) {
      return jsonResponse(req, 400, { success: false, error: 'Invalid recipient email format' });
    }
    if (!advisorUrl?.trim()) {
      return jsonResponse(req, 400, { success: false, error: 'Advisor URL is required' });
    }
    // SECURITY: Validate advisor URL against allowed domains
    try {
      const parsedUrl = new URL(advisorUrl);
      if (!['mpbhealth.com', 'www.mpbhealth.com', 'mpb.health', 'www.mpb.health', 'advisor.mpb.health'].some(d => parsedUrl.hostname === d)) {
        return jsonResponse(req, 400, { success: false, error: 'Invalid advisor URL' });
      }
    } catch {
      return jsonResponse(req, 400, { success: false, error: 'Invalid advisor URL format' });
    }

    const html = buildEmailHtml(recipientName, advisorName, advisorUrl);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MPB Health <notifications@mympb.com>',
        to: [recipientEmail],
        subject: `${advisorName} shared their MPB Health Advisor Page with you`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.json();
      console.error('Resend API error:', err);
      return jsonResponse(req, 500, {
        success: false,
        error: err.message || 'Failed to send email',
      });
    }

    const result = await resendResponse.json();
    return jsonResponse(req, 200, { success: true, resend_id: result.id });
  } catch (error) {
    console.error('Unhandled error:', error);
    // SECURITY: Don't leak internal error details
    return jsonResponse(req, 500, {
      success: false,
      error: 'Failed to process sharing request',
    });
  }
});

function jsonResponse(
  req: Request,
  status: number,
  body: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function buildEmailHtml(
  recipientName: string,
  advisorName: string,
  advisorUrl: string,
): string {
  const bodyHtml = `
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hi ${escapeHtml(recipientName)},
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
      <strong>${escapeHtml(advisorName)}</strong> has shared their Advisor Page with you. Click the button below to explore affordable health sharing options.
    </p>
    ${emailCta(escapeHtml(advisorUrl), "View Advisor Page", "#2563eb")}
    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:20px 0 0;text-align:center;word-break:break-all;">
      Or copy this link: <a href="${escapeHtml(advisorUrl)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(advisorUrl)}</a>
    </p>`;

  return wrapEmailLayout({
    appName: "Advisor Page",
    accentColor: "#2563eb",
    heading: "Health Sharing Options Shared With You",
    preheader: `${escapeHtml(advisorName)} shared their Advisor Page with you.`,
    portalUrl: "https://mpb.health",
  }, bodyHtml);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
