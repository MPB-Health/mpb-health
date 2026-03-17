import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { syncUserToItsts } from '../_shared/itsts-sync.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('create-admin-user');

interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: "super_admin" | "admin" | "manager" | "staff";
  permissions: string[];
  send_invite: boolean;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendInviteEmail(email: string, firstName: string, tempPassword: string): Promise<void> {
  if (!RESEND_API_KEY) {
    log.error('Resend API key not configured, cannot send invite email');
    throw new Error("RESEND_API_KEY is not configured in Supabase. Add it in Project Settings → Edge Functions → Secrets.");
  }

  const loginUrl = "https://admin.mpb.health/login";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to MPB Health Admin</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(to right, #2563eb, #06b6d4); padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Welcome to MPB Health Admin!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Hi ${firstName},</p>
                    <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">You've been invited to join the MPB Health Admin Portal. Here are your login credentials:</p>

                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
                      <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 8px; border-radius: 4px;">${tempPassword}</code></p>
                    </div>

                    <p style="color: #666; font-size: 14px; margin: 20px 0;">Please change your password after your first login.</p>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Login to Admin Portal</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message from MPB Health.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <notifications@mpb.health>",
      to: [email],
      subject: "Welcome to MPB Health Admin Portal",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    log.error("Failed to send invite email", { status: res.status, body, email });
    throw new Error(`Resend API error: ${res.status} - ${body}`);
  }
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: admin user creation endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'create-admin-user',
  });
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

    // Check if caller is super_admin
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .single();

    if (!callerRoles) {
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
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create user" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const userId = authUser.user.id;

    // Create admin_users entry
    const { error: adminUserError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        id: userId,
        email,
        first_name,
        last_name,
        role,
        status: "active",
        permissions: permissions || [],
      });

    if (adminUserError) {
      log.error('Admin user insert error:', adminUserError);
      // Continue anyway, user is created
    }

    // Create user_roles entry
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role,
        granted_by: caller.id,
      });

    if (roleError) {
      log.error('User role insert error:', roleError);
      // Continue anyway, user is created
    }

    let emailSent = false;
    let emailError: string | undefined;
    if (send_invite) {
      try {
        await sendInviteEmail(email, first_name, tempPassword);
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
      roles: [role as "super_admin" | "admin"],
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
