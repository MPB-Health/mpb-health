// Shared authorization helpers for CRM edge functions.
//
// Ported from the ARYX CRM deployment so the two codebases stay diffable;
// only the helpers this repo actually calls are included.
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("crm-org-auth");

export type AssertResourceOrg =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** Confirm a row in `table` belongs to `orgId` (default column org_id). */
export async function assertResourceBelongsToOrg(
  supabaseAdmin: SupabaseClient,
  table: string,
  resourceId: string,
  orgId: string,
  orgColumn = "org_id",
): Promise<AssertResourceOrg> {
  if (!resourceId || !orgId) {
    return { ok: false, status: 400, error: "Missing resource or org id" };
  }

  const { data, error } = await supabaseAdmin
    .from(table)
    .select(orgColumn)
    .eq("id", resourceId)
    .maybeSingle();

  if (error) {
    log.error(`Failed to load ${table} for org check`, error);
    return { ok: false, status: 500, error: "Failed to verify resource ownership" };
  }

  if (!data) {
    return { ok: false, status: 404, error: "Resource not found" };
  }

  const rowOrg = (data as Record<string, unknown>)[orgColumn];
  if (rowOrg !== orgId) {
    return { ok: false, status: 403, error: "Resource does not belong to this organization" };
  }

  return { ok: true };
}
