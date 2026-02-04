import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    console.log("Resend API key not configured, skipping invite email");
    return;
  }

  const acceptUrl = `https://admin.mpb.health/accept-invite?token=${inviteToken}`;

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    advisor: "Advisor",
  };
  const roleLabel = roleLabels[role] || role;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've Been Invited to Join ${orgName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(to right, #2563eb, #06b6d4); padding: 30px 40px; border-radius: 12px 12px 0 0; text-align: center;">
                    <img src="https://mpb.health/assets/MPB-Health-No-background.png" alt="MPB Health" style="max-width: 180px; height: auto; margin-bottom: 15px;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">You're Invited!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">Hello,</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                      <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on MPB Health as a <strong>${roleLabel}</strong>.
                    </p>
                    <div style="background: linear-gradient(to right, #eff6ff, #ecfeff); border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <p style="color: #1e40af; font-size: 14px; margin: 0;">
                        <strong>Your Role:</strong> ${roleLabel}<br>
                        <strong>Organization:</strong> ${orgName}
                      </p>
                    </div>
                    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">
                      Click the button below to accept this invitation and set up your account:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Accept Invitation
                      </a>
                    </div>
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                    <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0;">
                      If the button above doesn't work, copy and paste this link into your browser:<br>
                      <a href="${acceptUrl}" style="color: #2563eb; word-break: break-all;">${acceptUrl}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 12px 12px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                      This invitation was sent by MPB Health on behalf of ${inviterName}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MPB Health <notifications@mympb.com>",
      to: [email],
      subject: `You've been invited to join ${orgName} on MPB Health`,
      html,
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      console.error("Invite insert error:", inviteError);
      return new Response(
        JSON.stringify({ success: false, error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send invite email
    try {
      await sendInviteEmail(email, inviterName, org_name || "MPB Health", role, invite.token);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Continue anyway, invite is created
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation sent successfully",
        invite_token: invite.token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
