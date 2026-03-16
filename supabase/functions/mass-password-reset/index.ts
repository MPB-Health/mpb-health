import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("mass-password-reset");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <onboarding@mpb.health>";
const ADVISOR_RESET_URL = "https://advisor.mpb.health/reset-password";

interface ResetRequest {
  advisor_ids?: string[]; // specific auth user IDs
  all_advisors?: boolean;  // reset all active advisors
}

function buildResetEmail(firstName: string, email: string, resetLink: string): string {
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
                    <p style="color:#333;font-size:16px;margin:0 0 20px 0;">Hi ${firstName || "Advisor"},</p>
                    <p style="color:#333;font-size:16px;margin:0 0 20px 0;">
                      A password reset has been requested for your MPB Health Advisor Portal account
                      (<strong>${email}</strong>). Click the button below to set a new password.
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

        const resetLink = linkData.properties.action_link;
        const html = buildResetEmail(advisor.first_name, advisor.email, resetLink);

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [advisor.email],
            subject: "Reset Your MPB Health Advisor Portal Password",
            html,
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
