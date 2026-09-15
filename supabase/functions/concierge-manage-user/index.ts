import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier, isValidEmail } from "../_shared/security.ts";
import { MPB_MEMBERSHIP_ORG_ID, MPB_PORTAL_ORG_ID } from "../_shared/orgIdResolver.ts";
import { wrapEmailLayout, emailCta, emailInfoCard, emailInfoRow, emailCallout } from "../_shared/emailLayout.ts";

const log = createLogger("concierge-manage-user");

/**
 * Concierge Management Center — privileged user operations, scoped to the
 * Concierge Portal only. Callable by concierge managers (super_admin, admin,
 * or an explicit concierge_user_access.is_manager grant).
 *
 * Escalation guardrails (why widening to `admin` is safe):
 *   - Role grant/revoke is limited to {concierge, member}. This function never
 *     touches admin/super_admin/advisor/crm_user — those stay in the Admin Portal.
 *   - A non-super_admin may never deactivate or delete a privileged target
 *     (only targets whose roles ⊆ {concierge, member}).
 *   - Only a super_admin may set is_manager. A super_admin target can never be
 *     deleted/deactivated here, and no one can act on themselves destructively.
 *   - Every mutation writes an audit_logs row server-side.
 */

type Action =
  | "create"
  | "grant_role"
  | "revoke_role"
  | "set_status"
  | "delete"
  | "set_features"
  | "link_roster";

interface ManageRequest {
  action: Action;
  dry_run?: boolean;
  // create
  email?: string;
  first_name?: string;
  last_name?: string;
  send_invite?: boolean;
  add_to_roster?: boolean;
  roster_role?: string;
  part_time?: boolean;
  // role / status / delete / features target
  user_id?: string;
  role?: string;
  status_action?: "deactivate" | "reactivate";
  confirm_email?: string;
  denied_features?: string[];
  is_manager?: boolean;
  notes?: string | null;
  // link_roster
  roster_id?: string;
  link_user_id?: string | null;
}

/** Roles this concierge-scoped function is allowed to grant/revoke. */
const CONCIERGE_SCOPE_ROLES = ["concierge", "member"] as const;

/**
 * Valid feature keys — kept in sync with
 * packages/concierge-core/src/features.ts (CONCIERGE_FEATURE_KEYS).
 */
const VALID_FEATURE_KEYS = new Set<string>([
  "daily_log.write",
  "daily_log.edit_any",
  "daily_log.delete_any",
  "reports.weekly",
  "reports.performance",
  "reports.analytics",
  "reports.july_billing",
  "reports.member_issues",
  "reports.share",
  "team.view",
  "team.manage",
  "data.export",
  "data.import",
  "tickets.view",
  "tickets.create",
]);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CONCIERGE_LOGIN_URL =
  Deno.env.get("CONCIERGE_PORTAL_LOGIN_URL") ?? "https://concierge.mpb.health/login";

function generateTempPassword(length = 20): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => charset[v % charset.length]).join("");
}

