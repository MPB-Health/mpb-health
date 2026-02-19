import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

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
    if (!advisorUrl?.trim()) {
      return jsonResponse(req, 400, { success: false, error: 'Advisor URL is required' });
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
    return jsonResponse(req, 500, {
      success: false,
      error: error.message || 'Unknown error',
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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MPB Health Advisor Page</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px 40px; text-align: center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">MPB Health</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Affordable Health Sharing</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                Hi ${escapeHtml(recipientName)},
              </p>
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                <strong>${escapeHtml(advisorName)}</strong> has shared their MPB Health Advisor Page with you. Click the button below to explore affordable health sharing options.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
                <tr>
                  <td style="border-radius:8px;background-color:#2563eb;">
                    <a href="${escapeHtml(advisorUrl)}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">
                      View Advisor Page
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#6b7280;font-size:14px;line-height:1.6;text-align:center;">
                Or copy this link: <a href="${escapeHtml(advisorUrl)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(advisorUrl)}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
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
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
