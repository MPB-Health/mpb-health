import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";
import { wrapEmailLayout, emailCta, emailInfoCard, emailInfoRow, emailCallout } from "../_shared/emailLayout.ts";

const log = createLogger("send-advisor-invites");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <onboarding@mpb.health>";

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
  const loginUrl = "https://advisor.mpb.health/login";
  const accent = "#0d9488";

  const bodyHtml = `
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${firstName || "Advisor"},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Your Advisor Portal account is ready! Here you'll find training materials, SOPs, bulletins, enrollment forms, and everything you need to serve your clients.
    </p>
    ${emailInfoCard(
      emailInfoRow("Email", email) +
      emailInfoRow("Temporary Password", `<code style="background-color:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:14px;">${password}</code>`) +
      (agentId ? emailInfoRow("Agent ID", agentId) : ""),
      accent,
    )}
    ${emailCallout("<strong>Important:</strong> You will be asked to create a new password when you log in for the first time.", "warning")}
    ${emailCta(loginUrl, "Log In to Advisor Portal", accent)}
    <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:20px 0 0;">If you have any questions, reach out to your MPB Health team contact.</p>`;

  return wrapEmailLayout({
    appName: "Advisor Portal",
    accentColor: accent,
    heading: "Your Account Is Ready",
    preheader: "Your Advisor Portal account has been created. Log in with your temporary credentials.",
    portalUrl: loginUrl,
  }, bodyHtml);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  // Rate limit: admin CRUD endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'send-advisor-invites',
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
        JSON.stringify({ success: false, error: "Failed to fetch advisors" }),
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
            from: RESEND_FROM,
            to: [advisor.email],
            subject: "Your MPB Health Advisor Portal Account is Ready",
            html,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          let reason = `HTTP ${res.status}`;
          try {
            const parsed = JSON.parse(errBody);
            reason = parsed.message || reason;
          } catch { /* use default */ }
          log.error(`Resend error for ${advisor.email}: ${res.status} ${errBody}`);
          results.push({ email: advisor.email, first_name: advisor.first_name, status: "error", reason });
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
        log.error(`Failed to send invite to ${advisor.email}:`, err);
        results.push({ email: advisor.email, first_name: advisor.first_name, status: "error", reason: "Failed to send invite" });
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
        error: "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
