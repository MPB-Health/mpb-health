import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('admin-update-user');

interface UpdateUserRequest {
  userId: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: authenticated admin CRUD endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'admin-update-user',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Get the authorization header to verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're authenticated and authorized
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify caller is authenticated
    const { data: { user: callingUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: UpdateUserRequest = await req.json().catch(() => ({} as UpdateUserRequest));
    const { userId, full_name, first_name, last_name, email } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Check if caller is the same user OR a super_admin
    const isSameUser = callingUser.id === userId;
    
    if (!isSameUser) {
      // Check if caller is a super_admin
      const { data: roles, error: rolesError } = await userClient
        .from("user_roles")
        .select("role")
        .eq("user_id", callingUser.id)
        .eq("role", "super_admin");

      if (rolesError || !roles || roles.length === 0) {
        return new Response(
          JSON.stringify({ error: "Only super admins can update other users" }),
          { status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    // Create admin client with service role to update the user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Derive a final full_name if only first/last were provided
    let resolvedFullName = full_name;
    if (resolvedFullName === undefined && (first_name !== undefined || last_name !== undefined)) {
      resolvedFullName = [first_name, last_name].filter((v) => typeof v === "string" && v.length > 0).join(" ").trim();
    }

    // Build update payload for auth.admin.updateUserById
    const updatePayload: {
      email?: string;
      user_metadata?: Record<string, string | null | undefined>;
    } = {};

    if (email) {
      updatePayload.email = email;
    }

    const metadata: Record<string, string | null | undefined> = {};
    if (resolvedFullName !== undefined) metadata.full_name = resolvedFullName;
    if (first_name !== undefined) metadata.first_name = first_name;
    if (last_name !== undefined) metadata.last_name = last_name;
    if (Object.keys(metadata).length > 0) {
      updatePayload.user_metadata = metadata;
    }

    if (Object.keys(updatePayload).length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No update fields provided" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Update the auth user (email + metadata)
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, updatePayload);

    if (updateError) {
      log.error("Error updating auth user:", updateError);
      // Surface the real error message so the client can diagnose (e.g.
      // "Email address already in use", "Invalid email", etc.).
      const message = updateError.message || "Failed to update user";
      const status = /not.?found/i.test(message) ? 404 : 400;
      return new Response(
        JSON.stringify({ success: false, error: message }),
        { status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Best-effort sync of name fields into admin_users and advisor_profiles so
    // every portal sees a consistent name. These are no-ops when the target
    // user doesn't have a row in the table.
    const adminPayload: Record<string, string> = {};
    const advisorPayload: Record<string, string> = {};
    if (first_name !== undefined) {
      adminPayload.first_name = first_name;
      advisorPayload.first_name = first_name;
    }
    if (last_name !== undefined) {
      adminPayload.last_name = last_name;
      advisorPayload.last_name = last_name;
    }
    if (email) {
      adminPayload.email = email;
      advisorPayload.email = email;
    }

    const syncWarnings: string[] = [];
    if (Object.keys(adminPayload).length > 0) {
      const { error: adminErr } = await adminClient
        .from("admin_users")
        .update(adminPayload)
        .eq("id", userId);
      if (adminErr && adminErr.code !== "PGRST116") {
        syncWarnings.push(`admin_users: ${adminErr.message}`);
      }
    }
    if (Object.keys(advisorPayload).length > 0) {
      const { error: advisorErr } = await adminClient
        .from("advisor_profiles")
        .update(advisorPayload)
        .eq("id", userId);
      if (advisorErr && advisorErr.code !== "PGRST116") {
        syncWarnings.push(`advisor_profiles: ${advisorErr.message}`);
      }
    }
    if (syncWarnings.length > 0) {
      log.warn("Partial sync warnings", { warnings: syncWarnings, userId });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User updated successfully",
        warnings: syncWarnings.length > 0 ? syncWarnings : undefined,
      }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    log.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
