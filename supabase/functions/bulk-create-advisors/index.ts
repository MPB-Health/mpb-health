import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { syncUserToItsts } from "../_shared/itsts-sync.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("bulk-create-advisors");

interface AdvisorRecord {
  email: string;
  first_name: string;
  last_name: string;
  agent_id: string;
  company_name: string;
}

interface ImportResult {
  email: string;
  agent_id: string;
  status: "created" | "skipped" | "error";
  reason?: string;
}

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
    keyPrefix: 'bulk-create-advisors',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
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
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

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
        JSON.stringify({ success: false, error: "Only super admins can bulk-create advisors" }),
        { status: 403, headers },
      );
    }

    const body = await req.json();
    const advisors: AdvisorRecord[] = body.advisors;
    // If a shared password is provided use it; otherwise each advisor gets a unique random one
    const sharedPassword: string | null = body.password || null;

    if (!Array.isArray(advisors) || advisors.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No advisor records provided" }),
        { status: 400, headers },
      );
    }

    if (advisors.length > 500) {
      return new Response(
        JSON.stringify({ success: false, error: "Maximum 500 advisors per batch" }),
        { status: 400, headers },
      );
    }

    const results: ImportResult[] = [];
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < advisors.length; i++) {
      const { email, first_name, last_name, agent_id, company_name } = advisors[i];

      if (!email || typeof email !== "string") {
        results.push({ email: email || "", agent_id, status: "skipped", reason: "No email" });
        skipped++;
        continue;
      }

      const cleanEmail = email.toLowerCase().trim();

      if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
        results.push({
          email: cleanEmail,
          agent_id,
          status: "error",
          reason: "Invalid email format",
        });
        errors++;
        continue;
      }

      try {
        const { data: lookupResult } = await supabaseAdmin
          .from("advisor_profiles")
          .select("id, email")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (lookupResult) {
          results.push({
            email: cleanEmail,
            agent_id,
            status: "skipped",
            reason: "Advisor profile already exists",
          });
          skipped++;
          continue;
        }

        // Generate a unique secure password per advisor if no shared password was provided
        const advisorPassword = sharedPassword || crypto.randomUUID().slice(0, 16) + "!A1";

        const { data: authUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: advisorPassword,
            email_confirm: true,
            user_metadata: {
              full_name: `${first_name} ${last_name}`.trim(),
              first_name,
              last_name,
            },
          });

        if (createError) {
          const msg = createError.message || "Unknown auth error";
          if (msg.includes("already been registered") || msg.includes("already exists")) {
            results.push({
              email: cleanEmail,
              agent_id,
              status: "skipped",
              reason: "Auth user already exists",
            });
            skipped++;
            continue;
          }
          log.error(`Auth createUser failed for ${cleanEmail}: ${msg}`);
          results.push({ email: cleanEmail, agent_id, status: "error", reason: msg });
          errors++;
          continue;
        }

        if (!authUser?.user?.id) {
          results.push({
            email: cleanEmail,
            agent_id,
            status: "error",
            reason: "User created but no ID returned",
          });
          errors++;
          continue;
        }

        const userId = authUser.user.id;

        const { error: profileError } = await supabaseAdmin
          .from("advisor_profiles")
          .insert({
            id: userId,
            first_name: first_name || "Advisor",
            last_name: last_name || "",
            email: cleanEmail,
            agent_id: agent_id || null,
            company_name: company_name || null,
            status: "active",
            must_change_password: true,
            specialization: "general",
          });

        if (profileError) {
          log.error(`Profile insert failed for ${cleanEmail}:`, profileError.message);
          results.push({
            email: cleanEmail,
            agent_id,
            status: "error",
            reason: `Profile: ${profileError.message}`,
          });
          errors++;
          continue;
        }

        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: userId,
          role: "advisor",
          granted_by: caller.id,
        });

        if (roleError) {
          log.error(`Role insert failed for ${cleanEmail}:`, roleError.message);
        }

        // Fire-and-forget sync to ITSTS
        syncUserToItsts({
          email: cleanEmail,
          first_name: first_name || "Advisor",
          last_name: last_name || "",
          roles: ["advisor"],
          action: "create",
          password: advisorPassword,
          agent_id: agent_id || undefined,
          company_name: company_name || undefined,
        }).catch(() => {});

        results.push({ email: cleanEmail, agent_id, status: "created" });
        created++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error(`Failed to create advisor ${cleanEmail}:`, message);
        results.push({ email: cleanEmail, agent_id, status: "error", reason: message });
        errors++;
      }

      // Rate-limit: pause every 10 users to avoid hitting Supabase limits
      if ((i + 1) % 10 === 0 && i + 1 < advisors.length) {
        await sleep(500);
      }
    }

    log.info(
      `Bulk import complete: ${created} created, ${skipped} skipped, ${errors} errors`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        summary: { total: advisors.length, created, skipped, errors },
        results,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
