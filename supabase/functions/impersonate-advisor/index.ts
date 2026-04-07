import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier, logAuditEvent } from "../_shared/security.ts";

const log = createLogger("impersonate-advisor");

const ADVISOR_PORTAL_URL =
  Deno.env.get("PORTAL_ADVISORS_URL") ?? "https://advisor.mpb.health";

interface ImpersonateRequest {
  advisor_id: string;
  mode: "magiclink" | "temp_password";
}

function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  const pick = (chars: string) =>
    chars[Math.floor(Math.random() * chars.length)];

  const parts = [pick(upper), pick(lower), pick(digits), pick(special)];
  for (let i = 4; i < 16; i++) parts.push(pick(all));

  // Fisher-Yates shuffle
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return parts.join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers },
    );
  }

  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: "impersonate-advisor",
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller identity
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers },
      );
    }

    // Verify caller has super_admin or admin role
    const { data: callerRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    if (rolesError) {
      log.error("Failed to check caller roles", rolesError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify permissions" }),
        { status: 500, headers },
      );
    }

    const roleSet = new Set((callerRoles ?? []).map((r: { role: string }) => r.role));
    if (!roleSet.has("super_admin") && !roleSet.has("admin")) {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient permissions" }),
        { status: 403, headers },
      );
    }

    // Parse body
    let body: ImpersonateRequest;
    try {
      body = (await req.json()) as ImpersonateRequest;
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body" }),
        { status: 400, headers },
      );
    }

    const { advisor_id, mode } = body;

    if (!advisor_id || typeof advisor_id !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "advisor_id is required" }),
        { status: 400, headers },
      );
    }

    if (mode !== "magiclink" && mode !== "temp_password") {
      return new Response(
        JSON.stringify({ success: false, error: "mode must be 'magiclink' or 'temp_password'" }),
        { status: 400, headers },
      );
    }

    // Prevent self-impersonation
    if (advisor_id === caller.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot impersonate yourself" }),
        { status: 400, headers },
      );
    }

    // Validate target is an advisor
    const { data: advisorProfile, error: profileError } = await supabaseAdmin
      .from("advisor_profiles")
      .select("id, email, first_name, last_name, status")
      .eq("id", advisor_id)
      .maybeSingle();

    if (profileError) {
      log.error("Failed to look up advisor profile", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to look up advisor" }),
        { status: 500, headers },
      );
    }

    if (!advisorProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "Advisor not found" }),
        { status: 404, headers },
      );
    }

    // Also verify the target has an auth user
    const { data: targetAuth, error: targetAuthError } =
      await supabaseAdmin.auth.admin.getUserById(advisor_id);

    if (targetAuthError || !targetAuth?.user) {
      log.error("Target auth user not found", targetAuthError);
      return new Response(
        JSON.stringify({ success: false, error: "Advisor auth account not found" }),
        { status: 404, headers },
      );
    }

    const advisorEmail = targetAuth.user.email ?? advisorProfile.email;

    log.info("Impersonation requested", {
      admin: caller.email,
      adminId: caller.id,
      target: advisorEmail,
      targetId: advisor_id,
      mode,
    });

    // Write audit log
    await supabaseAdmin.from("impersonation_log").insert({
      admin_id: caller.id,
      target_user_id: advisor_id,
      mode,
      ip_address: clientIp,
    });

    logAuditEvent(supabaseAdmin, {
      action: "impersonate_advisor",
      resource_type: "user",
      resource_id: advisor_id,
      user_id: caller.id,
      ip_address: clientIp,
      user_agent: req.headers.get("User-Agent") ?? undefined,
      metadata: {
        mode,
        target_email: advisorEmail,
        target_name: `${advisorProfile.first_name} ${advisorProfile.last_name}`,
      },
      severity: "critical",
    });

    // ── Mode: Magic Link ──────────────────────────────────────────────────────

    if (mode === "magiclink") {
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: advisorEmail!,
          options: { redirectTo: ADVISOR_PORTAL_URL },
        });

      if (linkError) {
        log.error("Failed to generate magic link", linkError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to generate login link" }),
          { status: 500, headers },
        );
      }

      const verificationUrl = linkData.properties?.action_link;
      if (!verificationUrl) {
        return new Response(
          JSON.stringify({ success: false, error: "No action link generated" }),
          { status: 500, headers },
        );
      }

      log.info("Impersonation magic link generated", {
        admin: caller.email,
        target: advisorEmail,
      });

      return new Response(
        JSON.stringify({
          success: true,
          url: verificationUrl,
          advisor_name: `${advisorProfile.first_name} ${advisorProfile.last_name}`,
          advisor_email: advisorEmail,
        }),
        { status: 200, headers },
      );
    }

    // ── Mode: Temp Password ───────────────────────────────────────────────────

    const tempPassword = generateSecurePassword();

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(advisor_id, {
        password: tempPassword,
      });

    if (updateError) {
      log.error("Failed to set temp password", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to set temporary password" }),
        { status: 500, headers },
      );
    }

    log.info("Impersonation temp password set", {
      admin: caller.email,
      target: advisorEmail,
    });

    return new Response(
      JSON.stringify({
        success: true,
        temp_password: tempPassword,
        advisor_email: advisorEmail,
        advisor_name: `${advisorProfile.first_name} ${advisorProfile.last_name}`,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Impersonate advisor failed", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers },
    );
  }
});