async function sendConciergeInvite(email: string, firstName: string, tempPassword: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured in Supabase Edge Function secrets.");
  }
  const body = `
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${firstName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
      You've been invited to the <strong>Concierge Portal</strong>. Use the credentials below to log in.
    </p>
    ${emailInfoCard(
      emailInfoRow("Email", email) +
      emailInfoRow("Temporary Password", `<code style="background-color:#e2e8f0;padding:2px 8px;border-radius:4px;font-size:14px;">${tempPassword}</code>`),
      "#2F6F5B",
    )}
    ${emailCallout("Please change your password after your first login.", "warning")}
    ${emailCta(CONCIERGE_LOGIN_URL, "Log in to the Concierge Portal", "#2F6F5B")}`;

  const html = wrapEmailLayout({
    appName: "Concierge Portal",
    accentColor: "#2F6F5B",
    heading: "Your Concierge Account Is Ready",
    preheader: "Your Concierge Portal account has been created. Log in with your temporary credentials.",
    portalUrl: CONCIERGE_LOGIN_URL,
  }, body);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <notifications@mpb.health>",
      to: [email],
      subject: "Your Concierge Portal Account Is Ready",
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error: ${res.status} - ${text}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

  const cors = getCorsHeaders(req);
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

  const clientIp = getClientIdentifier(req);
  const rl = checkRateLimit(clientIp, { maxRequests: 30, windowSeconds: 60, keyPrefix: "concierge-manage-user" }, cors);
  if (rl) return rl;

  try {
    if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ success: false, error: "Server configuration error" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Missing authorization" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Verify caller identity from the bearer token.
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !caller) return json({ success: false, error: "Invalid authorization" }, 401);

    // Resolve caller privileges.
    const { data: callerRoleRows } = await admin
      .from("user_roles").select("role").eq("user_id", caller.id);
    const callerRoles = (callerRoleRows ?? []).map((r: { role: string }) => r.role);
    const callerIsSuperAdmin = callerRoles.includes("super_admin");
    const callerIsAdmin = callerRoles.includes("admin");

    const { data: callerAccess } = await admin
      .from("concierge_user_access").select("is_manager")
      .eq("org_id", MPB_PORTAL_ORG_ID).eq("user_id", caller.id).maybeSingle();
    const callerHasManagerGrant = callerAccess?.is_manager === true;

    const isManager = callerIsSuperAdmin || callerIsAdmin || callerHasManagerGrant;
    if (!isManager) {
      return json({ success: false, error: "Only concierge managers can perform this action" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as ManageRequest;
    const action = body.action;
    const dryRun = body.dry_run === true;

    if (!action) return json({ success: false, error: "Missing action" }, 400);

    const audit = async (entry: {
      action: string;
      entity_id?: string | null;
      old_values?: Record<string, unknown> | null;
      new_values?: Record<string, unknown> | null;
    }) => {
      try {
        await admin.from("audit_logs").insert({
          user_id: caller.id,
          user_email: caller.email ?? null,
          action: entry.action,
          entity_type: "concierge_user",
          entity_id: entry.entity_id ?? null,
          old_values: entry.old_values ?? null,
          new_values: entry.new_values ?? null,
          ip_address: clientIp,
          user_agent: req.headers.get("user-agent") ?? null,
        });
      } catch (e) {
        log.warn("audit_logs insert failed (non-blocking)", e);
      }
    };

    /** Roles held by a target user. */
    const targetRolesOf = async (userId: string): Promise<string[]> => {
      const { data } = await admin.from("user_roles").select("role").eq("user_id", userId);
      return (data ?? []).map((r: { role: string }) => r.role);
    };
    const isPrivileged = (roles: string[]) => roles.some((r) => r === "super_admin" || r === "admin" || r === "advisor" || r === "crm_user");
    const isConciergeScopeOnly = (roles: string[]) => roles.every((r) => (CONCIERGE_SCOPE_ROLES as readonly string[]).includes(r));

    // ─────────────────────────────────────────────────────────────────────
    // CREATE — always creates a concierge-scoped account
    // ─────────────────────────────────────────────────────────────────────
    if (action === "create") {
      const email = (body.email ?? "").trim().toLowerCase();
      const firstName = (body.first_name ?? "").trim();
      const lastName = (body.last_name ?? "").trim();
      if (!email || !firstName || !lastName) return json({ success: false, error: "Email, first name, and last name are required" }, 400);
      if (!isValidEmail(email)) return json({ success: false, error: "Invalid email address" }, 400);

      if (dryRun) {
        return json({ success: true, dry_run: true, would: `Create concierge account for ${email}${body.add_to_roster ? " and add to roster" : ""}${body.send_invite ? " and email an invite" : ""}` });
      }

      const tempPassword = generateTempPassword();
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: `${firstName} ${lastName}`, first_name: firstName, last_name: lastName },
      });
      if (createErr || !created?.user) {
        return json({ success: false, error: createErr?.message || "Failed to create user" }, 400);
      }
      const userId = created.user.id;

      const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: "concierge", granted_by: caller.id });
      if (roleErr && roleErr.code !== "23505") {
        return json({ success: false, error: roleErr.message || "Could not assign concierge role" }, 400);
      }

      await admin.from("org_memberships").upsert(
        { user_id: userId, org_id: MPB_MEMBERSHIP_ORG_ID, role: "member", status: "active", joined_at: new Date().toISOString() },
        { onConflict: "user_id,org_id" },
      );

      let rosterId: string | null = null;
      if (body.add_to_roster) {
        const { data: maxRow } = await admin
          .from("concierge_team_members").select("display_order")
          .eq("org_id", MPB_PORTAL_ORG_ID).order("display_order", { ascending: false }).limit(1).maybeSingle();
        const nextOrder = (maxRow?.display_order ?? -1) + 1;
        const { data: rosterRow } = await admin.from("concierge_team_members").insert({
          org_id: MPB_PORTAL_ORG_ID,
          name: `${firstName} ${lastName}`.trim(),
          status: "Active",
          role: body.roster_role || "Concierge",
          part_time: body.part_time === true,
          display_order: nextOrder,
          user_id: userId,
        }).select("id").maybeSingle();
        rosterId = rosterRow?.id ?? null;
      }

      let emailSent = false;
      let emailError: string | undefined;
      if (body.send_invite) {
        try { await sendConciergeInvite(email, firstName, tempPassword); emailSent = true; }
        catch (e) { emailError = e instanceof Error ? e.message : String(e); log.error("invite email failed", e); }
      }

      await audit({ action: "concierge.user.create", entity_id: userId, new_values: { email, roles: ["concierge"], added_to_roster: !!body.add_to_roster, invite_sent: emailSent } });

      return json({
        success: true,
        user_id: userId,
        roster_id: rosterId,
        email_sent: body.send_invite ? emailSent : undefined,
        email_error: emailError,
        message: body.send_invite ? (emailSent ? "Concierge account created and invite sent" : "Account created but the invite email failed") : "Concierge account created",
      });
    }

    // All remaining actions target an existing user or roster row.
    // ─────────────────────────────────────────────────────────────────────
    // GRANT / REVOKE ROLE — concierge scope only
    // ─────────────────────────────────────────────────────────────────────
    if (action === "grant_role" || action === "revoke_role") {
      const userId = body.user_id;
      const role = body.role;
      if (!userId || !role) return json({ success: false, error: "Missing user_id or role" }, 400);
      if (!(CONCIERGE_SCOPE_ROLES as readonly string[]).includes(role)) {
        return json({ success: false, error: "This screen can only manage the 'concierge' or 'member' role. Change admin/super_admin roles in the Admin Portal." }, 400);
      }
      if (!callerIsSuperAdmin && role !== "concierge") {
        return json({ success: false, error: "Only super admins can grant or revoke the 'member' role here" }, 403);
      }
      if (userId === caller.id) {
        return json({ success: false, error: "You cannot change your own roles here" }, 400);
      }

      if (dryRun) return json({ success: true, dry_run: true, would: `${action === "grant_role" ? "Grant" : "Revoke"} '${role}' ${action === "grant_role" ? "to" : "from"} user ${userId}` });

      if (action === "grant_role") {
        const { error: insErr } = await admin.from("user_roles").insert({ user_id: userId, role, granted_by: caller.id });
        if (insErr && insErr.code !== "23505") return json({ success: false, error: insErr.message || "Failed to grant role" }, 400);
        if (role === "concierge") {
          await admin.from("org_memberships").upsert(
            { user_id: userId, org_id: MPB_MEMBERSHIP_ORG_ID, role: "member", status: "active", joined_at: new Date().toISOString() },
            { onConflict: "user_id,org_id" },
          );
        }
        await audit({ action: "concierge.role.grant", entity_id: userId, new_values: { role } });
        return json({ success: true, granted: true, message: `Granted '${role}'` });
      } else {
        const { error: delErr } = await admin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (delErr) return json({ success: false, error: delErr.message || "Failed to revoke role" }, 400);
        await audit({ action: "concierge.role.revoke", entity_id: userId, old_values: { role } });
        return json({ success: true, granted: false, message: `Revoked '${role}'` });
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // SET STATUS — deactivate (ban) / reactivate an account
    // ─────────────────────────────────────────────────────────────────────
    if (action === "set_status") {
      const userId = body.user_id;
      const statusAction = body.status_action;
      if (!userId || !statusAction) return json({ success: false, error: "Missing user_id or status_action" }, 400);
      if (userId === caller.id) return json({ success: false, error: "You cannot change your own account status" }, 400);

      const roles = await targetRolesOf(userId);
      if (roles.includes("super_admin")) return json({ success: false, error: "Cannot change the status of a super admin here" }, 403);
      if (!callerIsSuperAdmin && !isConciergeScopeOnly(roles)) {
        return json({ success: false, error: "You can only deactivate concierge or member accounts" }, 403);
      }

      if (dryRun) return json({ success: true, dry_run: true, would: `${statusAction === "deactivate" ? "Deactivate" : "Reactivate"} user ${userId}` });

      const ban_duration = statusAction === "deactivate" ? "876000h" : "none";
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, { ban_duration });
      if (updErr) return json({ success: false, error: updErr.message || "Failed to update status" }, 400);
      await audit({ action: `concierge.user.${statusAction}`, entity_id: userId, new_values: { status_action: statusAction } });
      return json({ success: true, message: statusAction === "deactivate" ? "Account deactivated" : "Account reactivated" });
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE — permanent, guardrailed
    // ─────────────────────────────────────────────────────────────────────
    if (action === "delete") {
      const userId = body.user_id;
      if (!userId) return json({ success: false, error: "Missing user_id" }, 400);
      if (userId === caller.id) return json({ success: false, error: "You cannot delete your own account" }, 400);

      const { data: targetData, error: targetErr } = await admin.auth.admin.getUserById(userId);
      if (targetErr || !targetData?.user) return json({ success: false, error: "User not found" }, 404);
      const targetEmail = targetData.user.email ?? "";

      const roles = await targetRolesOf(userId);
      if (roles.includes("super_admin") || roles.includes("admin")) {
        return json({ success: false, error: "Admins and super admins cannot be deleted from the Concierge portal. Use the Admin Portal." }, 403);
      }
      if (!callerIsSuperAdmin && !isConciergeScopeOnly(roles)) {
        return json({ success: false, error: "You can only delete concierge or member accounts" }, 403);
      }
      if ((body.confirm_email ?? "").trim().toLowerCase() !== targetEmail.toLowerCase()) {
        return json({ success: false, error: "Confirmation email does not match the account email" }, 400);
      }

      if (dryRun) return json({ success: true, dry_run: true, would: `Permanently delete ${targetEmail} (${userId})` });

      // Unlink roster rows first (no FK to auth.users, so the cascade won't clear these).
      await admin.from("concierge_team_members").update({ user_id: null }).eq("user_id", userId);
      // Best-effort explicit cleanup (concierge_user_access + user_roles cascade via FK, but be explicit).
      try { await admin.from("concierge_user_access").delete().eq("user_id", userId); } catch (_) { /* ignore */ }
      try { await admin.from("user_roles").delete().eq("user_id", userId); } catch (_) { /* ignore */ }
      try { await admin.from("org_memberships").delete().eq("user_id", userId); } catch (_) { /* ignore */ }

      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) return json({ success: false, error: `Failed to delete user: ${delErr.message}` }, 500);

      await audit({ action: "concierge.user.delete", entity_id: userId, old_values: { email: targetEmail, roles } });
      return json({ success: true, message: `Deleted ${targetEmail}`, deleted_user_id: userId });
    }

    // ─────────────────────────────────────────────────────────────────────
    // SET FEATURES — manager flag + deny-list
    // ─────────────────────────────────────────────────────────────────────
    if (action === "set_features") {
      const userId = body.user_id;
      if (!userId) return json({ success: false, error: "Missing user_id" }, 400);

      const denied = Array.isArray(body.denied_features) ? Array.from(new Set(body.denied_features)) : [];
      const invalid = denied.filter((k) => !VALID_FEATURE_KEYS.has(k));
      if (invalid.length) return json({ success: false, error: `Unknown feature key(s): ${invalid.join(", ")}` }, 400);

      const wantsManager = body.is_manager === true;
      if (wantsManager && !callerIsSuperAdmin) {
        return json({ success: false, error: "Only super admins can grant manager rights" }, 403);
      }

      const roles = await targetRolesOf(userId);
      if (roles.includes("super_admin") || roles.includes("admin")) {
        return json({ success: false, error: "Admins and super admins are always unrestricted; restrictions have no effect on them." }, 400);
      }

      const { data: existing } = await admin
        .from("concierge_user_access").select("is_manager, denied_features, notes")
        .eq("org_id", MPB_PORTAL_ORG_ID).eq("user_id", userId).maybeSingle();

      // Preserve an existing manager flag unless a super_admin explicitly changes it.
      const nextIsManager = callerIsSuperAdmin
        ? (typeof body.is_manager === "boolean" ? body.is_manager : (existing?.is_manager ?? false))
        : (existing?.is_manager ?? false);
      const nextNotes = body.notes === undefined ? (existing?.notes ?? null) : body.notes;

      if (dryRun) return json({ success: true, dry_run: true, would: `Set ${denied.length} restriction(s)${nextIsManager ? " and manager rights" : ""} on user ${userId}` });

      // Clean up the row entirely when nothing is set (keeps default-allow semantics tidy).
      if (!nextIsManager && denied.length === 0 && !nextNotes) {
        await admin.from("concierge_user_access").delete().eq("org_id", MPB_PORTAL_ORG_ID).eq("user_id", userId);
        await audit({ action: "concierge.access.clear", entity_id: userId, old_values: existing ?? null });
        return json({ success: true, message: "Restrictions cleared" });
      }

      const { error: upErr } = await admin.from("concierge_user_access").upsert(
        { org_id: MPB_PORTAL_ORG_ID, user_id: userId, is_manager: nextIsManager, denied_features: denied, notes: nextNotes, updated_by: caller.id, updated_at: new Date().toISOString() },
        { onConflict: "org_id,user_id" },
      );
      if (upErr) return json({ success: false, error: upErr.message || "Failed to save access" }, 400);

      await audit({ action: "concierge.access.set", entity_id: userId, old_values: existing ?? null, new_values: { is_manager: nextIsManager, denied_features: denied } });
      return json({ success: true, message: "Access updated" });
    }

    // ─────────────────────────────────────────────────────────────────────
    // LINK ROSTER — attach/detach a roster row to an auth account
    // ─────────────────────────────────────────────────────────────────────
    if (action === "link_roster") {
      const rosterId = body.roster_id;
      const linkUserId = body.link_user_id ?? null;
      if (!rosterId) return json({ success: false, error: "Missing roster_id" }, 400);

      if (linkUserId) {
        const { data: t, error: tErr } = await admin.auth.admin.getUserById(linkUserId);
        if (tErr || !t?.user) return json({ success: false, error: "Linked user not found" }, 404);
      }

      if (dryRun) return json({ success: true, dry_run: true, would: linkUserId ? `Link roster ${rosterId} to user ${linkUserId}` : `Unlink roster ${rosterId}` });

      const { error: upErr } = await admin
        .from("concierge_team_members").update({ user_id: linkUserId })
        .eq("id", rosterId).eq("org_id", MPB_PORTAL_ORG_ID);
      if (upErr) return json({ success: false, error: upErr.message || "Failed to link roster" }, 400);

      await audit({ action: "concierge.roster.link", entity_id: rosterId, new_values: { user_id: linkUserId } });
      return json({ success: true, message: linkUserId ? "Roster linked" : "Roster unlinked" });
    }

    return json({ success: false, error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    log.error("Unhandled error", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
