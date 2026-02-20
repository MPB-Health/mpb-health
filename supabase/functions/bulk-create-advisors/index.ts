import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

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

    // Parse request
    const body = await req.json();
    const advisors: AdvisorRecord[] = body.advisors;
    const genericPassword: string = body.password || "MPBHealth2025!";

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

    for (const advisor of advisors) {
      const { email, first_name, last_name, agent_id, company_name } = advisor;

      if (!email) {
        results.push({ email: "", agent_id, status: "skipped", reason: "No email" });
        skipped++;
        continue;
      }

      try {
        // Check if auth user already exists by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });

        // Use getUserByEmail-style check via listing
        const { data: lookupResult } = await supabaseAdmin
          .from("advisor_profiles")
          .select("id, email")
          .eq("email", email.toLowerCase().trim())
          .maybeSingle();

        if (lookupResult) {
          results.push({
            email,
            agent_id,
            status: "skipped",
            reason: "Advisor profile already exists",
          });
          skipped++;
          continue;
        }

        // Create auth user
        const { data: authUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase().trim(),
            password: genericPassword,
            email_confirm: true,
            user_metadata: {
              full_name: `${first_name} ${last_name}`.trim(),
              first_name,
              last_name,
            },
          });

        if (createError) {
          // User may already exist in auth but not in advisor_profiles
          if (createError.message?.includes("already been registered")) {
            results.push({
              email,
              agent_id,
              status: "skipped",
              reason: "Auth user already exists",
            });
            skipped++;
            continue;
          }
          throw createError;
        }

        const userId = authUser.user.id;

        // Create advisor_profiles row
        const { error: profileError } = await supabaseAdmin
          .from("advisor_profiles")
          .insert({
            id: userId,
            first_name: first_name || "Advisor",
            last_name: last_name || "",
            email: email.toLowerCase().trim(),
            agent_id: agent_id || null,
            company_name: company_name || null,
            status: "active",
            must_change_password: true,
            specialization: "general",
          });

        if (profileError) {
          log.error(`Profile insert failed for ${email}:`, profileError);
          // Auth user was created but profile failed — still count as error
          results.push({
            email,
            agent_id,
            status: "error",
            reason: `Profile: ${profileError.message}`,
          });
          errors++;
          continue;
        }

        // Assign advisor role
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: userId,
          role: "advisor",
          granted_by: caller.id,
        });

        if (roleError) {
          log.error(`Role insert failed for ${email}:`, roleError);
          // Profile created, role failed — log but count as created
        }

        results.push({ email, agent_id, status: "created" });
        created++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        log.error(`Failed to create advisor ${email}:`, err);
        results.push({ email, agent_id, status: "error", reason: message });
        errors++;
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
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
