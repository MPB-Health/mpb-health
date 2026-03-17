import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("mass-password-reset");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <onboarding@mpb.health>";
const ADVISOR_RESET_URL = "https://advisor.mpb.health/reset-password";
const LOGO_URL = "https://mpb.health/assets/MPB-Health-No-background.png";

interface ResetRequest {
  advisor_ids?: string[]; // specific auth user IDs
  all_advisors?: boolean;  // reset all active advisors
}

function buildResetEmail(firstName: string, email: string, resetLink: string): { html: string; text: string } {
  const greeting = firstName || "Advisor";

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
                  Hi ${greeting},
                </p>
                <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
                  A password reset has been requested for your MPB Health Advisor Portal account
                  (<strong style="color:#111827;">${email}</strong>).
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

Hi ${greeting},

A password reset has been requested for your MPB Health Advisor Portal account (${email}).

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

  // Rate limit: admin endpoint — allow up to 5 bulk sends per minute
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 5,
    windowSeconds: 60,
    keyPrefix: "mass-password-reset",
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Email service (Resend) not configured" }),
        { status: 500, headers },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers },
      );
    }

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .single();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Only super admins can send mass password resets" }),
        { status: 403, headers },
      );
    }

    const body: ResetRequest = await req.json();
    const { advisor_ids, all_advisors } = body;

    if (!all_advisors && (!advisor_ids || advisor_ids.length === 0)) {
      return new Response(
        JSON.stringify({ success: false, error: "Provide advisor_ids or set all_advisors: true" }),
        { status: 400, headers },
      );
    }

    // Fetch advisor profiles to get name + email
    let query = supabaseAdmin
      .from("advisor_profiles")
      .select("id, first_name, last_name, email, user_id")
      .eq("status", "active")
      .not("email", "is", null);

    if (!all_advisors && advisor_ids) {
      // advisor_ids are auth user IDs (from user_roles), map via user_id column
      query = query.in("user_id", advisor_ids);
    }

    const { data: advisors, error: fetchError } = await query;

    if (fetchError || !advisors) {
      log.error("Failed to fetch advisors:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch advisor list" }),
        { status: 500, headers },
      );
    }

    if (advisors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, summary: { total: 0, sent: 0, errors: 0 } }),
        { status: 200, headers },
      );
    }

    log.info(`Sending password reset to ${advisors.length} advisors`);

    let sent = 0;
    let errors = 0;

    for (const advisor of advisors) {
      if (!advisor.email) {
        errors++;
        continue;
      }

      try {
        // Generate a recovery link via Admin API — no Supabase email rate limits
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: advisor.email,
          options: { redirectTo: ADVISOR_RESET_URL },
        });

        if (linkError || !linkData?.properties?.action_link) {
          log.error(`Failed to generate link for ${advisor.email}:`, linkError);
          errors++;
          continue;
        }

        // SCANNER-PROOF: Use token_hash instead of action_link.
        // Scanners fetch HTML but don't execute JS, so the token survives.
        const hashedToken = linkData.properties.hashed_token;
        const resetLink = hashedToken
          ? `${ADVISOR_RESET_URL}?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
          : linkData.properties.action_link;

        const { html, text } = buildResetEmail(advisor.first_name, advisor.email, resetLink);

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [advisor.email],
            subject: "Reset Your Password — MPB Health Advisor Portal",
            html,
            text,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          log.error(`Resend error for ${advisor.email}: ${res.status} ${errBody}`);
          errors++;
          continue;
        }

        sent++;

        // Throttle: stay well under Resend's 10/s limit on free tier
        if (sent % 8 === 0) {
          await new Promise((r) => setTimeout(r, 1100));
        }
      } catch (err) {
        log.error(`Error processing ${advisor.email}:`, err);
        errors++;
      }
    }

    log.info(`Mass password reset complete: ${sent} sent, ${errors} errors`);

    return new Response(
      JSON.stringify({ success: true, summary: { total: advisors.length, sent, errors } }),
      { status: 200, headers },
    );
  } catch (err) {
    log.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers },
    );
  }
});
