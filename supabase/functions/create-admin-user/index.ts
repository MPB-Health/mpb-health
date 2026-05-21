import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { syncUserToItsts } from '../_shared/itsts-sync.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
import { wrapEmailLayout, emailCta, emailInfoCard, emailInfoRow, emailCallout } from "../_shared/emailLayout.ts";
const log = createLogger('create-admin-user');

interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: "super_admin" | "admin" | "manager" | "staff" | "concierge";
  permissions: string[];
  send_invite: boolean;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CONCIERGE_LOGIN_URL =
  Deno.env.get("CONCIERGE_PORTAL_LOGIN_URL") ?? "https://concierge.mpb.health/login";
const ADMIN_LOGIN_URL = Deno.env.get("ADMIN_PORTAL_LOGIN_URL") ?? "https://admin.mpb.health/login";

async function sendInviteEmail(
  email: string,
  firstName: string,
  tempPassword: string,
  portal: "admin" | "concierge",
): Promise<void> {
  if (!RESEND_API_KEY) {
    log.error('Resend API key not configured, cannot send invite email');
    throw new Error("RESEND_API_KEY is not configured in Supabase. Add it in Project Settings → Edge Functions → Secrets.");
  }

  const loginUrl = portal === "concierge" ? CONCIERGE_LOGIN_URL : ADMIN_LOGIN_URL;
  const portalTitle = portal === "concierge" ? "Concierge Portal" : "Admin Portal";

  const body = `
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${firstName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
      You've been invited to the <strong>${portalTitle}</strong>. Use the credentials below to log in.
    </p>
    ${emailInfoCard(
      emailInfoRow("Email", email) +
      emailInfoRow("Temporary Password", `<code style="background-color:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:14px;">${tempPassword}</code>`),
      "#2563eb",
    )}
    ${emailCallout("Please change your password after your first login.", "warning")}
    ${emailCta(loginUrl, `Log in to ${portalTitle}`, "#2563eb")}`;

  const html = wrapEmailLayout({
    appName: portalTitle,
    accentColor: "#2563eb",
    heading: "Your Account Is Ready",
    preheader: `Your ${portalTitle} account has been created. Log in with your temporary credentials.`,
    portalUrl: loginUrl,
  }, body);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <notifications@mpb.health>",
      to: [email],
      subject: `Your ${portalTitle} Account Is Ready`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    log.error("Failed to send invite email", { status: res.status, body, email });
    throw new Error(`Resend API error: ${res.status} - ${body}`);
  }
}

function generateTempPassword(length = 20): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => charset[v % charset.length]).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  // Rate limit: admin user creation endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'create-admin-user',
  }, corsHeaders);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is a super_admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Caller must have super_admin in user_roles (avoid .single() when user has multiple rows)
    const { data: superRows, error: superErr } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .limit(1);

    if (superErr || !superRows?.length) {
      return new Response(
        JSON.stringify({ success: false, error: "Only super admins can create users" }),
        { status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, first_name, last_name, role, permissions, send_invite } = body;

    if (!email || !first_name || !last_name || !role) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create auth user
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${first_name} ${last_name}`,
        first_name,
        last_name,
      },
    });

    if (createUserError) {
      log.error('Create user error:', createUserError);
      const message =
        createUserError.message ||
        (typeof (createUserError as { msg?: string }).msg === "string"
          ? (createUserError as { msg: string }).msg
          : "Failed to create user");
      return new Response(
        JSON.stringify({
          success: false,
          error: message,
          code: (createUserError as { code?: string }).code,
        }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const userId = authUser.user.id;
    const DEFAULT_ORG_ID = "00000000-0000-4000-a000-000000000001";

    if (role === "concierge") {
      // Concierge Portal access: user_roles.concierge only (admin_users forbids concierge)
      const { error: conciergeRoleErr } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "concierge",
        granted_by: caller.id,
      });

      if (conciergeRoleErr) {
        log.error("Concierge role insert error:", conciergeRoleErr);
        const msg =
          conciergeRoleErr.message ||
          "Could not assign concierge role (duplicate role or constraint).";
        return new Response(
          JSON.stringify({ success: false, error: msg, code: conciergeRoleErr.code }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const { error: orgError } = await supabaseAdmin.from("org_memberships").upsert(
        {
          user_id: userId,
          org_id: DEFAULT_ORG_ID,
          role: "member",
          status: "active",
          joined_at: new Date().toISOString(),
        },
        { onConflict: "user_id,org_id" },
      );

      if (orgError) {
        log.error("Org membership insert error:", orgError);
      }

      let emailSent = false;
      let emailError: string | undefined;
      if (send_invite) {
        try {
          await sendInviteEmail(email, first_name, tempPassword, "concierge");
          emailSent = true;
        } catch (emailErr) {
          log.error("Email send error:", emailErr);
          emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
        }
      }

      syncUserToItsts({
        email,
        first_name,
        last_name,
        roles: ["concierge"],
        action: "create",
        password: tempPassword,
      }).catch((e) => log.warn("ITSTS sync failed (non-blocking)", e));

      return new Response(
        JSON.stringify({
          success: true,
          user_id: userId,
          message: send_invite
            ? (emailSent ? "Concierge user created and invitation email sent" : "User created but invitation email failed")
            : "Concierge user created successfully",
          email_sent: send_invite ? emailSent : undefined,
          email_error: emailError,
        }),
        { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Admin Portal users (admin_users + mapped user_roles)
    const { error: adminUserError } = await supabaseAdmin.from("admin_users").insert({
      id: userId,
      email,
      first_name,
      last_name,
      role,
      status: "active",
      permissions: permissions || [],
    });

    if (adminUserError) {
      log.error("Admin user insert error:", adminUserError);
    }

    const ROLE_TO_USER_ROLE: Record<string, string | null> = {
      super_admin: "super_admin",
      admin: "admin",
      manager: "admin",
      staff: null,
    };
    const portalRole = ROLE_TO_USER_ROLE[role] ?? null;

    if (portalRole) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          role: portalRole,
          granted_by: caller.id,
        });

      if (roleError) {
        log.error('User role insert error:', roleError);
      }
    }

    // Provision org_memberships so org-scoped queries work
    const orgRole = (role === "super_admin" || role === "admin") ? "admin" : "member";
    const { error: orgError } = await supabaseAdmin
      .from("org_memberships")
      .upsert({
        user_id: userId,
        org_id: DEFAULT_ORG_ID,
        role: orgRole,
        status: "active",
        joined_at: new Date().toISOString(),
      }, { onConflict: "user_id,org_id" });

    if (orgError) {
      log.error('Org membership insert error:', orgError);
    }

    let emailSent = false;
    let emailError: string | undefined;
    if (send_invite) {
      try {
        await sendInviteEmail(email, first_name, tempPassword, "admin");
        emailSent = true;
      } catch (emailErr) {
        log.error('Email send error:', emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
      }
    }

    // Fire-and-forget sync to ITSTS
    syncUserToItsts({
      email,
      first_name,
      last_name,
      roles: [role as "super_admin" | "admin" | "manager" | "staff"],
      action: "create",
      password: tempPassword,
    }).catch((e) => log.warn("ITSTS sync failed (non-blocking)", e));

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: send_invite
          ? (emailSent ? "User created and invitation email sent" : "User created but invitation email failed")
          : "User created successfully",
        email_sent: send_invite ? emailSent : undefined,
        email_error: emailError,
      }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    log.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
