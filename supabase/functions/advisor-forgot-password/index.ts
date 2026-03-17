import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("advisor-forgot-password");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <onboarding@mpb.health>";
const ADVISOR_RESET_URL = "https://advisor.mpb.health/reset-password";
const LOGO_URL = "https://mpb.health/assets/MPB-Health-No-background.png";

function buildResetEmail(email: string, resetLink: string): { html: string; text: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password — MPB Health Advisor Portal</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f5f7;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f5f7;padding:48px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
            <!-- Logo Header -->
            <tr>
              <td style="padding:32px 40px 16px 40px;text-align:center;">
                <img src="${LOGO_URL}" alt="MPB Health" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
              </td>
            </tr>
            <!-- Divider -->
            <tr>
              <td style="padding:0 40px;">
                <div style="height:1px;background-color:#e5e7eb;"></div>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:32px 40px;">
                <h1 style="color:#111827;font-size:22px;font-weight:600;margin:0 0 16px 0;text-align:center;">Reset Your Password</h1>
                <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
                  We received a request to reset the password for the Advisor Portal account
                  associated with <strong style="color:#111827;">${email}</strong>.
                </p>
                <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
                  Click the button below to choose a new password. This link is valid for 24 hours and can only be used once.
                </p>
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center">
                      <a href="${resetLink}" target="_blank" style="display:inline-block;background-color:#0d9488;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.01em;mso-padding-alt:0;text-align:center;">
                        <!--[if mso]><i style="mso-font-width:150%;mso-text-raise:30px;" hidden>&nbsp;</i><![endif]-->
                        Reset My Password
                        <!--[if mso]><i style="mso-font-width:150%;" hidden>&nbsp;</i><![endif]-->
                      </a>
                    </td>
                  </tr>
                </table>
                <!-- Fallback link -->
                <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:20px 0 0 0;text-align:center;word-break:break-all;">
                  If the button doesn't work, copy and paste this link into your browser:<br/>
                  <a href="${resetLink}" style="color:#0d9488;text-decoration:underline;">${resetLink}</a>
                </p>
              </td>
            </tr>
            <!-- Security note -->
            <tr>
              <td style="padding:0 40px 32px 40px;">
                <div style="background-color:#fefce8;border:1px solid #fef08a;padding:14px 16px;border-radius:8px;">
                  <p style="margin:0;color:#854d0e;font-size:13px;line-height:1.5;">
                    If you did not request this password reset, no action is needed — your account remains secure.
                  </p>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;background-color:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;border-radius:0 0 12px 12px;">
                <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0;">
                  MPB Health, Inc. &middot; Advisor Portal<br/>
                  This is an automated message. Please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Reset Your Password — MPB Health Advisor Portal

We received a request to reset the password for the Advisor Portal account associated with ${email}.

Reset your password using the link below. This link is valid for 24 hours and can only be used once.

${resetLink}

If you did not request this password reset, no action is needed — your account remains secure.

— MPB Health, Inc.`;

  return { html, text };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  // Rate limit: 5 reset attempts per IP per 15 minutes
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 5,
    windowSeconds: 900,
    keyPrefix: "advisor-forgot-password",
  }, req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email required" }),
        { status: 400, headers },
      );
    }

    // Always return success — never reveal whether email exists in the system
    if (!RESEND_API_KEY) {
      log.error("RESEND_API_KEY not configured — cannot send reset email");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a recovery link via Admin API — bypasses Supabase email rate limits
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: ADVISOR_RESET_URL },
    });

    if (linkError || !linkData?.properties?.action_link) {
      // User may not exist — don't reveal this, just return success silently
      log.warn(`Could not generate reset link for ${email}: ${linkError?.message}`);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // SCANNER-PROOF: Use token_hash instead of action_link.
    // action_link is a Supabase server-side endpoint that email scanners will click,
    // consuming the single-use token before the human gets to it.
    // Instead, we send the user directly to the advisor portal with the token_hash
    // in query params. Scanners fetch HTML but don't execute JavaScript, so the
    // token is never exchanged until a real browser calls verifyOtp().
    const hashedToken = linkData.properties.hashed_token;
    const resetLink = hashedToken
      ? `${ADVISOR_RESET_URL}?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
      : linkData.properties.action_link; // fallback if hashed_token unavailable

    const { html, text } = buildResetEmail(email, resetLink);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: "Reset Your Password — MPB Health Advisor Portal",
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      log.error(`Resend error for ${email}: ${res.status} ${errBody}`);
    } else {
      log.info(`Password reset email sent to ${email}`);
    }

    // Always return success to not leak whether email exists
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    log.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers },
    );
  }
});
