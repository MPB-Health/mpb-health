import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("sso-itsts-login");

type MonorepoRole = "super_admin" | "admin" | "advisor" | "member" | "crm_user";

// Redirect paths after SSO login - everyone lands on the dashboard
const DEFAULT_ROLE_REDIRECTS: Record<string, string> = {
  advisor: "/dashboard",
  super_admin: "/dashboard",
  admin: "/dashboard",
  crm_user: "/dashboard",
  member: "/dashboard",
};

const ITSTS_BASE_URL = Deno.env.get("ITSTS_BASE_URL") ?? "https://support.mpb.health";

function buildRedirectUrl(baseUrl: string, path: string): string | null {
  try {
    const base = new URL(baseUrl);
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return new URL(normalizedPath, base.origin).toString();
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

  // Rate limit: SSO/login endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'sso-itsts-login',
  });
  if (rateLimitResponse) return rateLimitResponse;

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
    if (!user.email) {
      return new Response(
        JSON.stringify({ success: false, error: "User email is required for support SSO" }),
        { status: 400, headers },
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
    let redirectPath = roleRedirects[primaryRole] ?? "/dashboard";
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

    // Find user in ITSTS by email — auto-provision if not found
    let itstsProfile = null;
    {
      const { data, error: profileLookupError } = await itstsAdmin
        .from("profiles")
        .select("id, email")
        .eq("email", user.email)
        .maybeSingle();
      if (profileLookupError) {
        log.error("Failed to lookup ITSTS profile", profileLookupError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to lookup support profile." }),
          { status: 500, headers },
        );
      }
      itstsProfile = data;
    }

    if (!itstsProfile) {
      log.info("User not found in ITSTS, auto-provisioning", { email: user.email });

      // Get user metadata from monorepo for provisioning
      const { data: { user: fullUser }, error: fullUserError } = await supabaseAdmin.auth.admin.getUserById(user.id);
      if (fullUserError) {
        log.warn("Failed to load full user metadata, using fallback names", fullUserError);
      }
      const firstName = fullUser?.user_metadata?.first_name || user.email!.split("@")[0];
      const lastName = fullUser?.user_metadata?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();

      // Map monorepo role to ITSTS role
      const roleMap: Record<string, string> = {
        super_admin: "admin", admin: "staff", advisor: "advisor", crm_user: "member", member: "member",
      };
      const itstsRole = roleMap[primaryRole] || "member";

      // Create auth user in ITSTS
      const tempPassword = crypto.randomUUID().slice(0, 16) + "!A1";
      const { data: authUser, error: createError } = await itstsAdmin.auth.admin.createUser({
        email: user.email!,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          source: "mpb_monorepo_sso_auto",
        },
      });

      let itstsUserId: string | null = null;

      if (createError) {
        if (createError.message?.includes("already been registered")) {
          // Auth user exists but no profile — use O(1) email lookup instead of scanning all users
          try {
            const { data: existingUser } = await itstsAdmin.auth.admin.getUserByEmail(user.email!);
            if (existingUser?.user) {
              itstsUserId = existingUser.user.id;
            }
          } catch { /* getUserByEmail may not exist on older versions */ }
          if (itstsUserId) {
            // found — proceed below
          } else {
            log.error("Could not find ITSTS auth user after 'already registered' error", { email: user.email });
            return new Response(
              JSON.stringify({ success: false, error: "Failed to provision support account. Please contact your administrator." }),
              { status: 500, headers },
            );
          }
        } else {
          log.error("Failed to create ITSTS auth user", createError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to provision support account. Please contact your administrator." }),
            { status: 500, headers },
          );
        }
      } else {
        itstsUserId = authUser.user.id;
      }

      // Create/upsert profile in ITSTS
      const { error: profileError } = await itstsAdmin
        .from("profiles")
        .upsert({
          id: itstsUserId,
          email: user.email,
          full_name: fullName,
          role: itstsRole,
          is_active: true,
        }, { onConflict: "id" });

      if (profileError) {
        log.warn("Failed to create ITSTS profile", profileError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to provision support profile. Please contact your administrator." }),
          { status: 500, headers },
        );
      }

      itstsProfile = { id: itstsUserId, email: user.email };
      log.info("Auto-provisioned user in ITSTS", { email: user.email, itstsUserId });
    }

    // Generate a magic link for the ITSTS user
    const redirectTo = buildRedirectUrl(ITSTS_BASE_URL, redirectPath);
    if (!redirectTo) {
      log.error("Invalid ITSTS_BASE_URL or redirectPath", { ITSTS_BASE_URL, redirectPath });
      return new Response(
        JSON.stringify({ success: false, error: "Support SSO is misconfigured: invalid redirect URL." }),
        { status: 500, headers },
      );
    }

    let { data: linkData, error: linkError } = await itstsAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email!,
      options: {
        redirectTo,
      },
    });

    // Fallback: some environments reject redirectTo when URL allowlist is incomplete.
    if (linkError) {
      log.warn("Magic link with redirectTo failed, retrying without redirectTo", {
        email: user.email,
        redirectTo,
        message: linkError.message,
      });
      const retry = await itstsAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
      });
      linkData = retry.data;
      linkError = retry.error;
    }

    if (linkError) {
      log.error("Failed to generate magic link", linkError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate login link. Please try again later." }),
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
        error: "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
