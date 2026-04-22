import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("admin-delete-user");

interface DeleteUserRequest {
  userId: string;
  /** Safety check — must match the target user's email */
  confirmEmail?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Tight rate limit — deletes are sensitive
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: "admin-delete-user",
  });
  if (rateLimitResponse) return rateLimitResponse;

  const jsonHeaders = (extra: HeadersInit = {}): HeadersInit => ({
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
    ...extra,
  });

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: jsonHeaders() },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: jsonHeaders() },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: jsonHeaders() },
      );
    }

    // Caller-scoped client to verify identity + role. Fall back to service
    // key (still with the caller Authorization header) if ANON isn't set.
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") || supabaseServiceKey,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user: callingUser },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: jsonHeaders() },
      );
    }

    const body = (await req.json().catch(() => ({}))) as DeleteUserRequest;
    const { userId, confirmEmail } = body;

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId" }),
        { status: 400, headers: jsonHeaders() },
      );
    }

    if (userId === callingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: "You cannot delete your own account" }),
        { status: 400, headers: jsonHeaders() },
      );
    }

    // Only super_admin can permanently delete users
    const { data: roles, error: rolesError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "super_admin");

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Only super admins can permanently delete users",
        }),
        { status: 403, headers: jsonHeaders() },
      );
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up target to confirm existence + surface clear error
    const { data: targetData, error: targetError } = await adminClient.auth.admin
      .getUserById(userId);

    if (targetError || !targetData?.user) {
      log.warn("Delete target not found", { userId, targetError });
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: jsonHeaders() },
      );
    }

    const targetEmail = targetData.user.email ?? "";

    // Optional email confirmation guard
    if (confirmEmail && confirmEmail.trim().toLowerCase() !== targetEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Confirmation email does not match the target user's email",
        }),
        { status: 400, headers: jsonHeaders() },
      );
    }

    // Refuse to delete other super admins unless caller is deleting themselves
    // (already blocked above). This prevents accidental lock-out.
    const { data: targetRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isTargetSuperAdmin = (targetRoles || []).some(
      (r: { role: string }) => r.role === "super_admin",
    );

    if (isTargetSuperAdmin) {
      // Count remaining super admins; never allow deleting the last one
      const { count, error: countError } = await adminClient
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "super_admin");

      if (!countError && typeof count === "number" && count <= 1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Cannot delete the last remaining super admin",
          }),
          { status: 400, headers: jsonHeaders() },
        );
      }
    }

    log.info("Deleting user", {
      caller: callingUser.id,
      callerEmail: callingUser.email,
      target: userId,
      targetEmail,
    });

    // Hard delete auth user. FKs on admin_users.id, advisor_profiles.id,
    // user_roles.user_id etc. are ON DELETE CASCADE, so related rows
    // are removed automatically.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      log.error("Failed to delete auth user", deleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to delete user: ${deleteError.message}`,
        }),
        { status: 500, headers: jsonHeaders() },
      );
    }

    // Best-effort belt-and-braces cleanup for anything the FK cascade
    // might miss (e.g. rows keyed off email or legacy references).
    try {
      await adminClient.from("admin_users").delete().eq("id", userId);
    } catch (_) { /* ignore */ }
    try {
      await adminClient.from("advisor_profiles").delete().eq("id", userId);
    } catch (_) { /* ignore */ }
    try {
      await adminClient.from("user_roles").delete().eq("user_id", userId);
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetEmail} deleted`,
        deleted_user_id: userId,
        deleted_email: targetEmail,
      }),
      { status: 200, headers: jsonHeaders() },
    );
  } catch (err) {
    log.error("Unexpected error", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: jsonHeaders() },
    );
  }
});
