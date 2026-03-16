import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("advisor-forgot-password");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <onboarding@mpb.health>";
const ADVISOR_RESET_URL = "https://advisor.mpb.health/reset-password";

function buildResetEmail(email: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Reset Your MPB Health Password</title></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:30px 40px;border-radius:8px 8px 0 0;text-align:center;">
                    <h1 style="color:#ffffff;font-size:24px;margin:0;">Password Reset</h1>
                    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0 0;">MPB Health Advisor Portal</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#333;font-size:16px;margin:0 0 20px 0;">Hello,</p>
                    <p style="color:#333;font-size:16px;margin:0 0 20px 0;">
                      We received a request to reset the password for the MPB Health Advisor Portal account
                      associated with <strong>${email}</strong>. Click the button below to set a new password.
                    </p>
                    <div style="text-align:center;margin:30px 0;">
                      <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#0891b2);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:bold;font-size:16px;">
                        Reset My Password
                      </a>
                    </div>
                    <div style="background-color:#fef3c7;border:1px solid #fde68a;padding:12px 16px;border-radius:8px;margin:20px 0;">
                      <p style="margin:0;color:#92400e;font-size:14px;">
                        <strong>This link expires in 24 hours.</strong> If you did not request a password reset, you can safely ignore this email.
                      </p>
                    </div>
                    <p style="color:#666;font-size:14px;margin:20px 0 0 0;">Need help? Contact your MPB Health team.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;border-radius:0 0 8px 8px;">
                    <p style="color:#999;font-size:12px;margin:0;">This is an automated message from MPB Health. Please do not reply.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
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

    const resetLink = linkData.properties.action_link;
    const html = buildResetEmail(email, resetLink);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: "Reset Your MPB Health Advisor Portal Password",
        html,
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
