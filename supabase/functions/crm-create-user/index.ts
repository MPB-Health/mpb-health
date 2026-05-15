// ============================================================================
// crm-create-user
// ----------------------------------------------------------------------------
// Lets a CRM org *owner* or *admin* create a new user scoped to their own org.
//
// Unlike `create-user` (which is super_admin-only and can grant any role), this
// function is scoped: the caller can ONLY create users with the `crm_user`
// global role, and the new user is automatically added to the caller's active
// org as a member of that org. The caller cannot escalate privileges, cannot
// create users in other orgs, and cannot grant non-CRM roles.
//
// Roles granted to the new user:
//   - global  user_roles.role = 'crm_user'   (portal access to crm.mpb.health)
//   - org     org_memberships.role = caller-chosen org role, capped at the
//             caller's own org role (an "admin" caller cannot create an
//             "owner"; allowed values are 'admin' | 'manager' | 'agent').
//
// Auth: bearer JWT required. Caller must have an active org_membership in
// `org_id` with role IN ('owner', 'admin').
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("crm-create-user");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Org role the new user will hold inside the caller's org. UI uses "advisor"
 *  as the label/value but the org_memberships DB constraint stores it as
 *  "agent" — we map at the boundary in `toOrgMembershipRole`. */
type CrmCreateOrgRole = "admin" | "manager" | "advisor";

/** What the DB constraint actually allows in org_memberships.role */
type OrgMembershipRole = "owner" | "admin" | "manager" | "agent" | "member";

interface CrmCreateUserRequest {
  org_id: string;
  email: string;
  first_name: string;
  last_name: string;
  org_role: CrmCreateOrgRole;
  password?: string;
  send_invite: boolean;
}

