/**
 * Shared helper to sync users to the ITSTS (IT Support Ticketing System).
 *
 * Call `syncUserToItsts()` from any edge function after creating or
 * updating a user. The sync is fire-and-forget by default — failures
 * are logged but never block the calling function.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

type MonorepoRole = "super_admin" | "admin" | "advisor" | "member" | "crm_user" | "manager" | "staff" | "concierge";
type ItstsRole = "member" | "advisor" | "staff" | "agent" | "admin" | "super_admin" | "concierge";
type SyncAction = "create" | "update" | "password_change";

interface SyncUserParams {
  email: string;
  first_name: string;
  last_name: string;
  roles: MonorepoRole[];
  action: SyncAction;
  password?: string;
  phone?: string | null;
  specialization?: string | null;
  agent_id?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
}

function buildProfileExtras(params: SyncUserParams): Record<string, string> {
  const extras: Record<string, string> = {};
  if (params.phone) extras.phone = params.phone;
  if (params.specialization) extras.specialization = params.specialization;
  if (params.agent_id) extras.agent_id = params.agent_id;
  if (params.company_name) extras.company_name = params.company_name;
  if (params.avatar_url) extras.avatar_url = params.avatar_url;
  return extras;
}

export const ROLE_MAP: Record<string, ItstsRole> = {
  super_admin: "admin",
  admin: "staff",
  manager: "staff",
  staff: "member",
  advisor: "advisor",
  crm_user: "member",
  member: "member",
  concierge: "concierge",
};

export const ROLE_PRIORITY: ItstsRole[] = ["admin", "staff", "advisor", "concierge", "member"];

export function mapToItstsRole(roles: MonorepoRole[]): ItstsRole {
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
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Sync a user to the ITSTS project. Safe to call fire-and-forget —
 * returns `true` on success, `false` on failure (never throws).
 */
export async function syncUserToItsts(params: SyncUserParams): Promise<boolean> {
  try {
    const client = getItstsClient();
    if (!client) {
      console.info("[itsts-sync] ITSTS env vars not set, skipping sync");
      return false;
    }

    const itstsRole = mapToItstsRole(params.roles);
    const fullName = `${params.first_name} ${params.last_name}`.trim();

    if (params.action === "password_change") {
      if (!params.password) return false;
      const { data: profile } = await client
        .from("profiles")
        .select("id")
        .eq("email", params.email)
        .maybeSingle();
      if (profile) {
        await client.auth.admin.updateUserById(profile.id, { password: params.password });
        console.info(`[itsts-sync] Password synced for ${params.email}`);
      }
      return true;
    }

    // Check if profile already exists
    const { data: existing } = await client
      .from("profiles")
      .select("id")
      .eq("email", params.email)
      .maybeSingle();

    const extras = buildProfileExtras(params);

    if (existing) {
      await client
        .from("profiles")
        .update({ full_name: fullName, role: itstsRole, is_active: true, ...extras })
        .eq("id", existing.id);
      console.info(`[itsts-sync] Updated existing ITSTS user ${params.email} -> ${itstsRole}`);
      return true;
    }

    // Create new auth user + profile
    const tempPw = params.password || crypto.randomUUID().slice(0, 16) + "!A1";
    const { data: authUser, error: createErr } = await client.auth.admin.createUser({
      email: params.email,
      password: tempPw,
      email_confirm: true,
      user_metadata: { full_name: fullName, first_name: params.first_name, last_name: params.last_name, source: "mpb_monorepo_sync" },
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        let found: { id: string; email?: string } | undefined;
        try {
          const { data: existingUser } = await client.auth.admin.getUserByEmail(params.email);
          found = existingUser?.user ?? undefined;
        } catch { /* fallback below */ }
        if (found) {
          await client.from("profiles").upsert(
            { id: found.id, email: params.email, full_name: fullName, role: itstsRole, is_active: true, ...extras },
            { onConflict: "id" },
          );
          console.info(`[itsts-sync] Created profile for existing auth user ${params.email}`);
          return true;
        }
      }
      throw createErr;
    }

    await client.from("profiles").upsert(
      { id: authUser.user.id, email: params.email, full_name: fullName, role: itstsRole, is_active: true, ...extras },
      { onConflict: "id" },
    );

    console.info(`[itsts-sync] Created ITSTS user ${params.email} as ${itstsRole}`);
    return true;
  } catch (err) {
    console.error(`[itsts-sync] Failed to sync ${params.email}:`, err instanceof Error ? err.message : err);
    return false;
  }
}
