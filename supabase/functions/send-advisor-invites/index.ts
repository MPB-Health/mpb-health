import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("send-advisor-invites");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface InviteRequest {
  advisor_ids?: string[];
  send_all_pending?: boolean;
  password: string;
}

interface InviteResult {
  email: string;
  first_name: string;
  status: "sent" | "skipped" | "error";
  reason?: string;
}

function buildInviteEmail(
  firstName: string,
  email: string,
  password: string,
  agentId: string | null,
): string {
  const loginUrl = "https://advisor-portal-chi.vercel.app/login";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to the MPB Health Advisor Portal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Welcome to the Advisor Portal!</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">MPB Health - Your Advisor Hub</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Hi ${firstName || "Advisor"},</p>
                    <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Your MPB Health Advisor Portal account is ready! Here you'll find training materials, SOPs, bulletins, enrollment forms, and everything you need to serve your clients.</p>

                    <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; font-weight: bold; color: #0d9488;">Your Login Credentials</p>
                      <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${email}</p>
                      <p style="margin: 0 0 8px 0;"><strong>Temporary Password:</strong> <code style="background-color: #ccfbf1; padding: 2px 8px; border-radius: 4px; font-size: 15px;">${password}</code></p>
                      ${agentId ? `<p style="margin: 0;"><strong>Agent ID:</strong> ${agentId}</p>` : ""}
                    </div>

                    <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>Important:</strong> You will be asked to create a new password when you log in for the first time.
                      </p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0891b2); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">Log In to Advisor Portal</a>
                    </div>

                    <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">If you have any questions, reach out to your MPB Health team contact.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message from MPB Health. Please do not reply.</p>
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

    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .single();

    if (!callerRoles) {
      return new Response(
        JSON.stringify({ success: false, error: "Only super admins can send invites" }),
        { status: 403, headers },
      );
    }

    const body: InviteRequest = await req.json();
    const { advisor_ids, send_all_pending, password } = body;

    if (!password) {
      return new Response(
        JSON.stringify({ success: false, error: "Password is required" }),
        { status: 400, headers },
      );
    }

    // Fetch advisors to invite
    let query = supabaseAdmin
      .from("advisor_profiles")
      .select("id, first_name, last_name, email, agent_id, must_change_password")
      .eq("status", "active");

    if (send_all_pending) {
      query = query.eq("must_change_password", true);
    } else if (advisor_ids && advisor_ids.length > 0) {
      query = query.in("id", advisor_ids);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Provide advisor_ids or set send_all_pending" }),
        { status: 400, headers },
      );
    }

    const { data: advisors, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers },
      );
    }

    if (!advisors || advisors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, summary: { total: 0, sent: 0, skipped: 0, errors: 0 }, results: [] }),
        { status: 200, headers },
      );
    }

    const results: InviteResult[] = [];
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    // Resend batch API supports up to 100 emails per call
    // Send one by one for individual error tracking
    for (const advisor of advisors) {
      if (!advisor.email) {
        results.push({ email: "", first_name: advisor.first_name, status: "skipped", reason: "No email" });
        skipped++;
        continue;
      }

      try {
        const html = buildInviteEmail(
          advisor.first_name,
          advisor.email,
          password,
          advisor.agent_id,
        );

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MPB Health <notifications@mympb.com>",
            to: [advisor.email],
            subject: "Your MPB Health Advisor Portal Account is Ready",
            html,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          log.error(`Resend error for ${advisor.email}: ${res.status} ${errBody}`);
          results.push({ email: advisor.email, first_name: advisor.first_name, status: "error", reason: `HTTP ${res.status}` });
          errors++;
          continue;
        }

        results.push({ email: advisor.email, first_name: advisor.first_name, status: "sent" });
        sent++;

        // Small delay to respect rate limits (Resend: 10/s on free, 100/s on pro)
        if (sent % 8 === 0) {
          await new Promise((r) => setTimeout(r, 1100));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        log.error(`Failed to send invite to ${advisor.email}:`, err);
        results.push({ email: advisor.email, first_name: advisor.first_name, status: "error", reason: message });
        errors++;
      }
    }

    log.info(`Invites sent: ${sent} sent, ${skipped} skipped, ${errors} errors out of ${advisors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: { total: advisors.length, sent, skipped, errors },
        results,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
