import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("portal-sso");

/** Target portal base URLs - same Supabase project, different frontends */
const PORTAL_BASE_URLS: Record<string, string> = {
  advisors: "https://advisor.mpb.health",
  crm: "https://crm.mpb.health",
  app: "https://app.mpb.health",
  admin: "https://admin.mpb.health",
};

/** Default path after SSO per portal */
const PORTAL_PATHS: Record<string, string> = {
  advisors: "/",
  crm: "/",
  app: "/",
  admin: "/",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers },
      );
    }

    let body: { portal?: string } = {};
    try {
      body = (await req.json()) as { portal?: string };
    } catch {
      // No body or invalid JSON - use default
    }

    const portal = (body.portal || "advisors").toLowerCase();
    const baseUrl = Deno.env.get(`PORTAL_${portal.toUpperCase()}_URL`) ?? PORTAL_BASE_URLS[portal];
    const path = PORTAL_PATHS[portal] ?? "/";

    if (!baseUrl) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown portal: ${portal}` }),
        { status: 400, headers },
      );
    }

    const redirectTo = `${baseUrl}${path}`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email!,
      options: { redirectTo },
    });

    if (linkError) {
      log.error("Failed to generate portal magic link", linkError);
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

    log.info("Portal SSO magic link generated", { email: user.email, portal, redirectTo });

    return new Response(
      JSON.stringify({
        success: true,
        url: verificationUrl,
        redirect_to: redirectTo,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Portal SSO failed", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
