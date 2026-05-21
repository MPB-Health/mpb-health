import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
import { wrapEmailLayout, emailCta, emailInfoCard, emailInfoRow, emailCallout } from "../_shared/emailLayout.ts";
const log = createLogger('invite-user');

interface InviteRequest {
  org_id: string;
  org_name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "advisor";
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendInviteEmail(
  email: string,
  inviterName: string,
  orgName: string,
  role: string,
  inviteToken: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    log.error('Resend API key not configured, cannot send invite email');
    throw new Error("RESEND_API_KEY is not configured in Supabase. Add it in Project Settings → Edge Functions → Secrets.");
  }

  const acceptUrl = `https://admin.mpb.health/accept-invite?token=${inviteToken}`;

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    advisor: "Advisor",
  };
  const roleLabel = roleLabels[role] || role;

  const bodyHtml = `
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hello,</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
      <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${roleLabel}</strong>.
    </p>
    ${emailInfoCard(
      emailInfoRow("Organization", orgName) +
      emailInfoRow("Your Role", roleLabel) +
      emailInfoRow("Invited By", inviterName),
      "#2563eb",
    )}
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 4px;">
      Click the button below to accept this invitation and set up your account:
    </p>
    ${emailCta(acceptUrl, "Accept Invitation", "#2563eb")}
    ${emailCallout("This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.", "info")}
    <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:20px 0 0;text-align:center;word-break:break-all;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${acceptUrl}" style="color:#2563eb;text-decoration:underline;">${acceptUrl}</a>
    </p>`;

  const html = wrapEmailLayout({
    appName: "Admin Portal",
    accentColor: "#2563eb",
    heading: "You're Invited!",
    preheader: `${inviterName} invited you to join ${orgName}. Accept to get started.`,
    portalUrl: "https://admin.mpb.health",
  }, bodyHtml);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <notifications@mpb.health>",
      to: [email],
      subject: `You've been invited to join ${orgName} on MPB Health`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    log.error("Failed to send invite email", { status: res.status, body, email });
    throw new Error(`Resend API error: ${res.status} - ${body}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: admin CRUD endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'invite-user',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Verify the caller
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Get caller's name
    const { data: callerProfile } = await supabaseAdmin
      .from("admin_users")
      .select("first_name, last_name")
      .eq("id", caller.id)
      .single();

    const inviterName = callerProfile
      ? `${callerProfile.first_name} ${callerProfile.last_name}`
      : caller.email || "A team member";

    // Parse request
    const body: InviteRequest = await req.json();
    const { org_id, org_name, email, role } = body;

    if (!org_id || !email || !role) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Check if user already has pending invite
    const { data: existingInvite } = await supabaseAdmin
      .from("org_invites")
      .select("id")
      .eq("org_id", org_id)
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ success: false, error: "User already has a pending invitation" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Check if user is already a member
    const { data: existingUser } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      const { data: existingMembership } = await supabaseAdmin
        .from("org_memberships")
        .select("id")
        .eq("org_id", org_id)
        .eq("user_id", existingUser.id)
        .eq("status", "active")
        .single();

      if (existingMembership) {
        return new Response(
          JSON.stringify({ success: false, error: "User is already a member of this organization" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("org_invites")
      .insert({
        org_id,
        email: email.toLowerCase(),
        role,
        invited_by: caller.id,
        status: "pending",
      })
      .select("token")
      .single();

    if (inviteError) {
      log.error('Invite insert error:', inviteError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create invitation" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Send invite email
    let emailSent = false;
    let emailError: string | undefined;
    try {
      await sendInviteEmail(email, inviterName, org_name || "MPB Health", role, invite.token);
      emailSent = true;
    } catch (emailErr) {
      log.error('Email send error:', emailErr);
      emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent ? "Invitation sent successfully" : "Invitation created but email failed to send",
        invite_token: invite.token,
        email_sent: emailSent,
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
