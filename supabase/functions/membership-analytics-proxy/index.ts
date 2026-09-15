import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("membership-analytics-proxy");

/**
 * Read-only PostgREST passthrough to the mobile app project.
 *
 * The admin portal used to query that project straight from the browser with
 * its anon key, which returned 401s because `anon` has no grants on these
 * objects. Its `authenticated` role can read every member record, so no key
 * for it may ship in a public bundle. This function holds the service-role key
 * and only answers callers who are admins in the primary project.
 *
 * The path shape mirrors PostgREST (`/rest/v1/<table>`) so supabase-js can use
 * this function as its base URL and every existing query keeps working.
 */
const ALLOWED_TABLES = new Set([
  "users",
  "members",
  "past_inactives",
  "sales_analytics_view",
]);

async function callerIsAdmin(token: string): Promise<boolean> {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user?.id) return false;

  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const roles = (data || []).map((r: { role: string }) => r.role);
  return roles.includes("admin") || roles.includes("super_admin");
}

/** Expects `/<function-name>/rest/v1/<table>`; returns the table if allowed. */
function resolveTable(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const restIndex = segments.indexOf("rest");
  if (restIndex === -1) return null;
  if (segments[restIndex + 1] !== "v1") return null;
  const table = segments[restIndex + 2];
  if (!table || segments.length > restIndex + 3) return null;
  return ALLOWED_TABLES.has(table) ? table : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

  const corsHeaders = getCorsHeaders(req);
  const correlationId =
    req.headers.get("x-request-id") ??
    `map-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  // supabase-js reads row counts off content-range, so it must be exposed to
  // the browser on top of the shared default.
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Access-Control-Expose-Headers": "x-request-id, content-range",
    "Content-Type": "application/json",
    "x-request-id": correlationId,
  };

  const rateLimited = checkRateLimit(getClientIdentifier(req), {
    maxRequests: 120,
    windowSeconds: 60,
    keyPrefix: "membership-analytics",
  }, corsHeaders);
  if (rateLimited) return rateLimited;

  try {
    const upstreamUrl = Deno.env.get("MOBILE_APP_SUPABASE_URL");
    const upstreamKey = Deno.env.get("MOBILE_APP_SERVICE_ROLE_KEY");
    if (!upstreamUrl || !upstreamKey) {
      log.warn("MOBILE_APP_SUPABASE_URL / MOBILE_APP_SERVICE_ROLE_KEY not set");
      return new Response(
        JSON.stringify({ error: "Membership analytics is not configured", correlationId }),
        { status: 503, headers },
      );
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response(
        JSON.stringify({ error: "Read-only endpoint", correlationId }),
        { status: 405, headers: { ...headers, Allow: "GET, HEAD, OPTIONS" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization", correlationId }),
        { status: 401, headers },
      );
    }

    if (!(await callerIsAdmin(authHeader.slice(7)))) {
      return new Response(
        JSON.stringify({ error: "Admin access required", correlationId }),
        { status: 403, headers },
      );
    }

    const requestUrl = new URL(req.url);
    const table = resolveTable(requestUrl.pathname);
    if (!table) {
      return new Response(
        JSON.stringify({ error: "Unknown analytics resource", correlationId }),
        { status: 404, headers },
      );
    }

    // Resource embedding (`select=a,other(b)`) would reach tables outside the
    // allow-list, so reject it rather than attempt to parse it.
    const select = requestUrl.searchParams.get("select");
    if (select?.includes("(")) {
      return new Response(
        JSON.stringify({ error: "Embedded selects are not supported", correlationId }),
        { status: 400, headers },
      );
    }

    const upstreamHeaders: Record<string, string> = {
      apikey: upstreamKey,
      Authorization: `Bearer ${upstreamKey}`,
      Accept: "application/json",
    };
    const range = req.headers.get("Range");
    if (range) upstreamHeaders.Range = range;
    const prefer = req.headers.get("Prefer");
    if (prefer && /^count=(exact|planned|estimated)$/.test(prefer)) {
      upstreamHeaders.Prefer = prefer;
    }

    const search = requestUrl.search;
    const upstream = await fetch(
      `${upstreamUrl}/rest/v1/${table}${search}`,
      { method: req.method, headers: upstreamHeaders },
    );

    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Access-Control-Expose-Headers": "x-request-id, content-range",
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
      "x-request-id": correlationId,
    };
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) responseHeaders["content-range"] = contentRange;

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    log.error("Proxy request failed", { error: String(err), correlationId });
    return new Response(
      JSON.stringify({ error: "Analytics request failed", correlationId }),
      { status: 500, headers },
    );
  }
});
