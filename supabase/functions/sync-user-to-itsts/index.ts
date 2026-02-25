import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("sync-user-to-itsts");

type MonorepoRole = "super_admin" | "admin" | "advisor" | "member" | "crm_user";
type ItstsRole = "member" | "advisor" | "staff" | "agent" | "admin" | "super_admin" | "concierge";
type SyncAction = "create" | "update" | "password_change";

interface SyncRequest {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: MonorepoRole[];
  action: SyncAction;
  password?: string;
}

const ROLE_MAP: Record<MonorepoRole, ItstsRole> = {
  super_admin: "admin",
  admin: "staff",
  advisor: "advisor",
  crm_user: "member",
  member: "member",
};

const ROLE_PRIORITY: ItstsRole[] = ["admin", "staff", "advisor", "concierge", "member"];

function mapToItstsRole(roles: MonorepoRole[]): ItstsRole {
  for (const itstsRole of ROLE_PRIORITY) {
    for (const monoRole of roles) {
      if (ROLE_MAP[monoRole] === itstsRole) return itstsRole;
    }
  }
  return "member";
}

function getItstsClient() {
  const url = Deno.env.get("ITSTS_SUPABASE_URL");
  const key = Deno.env.get("ITSTS_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("ITSTS_SUPABASE_URL and ITSTS_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findItstsUserByEmail(
  itstsAdmin: ReturnType<typeof createClient>,
  email: string,
) {
  const { data, error } = await itstsAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (error) throw error;

  // listUsers doesn't support email filter directly;
  // query the ITSTS profiles table instead
  const { data: profile } = await itstsAdmin
    .from("profiles")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  return profile;
}

async function handleCreate(
  itstsAdmin: ReturnType<typeof createClient>,
  req: SyncRequest,
) {
  const itstsRole = mapToItstsRole(req.roles);
  const fullName = `${req.first_name} ${req.last_name}`.trim();

  // Check if user already exists in ITSTS
  const existing = await findItstsUserByEmail(itstsAdmin, req.email);
  if (existing) {
    log.info("User already exists in ITSTS, updating role", { email: req.email, role: itstsRole });
    await itstsAdmin
      .from("profiles")
      .update({ role: itstsRole, full_name: fullName, is_active: true })
      .eq("id", existing.id);
    return { synced: true, itsts_user_id: existing.id, action: "updated_existing" };
  }

  // Create auth user in ITSTS project
  const tempPassword = req.password || crypto.randomUUID().slice(0, 16) + "!A1";
  const { data: authUser, error: createError } = await itstsAdmin.auth.admin.createUser({
    email: req.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      first_name: req.first_name,
      last_name: req.last_name,
      source: "mpb_monorepo_sync",
    },
  });

  if (createError) {
    if (createError.message?.includes("already been registered")) {
      log.info("Auth user exists but no profile, upserting profile", { email: req.email });
      const { data: users } = await itstsAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingAuth = users?.users?.find((u) => u.email === req.email);
      if (existingAuth) {
        await itstsAdmin
          .from("profiles")
          .upsert({
            id: existingAuth.id,
            email: req.email,
            full_name: fullName,
            role: itstsRole,
            is_active: true,
          }, { onConflict: "id" });
        return { synced: true, itsts_user_id: existingAuth.id, action: "profile_created" };
      }
    }
    throw createError;
  }

  const itstsUserId = authUser.user.id;

  // Create profile in ITSTS
  const { error: profileError } = await itstsAdmin
    .from("profiles")
    .upsert({
      id: itstsUserId,
      email: req.email,
      full_name: fullName,
      role: itstsRole,
      is_active: true,
    }, { onConflict: "id" });

  if (profileError) {
    log.warn("Failed to create ITSTS profile (user was created)", profileError);
  }

  return { synced: true, itsts_user_id: itstsUserId, action: "created" };
}

async function handleUpdate(
  itstsAdmin: ReturnType<typeof createClient>,
  req: SyncRequest,
) {
  const itstsRole = mapToItstsRole(req.roles);
  const fullName = `${req.first_name} ${req.last_name}`.trim();

  const existing = await findItstsUserByEmail(itstsAdmin, req.email);
  if (!existing) {
    log.info("User not found in ITSTS, creating instead", { email: req.email });
    return handleCreate(itstsAdmin, req);
  }

  // Update auth user metadata
  await itstsAdmin.auth.admin.updateUserById(existing.id, {
    user_metadata: {
      full_name: fullName,
      first_name: req.first_name,
      last_name: req.last_name,
      source: "mpb_monorepo_sync",
    },
  });

  // Update profile
  await itstsAdmin
    .from("profiles")
    .update({ full_name: fullName, role: itstsRole, is_active: true })
    .eq("id", existing.id);

  return { synced: true, itsts_user_id: existing.id, action: "updated" };
}

async function handlePasswordChange(
  itstsAdmin: ReturnType<typeof createClient>,
  req: SyncRequest,
) {
  if (!req.password) {
    throw new Error("Password is required for password_change action");
  }

  const existing = await findItstsUserByEmail(itstsAdmin, req.email);
  if (!existing) {
    log.info("User not found in ITSTS for password sync, creating", { email: req.email });
    return handleCreate(itstsAdmin, req);
  }

  const { error } = await itstsAdmin.auth.admin.updateUserById(existing.id, {
    password: req.password,
  });

  if (error) throw error;

  return { synced: true, itsts_user_id: existing.id, action: "password_synced" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

  try {
    const body: SyncRequest = await req.json();
    const { email, action } = body;

    if (!email || !action) {
      return new Response(
        JSON.stringify({ success: false, error: "email and action are required" }),
        { status: 400, headers },
      );
    }

    log.info(`Syncing user to ITSTS`, { email, action, roles: body.roles });

    const itstsAdmin = getItstsClient();

    let result;
    switch (action) {
      case "create":
        result = await handleCreate(itstsAdmin, body);
        break;
      case "update":
        result = await handleUpdate(itstsAdmin, body);
        break;
      case "password_change":
        result = await handlePasswordChange(itstsAdmin, body);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers },
        );
    }

    log.info("Sync complete", result);

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Sync failed", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
