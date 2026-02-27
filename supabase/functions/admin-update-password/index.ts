import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { syncUserToItsts } from '../_shared/itsts-sync.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('admin-update-password');

interface UpdatePasswordRequest {
  userId: string;
  password: string;
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
    keyPrefix: 'admin-update-password',
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

    // Check if caller is a super_admin
    const { data: roles, error: rolesError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "super_admin");

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Only super admins can update user passwords" }),
        { status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: UpdatePasswordRequest = await req.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return new Response(
        JSON.stringify({ error: "Missing userId or password" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role to update the password
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Log the operation for debugging
    log.info(`Caller: ${callingUser.id} (${callingUser.email}), Target: ${userId}`);

    // Get target user info for confirmation
    const { data: targetUser, error: targetError } = await adminClient.auth.admin.getUserById(userId);
    if (targetError || !targetUser?.user) {
      log.error('Target user not found:', targetError);
      return new Response(
        JSON.stringify({ error: `User not found: ${userId}` }),
        { status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    log.info(`Updating password for: ${targetUser.user.email}`);

    // Update the user's password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: password,
    });

    if (updateError) {
      log.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Sync password to ITSTS (fire-and-forget)
    syncUserToItsts({
      email: targetUser.user.email || '',
      first_name: targetUser.user.user_metadata?.first_name || '',
      last_name: targetUser.user.user_metadata?.last_name || '',
      roles: [],
      action: 'password_change',
      password,
    }).catch((e) => log.warn('ITSTS password sync failed (non-blocking)', e));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password updated successfully for ${targetUser.user.email}`,
        targetEmail: targetUser.user.email 
      }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    log.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
