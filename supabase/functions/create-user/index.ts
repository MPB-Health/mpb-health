import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { syncUserToItsts } from "../_shared/itsts-sync.ts";

const log = createLogger("create-user");

type UserRole = "super_admin" | "admin" | "advisor" | "member" | "crm_user";

interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  roles: UserRole[];
  password?: string;
  send_invite: boolean;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendInviteEmail(
  email: string,
  firstName: string,
  tempPassword: string,
  roles: UserRole[],
): Promise<void> {
  if (!RESEND_API_KEY) {
    log.info("Resend API key not configured, skipping invite email");
    return;
  }

  const portalUrl = roles.includes("advisor")
    ? "https://advisor.mpbhealth.com"
    : roles.includes("admin") || roles.includes("super_admin")
      ? "https://admin.mpb.health"
      : roles.includes("crm_user")
        ? "https://crm.mpbhealth.com"
        : "https://app.mpbhealth.com";

  const roleLabels = roles
    .map((r) => r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(", ");

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Welcome to MPB Health</title></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <tr><td style="background:linear-gradient(to right,#2563eb,#06b6d4);padding:30px 40px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;font-size:24px;margin:0;">Welcome to MPB Health!</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="color:#333;font-size:16px;margin:0 0 20px;">Hi ${firstName},</p>
                <p style="color:#333;font-size:16px;margin:0 0 20px;">Your account has been created. Here are your login credentials:</p>
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:20px;border-radius:8px;margin:20px 0;">
                  <p style="margin:0 0 10px;"><strong>Email:</strong> ${email}</p>
                  <p style="margin:0 0 10px;"><strong>Temporary Password:</strong> <code style="background-color:#e2e8f0;padding:2px 8px;border-radius:4px;">${tempPassword}</code></p>
                  <p style="margin:0;"><strong>Role${roles.length > 1 ? "s" : ""}:</strong> ${roleLabels}</p>
                </div>
                <p style="color:#666;font-size:14px;margin:20px 0;">Please change your password after your first login.</p>
                <div style="text-align:center;margin:30px 0;">
                  <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(to right,#2563eb,#06b6d4);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">Login Now</a>
                </div>
              </td></tr>
              <tr><td style="padding:20px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;border-radius:0 0 8px 8px;">
                <p style="color:#999;font-size:12px;margin:0;">This is an automated message from MPB Health.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MPB Health <notifications@mympb.com>",
      to: [email],
      subject: "Welcome to MPB Health – Your Account Is Ready",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    log.warn("Failed to send invite email", { status: res.status, body });
  }
}

function generateTempPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pw = "";
  for (let i = 0; i < 14; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers },
      );
    }

    const token = authHeader.replace("Bearer ", "");
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

    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .single();

    if (!callerRoles) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Only super admins can create users",
        }),
        { status: 403, headers },
      );
    }

    const body: CreateUserRequest = await req.json();
    const { email, first_name, last_name, roles, password, send_invite } = body;

    if (!email || !first_name || !last_name || !roles?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email, first name, last name, and at least one role are required",
        }),
        { status: 400, headers },
      );
    }

    const tempPassword = password || generateTempPassword();

    const { data: authUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
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
      log.error("Create user error:", createUserError);
      return new Response(
        JSON.stringify({ success: false, error: createUserError.message }),
        { status: 400, headers },
      );
    }

    const userId = authUser.user.id;

    const roleInserts = roles.map((role) => ({
      user_id: userId,
      role,
      granted_by: caller.id,
    }));

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert(roleInserts);

    if (roleError) {
      log.error("User roles insert error:", roleError);
    }

    if (send_invite) {
      try {
        await sendInviteEmail(email, first_name, tempPassword, roles);
      } catch (emailError) {
        log.error("Email send error:", emailError);
      }
    }

    // Fire-and-forget sync to ITSTS
    syncUserToItsts({
      email,
      first_name,
      last_name,
      roles,
      action: "create",
      password: tempPassword,
    }).catch((e) => log.warn("ITSTS sync failed (non-blocking)", e));

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        temp_password: send_invite ? undefined : tempPassword,
        message: send_invite
          ? "User created and invitation email sent"
          : "User created successfully",
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
