import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { syncUserToItsts } from "../_shared/itsts-sync.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("bulk-sync-itsts");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  // Rate limit: bulk admin operation
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'bulk-sync-itsts',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
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
        JSON.stringify({ success: false, error: "Only super admins can run bulk sync" }),
        { status: 403, headers },
      );
    }

    // Fetch all users with their roles
    const { data: allRoles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rolesErr) throw rolesErr;

    // Group roles by user_id
    const userRolesMap = new Map<string, string[]>();
    for (const r of allRoles || []) {
      const arr = userRolesMap.get(r.user_id) || [];
      arr.push(r.role);
      userRolesMap.set(r.user_id, arr);
    }

    // Fetch advisor profiles for rich data
    const { data: advisorProfiles } = await supabaseAdmin
      .from("advisor_profiles")
      .select("id, phone, specialization, agent_id, company_name, avatar_url");

    const advisorProfileMap = new Map<string, {
      phone?: string; specialization?: string; agent_id?: string;
      company_name?: string; avatar_url?: string;
    }>();
    for (const ap of advisorProfiles || []) {
      advisorProfileMap.set(ap.id, {
        phone: ap.phone || undefined,
        specialization: ap.specialization || undefined,
        agent_id: ap.agent_id || undefined,
        company_name: ap.company_name || undefined,
        avatar_url: ap.avatar_url || undefined,
      });
    }

    // Fetch all auth users in batches
    const allUsers: Array<{ id: string; email: string; first_name: string; last_name: string }> = [];
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;
      if (!data?.users?.length) break;
      for (const u of data.users) {
        allUsers.push({
          id: u.id,
          email: u.email || "",
          first_name: u.user_metadata?.first_name || u.user_metadata?.full_name?.split(" ")[0] || "",
          last_name: u.user_metadata?.last_name || u.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        });
      }
      if (data.users.length < 100) break;
      page++;
    }

    log.info(`Found ${allUsers.length} auth users, ${userRolesMap.size} with roles, ${advisorProfileMap.size} advisor profiles`);

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i];
      const roles = userRolesMap.get(u.id);

      if (!roles?.length || !u.email) {
        skipped++;
        continue;
      }

      const profile = advisorProfileMap.get(u.id);

      const ok = await syncUserToItsts({
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        roles: roles as Array<"super_admin" | "admin" | "advisor" | "member" | "crm_user">,
        action: "create",
        phone: profile?.phone,
        specialization: profile?.specialization,
        agent_id: profile?.agent_id,
        company_name: profile?.company_name,
        avatar_url: profile?.avatar_url,
      });

      if (ok) {
        synced++;
      } else {
        failed++;
      }

      // Rate limit: 5 users per second
      if ((i + 1) % 5 === 0 && i + 1 < allUsers.length) {
        await sleep(1000);
      }
    }

    log.info(`Bulk sync complete: ${synced} synced, ${skipped} skipped, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: { total: allUsers.length, synced, skipped, failed },
      }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Bulk sync failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
