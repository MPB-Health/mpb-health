import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { syncUserToItsts } from "../_shared/itsts-sync.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";
import { wrapEmailLayout, emailCta, emailInfoCard, emailInfoRow, emailCallout } from "../_shared/emailLayout.ts";

const log = createLogger("create-user");

type UserRole = "super_admin" | "admin" | "advisor" | "member" | "crm_user";

interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  roles: UserRole[];
  password?: string;
  send_invite: boolean;
  phone?: string;
  specialization?: string;
  agent_id?: string;
  company_name?: string;
  avatar_url?: string;
}

const ADVISOR_PROFILE_ROLES: UserRole[] = ["advisor", "admin", "super_admin"];

function shouldProvisionAdvisorProfile(roles: UserRole[]): boolean {
  return roles.some((role) => ADVISOR_PROFILE_ROLES.includes(role));
}

async function provisionAdvisorProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  input: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    specialization?: string;
    agentId?: string;
    companyName?: string;
    avatarUrl?: string;
  },
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("advisor_profiles")
    .upsert(
      {
        id: input.userId,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone || null,
        specialization: input.specialization || "Health Share",
        agent_id: input.agentId || null,
        company_name: input.companyName || null,
        avatar_url: input.avatarUrl || null,
        status: "active",
        training_completed: false,
        training_completed_at: null,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        metadata: {
          provisioned_by: "create-user",
          source: "edge-function",
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    throw error;
  }
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface PortalInfo {
  appName: string;
  portalUrl: string;
  accent: string;
}

function resolvePortal(roles: UserRole[]): PortalInfo {
  if (roles.includes("advisor"))
    return { appName: "Advisor Portal", portalUrl: "https://advisor.mpb.health", accent: "#0d9488" };
  if (roles.includes("admin") || roles.includes("super_admin"))
    return { appName: "Admin Portal", portalUrl: "https://admin.mpb.health", accent: "#2563eb" };
  if (roles.includes("crm_user"))
    return { appName: "CRM", portalUrl: "https://crm.mpb.health", accent: "#4f46e5" };
  return { appName: "Member Portal", portalUrl: "https://app.mpb.health", accent: "#2563eb" };
}

async function sendInviteEmail(
  email: string,
  firstName: string,
  tempPassword: string,
  roles: UserRole[],
): Promise<void> {
  if (!RESEND_API_KEY) {
    log.error("Resend API key not configured, cannot send invite email");
    throw new Error("RESEND_API_KEY is not configured in Supabase. Add it in Project Settings → Edge Functions → Secrets.");
  }

  const portal = resolvePortal(roles);
  const roleLabels = roles
    .map((r) => r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(", ");

  const body = `
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${firstName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
      A new account has been created for you on the <strong>${portal.appName}</strong>. Use the credentials below to log in.
    </p>
    ${emailInfoCard(
      emailInfoRow("Email", email) +
      emailInfoRow("Temporary Password", `<code style="background-color:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:14px;">${tempPassword}</code>`) +
      emailInfoRow("Role" + (roles.length > 1 ? "s" : ""), roleLabels),
      portal.accent,
    )}
    ${emailCallout("Please change your password after your first login.", "warning")}
    ${emailCta(portal.portalUrl, `Log in to ${portal.appName}`, portal.accent)}`;

  const html = wrapEmailLayout({
    appName: portal.appName,
    accentColor: portal.accent,
    heading: "Your Account Is Ready",
    preheader: `Your ${portal.appName} account has been created. Log in with your temporary credentials.`,
    portalUrl: portal.portalUrl,
  }, body);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <notifications@mpb.health>",
      to: [email],
      subject: `Your ${portal.appName} Account Is Ready`,
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

  // Rate limit: admin user creation endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'create-user',
  });
  if (rateLimitResponse) return rateLimitResponse;

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
    const { email, first_name, last_name, roles, password, send_invite, phone, specialization, agent_id, company_name, avatar_url } = body;

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
        JSON.stringify({ success: false, error: "Failed to create user" }),
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

    if (shouldProvisionAdvisorProfile(roles)) {
      try {
        await provisionAdvisorProfile(supabaseAdmin, {
          userId,
          email,
          firstName: first_name,
          lastName: last_name,
          phone,
          specialization,
          agentId: agent_id,
          companyName: company_name,
          avatarUrl: avatar_url,
        });
      } catch (profileError) {
        log.error("Advisor profile provisioning failed", profileError);
        const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (rollbackError) {
          log.error("Rollback delete user failed", rollbackError);
        }
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to provision advisor profile",
          }),
          { status: 500, headers },
        );
      }
    }

    let emailSent = false;
    let emailError: string | undefined;
    if (send_invite) {
      try {
        await sendInviteEmail(email, first_name, tempPassword, roles);
        emailSent = true;
      } catch (emailErr) {
        log.error("Email send error:", emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
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
      phone: phone || undefined,
      specialization: specialization || undefined,
      agent_id: agent_id || undefined,
      company_name: company_name || undefined,
      avatar_url: avatar_url || undefined,
    }).catch((e) => log.warn("ITSTS sync failed (non-blocking)", e));

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        temp_password: send_invite ? undefined : tempPassword,
        message: send_invite
          ? (emailSent ? "User created and invitation email sent" : "User created but invitation email failed")
          : "User created successfully",
        email_sent: send_invite ? emailSent : undefined,
        email_error: emailError,
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
