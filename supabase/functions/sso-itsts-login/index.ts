import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("sso-itsts-login");

type MonorepoRole = "super_admin" | "admin" | "advisor" | "member" | "crm_user";

// Redirect paths after SSO login - advisors go to tickets to submit/view support requests
const DEFAULT_ROLE_REDIRECTS: Record<string, string> = {
  advisor: "/tickets",
  super_admin: "/dashboard",
  admin: "/dashboard",
  crm_user: "/support/member",
  member: "/support/member",
};

const ITSTS_BASE_URL = Deno.env.get("ITSTS_BASE_URL") ?? "https://support.mpb.health";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

  try {
    // Verify the caller is authenticated on the monorepo project
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers },
      );
    }

    // Get user roles from monorepo
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (userRoles || []).map((r) => r.role) as MonorepoRole[];
    const primaryRole = roles[0] || "member";

    // Determine redirect path based on highest-priority role
    const advisorPath = Deno.env.get("ITSTS_ADVISOR_REDIRECT_PATH") ?? DEFAULT_ROLE_REDIRECTS.advisor;
    const roleRedirects = { ...DEFAULT_ROLE_REDIRECTS, advisor: advisorPath };
    let redirectPath = roleRedirects[primaryRole] ?? "/support/member";
    for (const role of roles) {
      if (role === "advisor") { redirectPath = roleRedirects.advisor; break; }
      if (role === "super_admin" || role === "admin") { redirectPath = roleRedirects.admin; break; }
    }

    // Connect to the ITSTS project
    const itstsUrl = Deno.env.get("ITSTS_SUPABASE_URL");
    const itstsKey = Deno.env.get("ITSTS_SERVICE_ROLE_KEY");
    if (!itstsUrl || !itstsKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ITSTS not configured" }),
        { status: 500, headers },
      );
    }

    const itstsAdmin = createClient(itstsUrl, itstsKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find user in ITSTS by email
    const { data: itstsProfile } = await itstsAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", user.email)
      .maybeSingle();

    if (!itstsProfile) {
      log.warn("User not found in ITSTS, cannot generate magic link", { email: user.email });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Support account not provisioned. Please contact your administrator.",
        }),
        { status: 404, headers },
      );
    }

    // Generate a magic link for the ITSTS user
    const redirectTo = `${ITSTS_BASE_URL}${redirectPath}`;

    const { data: linkData, error: linkError } = await itstsAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email!,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      log.error("Failed to generate magic link", linkError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate login link" }),
        { status: 500, headers },
      );
    }

    // The generated link contains token_hash and type params that the ITSTS
    // Supabase client will consume via detectSessionInUrl
    const verificationUrl = linkData.properties?.action_link;
    if (!verificationUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "No action link generated" }),
        { status: 500, headers },
      );
    }

    log.info("SSO magic link generated", { email: user.email, redirect: redirectPath });

    return new Response(
      JSON.stringify({
        success: true,
        url: verificationUrl,
        redirect_path: redirectPath,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("SSO failed", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