function toOrgMembershipRole(r: CrmCreateOrgRole): OrgMembershipRole {
  return r === "advisor" ? "agent" : r;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CRM_LOGIN_URL =
  Deno.env.get("CRM_PORTAL_LOGIN_URL") ?? "https://crm.mpb.health/login";

/** Caller's required org role for this action. */
const ALLOWED_CALLER_ROLES: OrgMembershipRole[] = ["owner", "admin"];

/** Caller's role → max role they may grant a new member. Owners can grant any
 *  org role; admins can grant up to admin (not owner). */
const MAX_GRANTABLE_ROLE: Record<"owner" | "admin", OrgMembershipRole[]> = {
  owner: ["admin", "manager", "agent"],
  admin: ["admin", "manager", "agent"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pw = "";
  for (let i = 0; i < 14; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

async function sendInviteEmail(
  email: string,
  firstName: string,
  tempPassword: string,
  orgName: string,
): Promise<void> {
  if (!RESEND_API_KEY) {
    log.error("Resend API key not configured, cannot send invite email");
    throw new Error(
      "RESEND_API_KEY is not configured in Supabase. Add it in Project Settings → Edge Functions → Secrets.",
    );
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Welcome to MPB Health CRM</title></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <tr><td style="background:linear-gradient(to right,#2563eb,#06b6d4);padding:30px 40px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;font-size:24px;margin:0;">Welcome to MPB Health CRM</h1>
              </td></tr>
              <tr><td style="padding:40px;">
                <p style="color:#333;font-size:16px;margin:0 0 20px;">Hi ${firstName},</p>
                <p style="color:#333;font-size:16px;margin:0 0 20px;">You've been added to <strong>${orgName}</strong> on the MPB Health CRM. Here are your login credentials:</p>
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:20px;border-radius:8px;margin:20px 0;">
                  <p style="margin:0 0 10px;"><strong>Email:</strong> ${email}</p>
                  <p style="margin:0;"><strong>Temporary Password:</strong> <code style="background-color:#e2e8f0;padding:2px 8px;border-radius:4px;">${tempPassword}</code></p>
                </div>
                <p style="color:#666;font-size:14px;margin:20px 0;">Please change your password after your first login.</p>
                <div style="text-align:center;margin:30px 0;">
                  <a href="${CRM_LOGIN_URL}" style="display:inline-block;background:linear-gradient(to right,#2563eb,#06b6d4);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">Log in to CRM</a>
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
      from:
        Deno.env.get("RESEND_FROM_EMAIL") ||
        "MPB Health <notifications@mpb.health>",
      to: [email],
      subject: `Welcome to MPB Health CRM – ${orgName}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    log.error("Failed to send invite email", { status: res.status, body, email });
    throw new Error(`Resend API error: ${res.status} - ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

  // Same rate limit as create-user — admin-grade user creation surface.
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: "crm-create-user",
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ----- 1. Auth: caller must be a valid user --------------------------
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

    // ----- 2. Parse + validate body --------------------------------------
    const body: CrmCreateUserRequest = await req.json();
    const { org_id, email, first_name, last_name, org_role, password, send_invite } = body;

    if (!org_id || !email || !first_name || !last_name || !org_role) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "org_id, email, first_name, last_name, and org_role are required",
        }),
        { status: 400, headers },
      );
    }
    if (!(["admin", "manager", "advisor"] as const).includes(org_role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid org_role" }),
        { status: 400, headers },
      );
    }

    // ----- 3. Authorize: caller must be owner/admin in the target org ----
    const { data: callerMembership, error: membershipError } = await supabaseAdmin
      .from("org_memberships")
      .select("role")
      .eq("user_id", caller.id)
      .eq("org_id", org_id)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError) {
      log.error("Failed to load caller membership", membershipError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify permissions" }),
        { status: 500, headers },
      );
    }

    const callerOrgRole = callerMembership?.role as OrgMembershipRole | undefined;
    if (!callerOrgRole || !ALLOWED_CALLER_ROLES.includes(callerOrgRole)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Only org owners or admins can create CRM users for this org",
        }),
        { status: 403, headers },
      );
    }

    // ----- 4. Enforce grantable role cap --------------------------------
    const targetMembershipRole = toOrgMembershipRole(org_role);
    const grantable = MAX_GRANTABLE_ROLE[callerOrgRole as "owner" | "admin"];
    if (!grantable.includes(targetMembershipRole)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "You cannot grant a role higher than your own",
        }),
        { status: 403, headers },
      );
    }

    // ----- 5. Look up org name for the invite email ----------------------
    const { data: orgRow } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", org_id)
      .maybeSingle();
    const orgName = orgRow?.name ?? "your organization";

    // ----- 6. Reject duplicates: same email already in this org ----------
    //  (We *don't* reject if the auth user exists elsewhere — they might be
    //  joining a second org. We only reject if they're already a member here.)
    const { data: existingByEmail } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (existingByEmail) {
      const { data: dupeMembership } = await supabaseAdmin
        .from("org_memberships")
        .select("id")
        .eq("org_id", org_id)
        .eq("user_id", existingByEmail.id)
        .maybeSingle();
      if (dupeMembership) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "A user with this email is already a member of this organization",
          }),
          { status: 409, headers },
        );
      }
    }

    // ----- 7. Create auth user -------------------------------------------
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

    if (createUserError || !authUser?.user) {
      log.error("Auth user create failed", createUserError);
      return new Response(
        JSON.stringify({
          success: false,
          error: createUserError?.message?.includes("already")
            ? "A user with this email already exists. Use Invite to add them to the org."
            : "Failed to create user",
        }),
        { status: 400, headers },
      );
    }
    const newUserId = authUser.user.id;

    // ----- 8. Grant crm_user global role ---------------------------------
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: "crm_user",
        granted_by: caller.id,
      });
    if (roleError) {
      log.error("user_roles insert failed; rolling back auth user", roleError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch((e) =>
        log.error("Rollback delete failed", e)
      );
      return new Response(
        JSON.stringify({ success: false, error: "Failed to grant CRM role" }),
        { status: 500, headers },
      );
    }

    // ----- 9. Add to caller's org ----------------------------------------
    const { error: membershipInsertError } = await supabaseAdmin
      .from("org_memberships")
      .insert({
        org_id,
        user_id: newUserId,
        role: targetMembershipRole,
        status: "active",
        invited_by: caller.id,
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      });
    if (membershipInsertError) {
      log.error("org_memberships insert failed; rolling back", membershipInsertError);
      await supabaseAdmin.from("user_roles")
        .delete()
        .eq("user_id", newUserId)
        .eq("role", "crm_user");
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch((e) =>
        log.error("Rollback delete failed", e)
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to add user to organization",
        }),
        { status: 500, headers },
      );
    }

    // ----- 10. Send invite (best effort) ---------------------------------
    let emailSent = false;
    let emailError: string | undefined;
    if (send_invite) {
      try {
        await sendInviteEmail(email, first_name, tempPassword, orgName);
        emailSent = true;
      } catch (err) {
        log.error("Invite email failed (non-blocking)", err);
        emailError = err instanceof Error ? err.message : String(err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        org_role,
        message: send_invite
          ? emailSent
            ? "User created and invitation sent"
            : "User created, but invitation email failed to send"
          : "User created successfully",
        // Only surface the temp password when no email was sent — otherwise
        // it's in the recipient's inbox and shouldn't echo back to the caller.
        temp_password: send_invite ? undefined : tempPassword,
        email_sent: send_invite ? emailSent : undefined,
        email_error: emailError,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Unhandled error", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers },
    );
  }
});
