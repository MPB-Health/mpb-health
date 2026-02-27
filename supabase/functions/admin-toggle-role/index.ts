import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("admin-toggle-role");

const VALID_ROLES = ["super_admin", "admin", "advisor", "crm_user", "member"] as const;

interface ToggleRoleRequest {
  userId: string;
  role: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight - must return 200 with CORS headers for browser requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        ...getCorsHeaders(req),
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Rate limit: authenticated admin CRUD endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'admin-toggle-role',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callingUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const { data: roles, error: rolesError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "super_admin");

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Only super admins can toggle user roles" }),
        { status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const body: ToggleRoleRequest = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: "Missing userId or role" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existing } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();

    const hasRole = !!existing;

    if (hasRole) {
      const { error: deleteError } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (deleteError) {
        log.error("Error revoking role:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to update role" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      log.info(`Revoked ${role} from user ${userId} by ${callingUser.email}`);
      return new Response(
        JSON.stringify({ success: true, granted: false }),
        { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    } else {
      const { error: insertError } = await adminClient.from("user_roles").insert({
        user_id: userId,
        role,
        granted_by: callingUser.id,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          return new Response(
            JSON.stringify({ success: true, granted: true }),
            { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
        log.error("Error granting role:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to update role" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      log.info(`Granted ${role} to user ${userId} by ${callingUser.email}`);
      return new Response(
        JSON.stringify({ success: true, granted: true }),
        { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    log.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
