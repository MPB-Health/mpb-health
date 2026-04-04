import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("analytics-hub-proxy");

type ProxyAction =
  | "champion_stats"
  | "champion_trends"
  | "mobile_stats"
  | "mobile_trends"
  | "support_stats"
  | "ga4_overview"
  | "discover_schema"
  | "combined_summary";

interface ProxyRequest {
  action: ProxyAction;
  project?: "champion" | "mobile" | "itsts";
  days?: number;
}

// ---------------------------------------------------------------------------
// Lazy external clients (same pattern as ticket-proxy getItstsClient)
// ---------------------------------------------------------------------------

function getChampionClient(): SupabaseClient | null {
  const url = Deno.env.get("CHAMPION_ENROLL_SUPABASE_URL");
  const key = Deno.env.get("CHAMPION_ENROLL_SERVICE_ROLE_KEY");
  if (!url || !key) {
    log.warn("CHAMPION_ENROLL_SUPABASE_URL / CHAMPION_ENROLL_SERVICE_ROLE_KEY not set");
    return null;
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getMobileClient(): SupabaseClient | null {
  const url = Deno.env.get("MOBILE_APP_SUPABASE_URL");
  const key = Deno.env.get("MOBILE_APP_SERVICE_ROLE_KEY");
  if (!url || !key) {
    log.warn("MOBILE_APP_SUPABASE_URL / MOBILE_APP_SERVICE_ROLE_KEY not set");
    return null;
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getItstsClient(): SupabaseClient | null {
  const url = Deno.env.get("ITSTS_SUPABASE_URL");
  const key = Deno.env.get("ITSTS_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Safe count helper — returns 0 if table doesn't exist or query fails
// ---------------------------------------------------------------------------

async function safeCount(
  client: SupabaseClient,
  table: string,
  filter?: { column: string; value: string },
): Promise<number> {
  try {
    let query = client.from(table).select("*", { count: "exact", head: true });
    if (filter) query = query.eq(filter.column, filter.value);
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeCountSince(
  client: SupabaseClient,
  table: string,
  dateColumn: string,
  since: string,
): Promise<number> {
  try {
    const { count, error } = await client
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte(dateColumn, since);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeTrendByDay(
  client: SupabaseClient,
  table: string,
  dateColumn: string,
  days: number,
): Promise<{ date: string; count: number }[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    const { data, error } = await client
      .from(table)
      .select(dateColumn)
      .gte(dateColumn, sinceStr);

    if (error || !data) return [];

    const countByDate: Record<string, number> = {};
    for (const row of data) {
      const val = row[dateColumn];
      if (!val) continue;
      const date = String(val).split("T")[0];
      countByDate[date] = (countByDate[date] || 0) + 1;
    }

    const result: { date: string; count: number }[] = [];
    const cursor = new Date(since);
    const today = new Date();
    while (cursor <= today) {
      const dateStr = cursor.toISOString().split("T")[0];
      result.push({ date: dateStr, count: countByDate[dateStr] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Schema discovery — lists public tables and row counts
// ---------------------------------------------------------------------------

async function discoverSchema(
  client: SupabaseClient,
  projectUrl: string,
): Promise<{ project: string; tables: { name: string; row_count: number }[] }> {
  try {
    const { data, error } = await client.rpc("get_table_info").select("*");
    if (!error && data) {
      return {
        project: projectUrl,
        tables: data.map((t: { table_name: string; row_count: number }) => ({
          name: t.table_name,
          row_count: t.row_count ?? 0,
        })),
      };
    }
  } catch { /* RPC may not exist, fall through */ }

  // Fallback: query well-known tables and see which ones exist
  const candidates = [
    "profiles", "users", "agents", "agent_profiles",
    "enrollments", "subscriptions", "billing", "payments", "invoices",
    "plans", "products", "organizations", "companies",
    "sessions", "app_sessions", "analytics", "app_analytics",
    "notifications", "messages", "tickets", "activity_log",
    "members", "dependents", "claims", "providers",
  ];

  const tables: { name: string; row_count: number }[] = [];
  const checks = candidates.map(async (table) => {
    const count = await safeCount(client, table);
    if (count > 0 || count === 0) {
      // Verify the table actually exists by trying a real query
      const { error } = await client.from(table).select("*", { count: "exact", head: true });
      if (!error) {
        tables.push({ name: table, row_count: count });
      }
    }
  });
  await Promise.allSettled(checks);

  tables.sort((a, b) => b.row_count - a.row_count);
  return { project: projectUrl, tables };
}

// ---------------------------------------------------------------------------
// Champion Enrollment stats
// ---------------------------------------------------------------------------

interface ChampionStats {
  configured: boolean;
  total_users: number;
  active_users: number;
  total_agents: number;
  active_agents: number;
  total_enrollments: number;
  pending_enrollments: number;
  approved_enrollments: number;
  total_billing_records: number;
  recent_signups_30d: number;
  recent_enrollments_30d: number;
}

async function getChampionStats(): Promise<ChampionStats> {
  const client = getChampionClient();
  if (!client) {
    return {
      configured: false,
      total_users: 0, active_users: 0,
      total_agents: 0, active_agents: 0,
      total_enrollments: 0, pending_enrollments: 0, approved_enrollments: 0,
      total_billing_records: 0,
      recent_signups_30d: 0, recent_enrollments_30d: 0,
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since30 = thirtyDaysAgo.toISOString();

  // Try multiple common table-name patterns for each entity
  const [
    totalUsers, activeUsers,
    totalAgents, activeAgents,
    totalEnrollments, pendingEnrollments, approvedEnrollments,
    totalBilling,
    recentSignups, recentEnrollments,
  ] = await Promise.all([
    // Users (try profiles first, then users)
    safeCount(client, "profiles").then(c => c || safeCount(client, "users")),
    safeCount(client, "profiles", { column: "status", value: "active" })
      .then(c => c || safeCount(client, "users", { column: "status", value: "active" })),
    // Agents
    safeCount(client, "agents").then(c => c || safeCount(client, "agent_profiles")),
    safeCount(client, "agents", { column: "status", value: "active" })
      .then(c => c || safeCount(client, "agent_profiles", { column: "status", value: "active" })),
    // Enrollments
    safeCount(client, "enrollments").then(c => c || safeCount(client, "subscriptions")),
    safeCount(client, "enrollments", { column: "status", value: "pending" })
      .then(c => c || safeCount(client, "subscriptions", { column: "status", value: "pending" })),
    safeCount(client, "enrollments", { column: "status", value: "approved" })
      .then(c => c || safeCount(client, "subscriptions", { column: "status", value: "approved" })
        .then(c2 => c2 || safeCount(client, "enrollments", { column: "status", value: "active" }))),
    // Billing
    safeCount(client, "billing").then(c => c || safeCount(client, "payments")
      .then(c2 => c2 || safeCount(client, "invoices"))),
    // Recent activity
    safeCountSince(client, "profiles", "created_at", since30)
      .then(c => c || safeCountSince(client, "users", "created_at", since30)),
    safeCountSince(client, "enrollments", "created_at", since30)
      .then(c => c || safeCountSince(client, "subscriptions", "created_at", since30)),
  ]);

  return {
    configured: true,
    total_users: totalUsers,
    active_users: activeUsers,
    total_agents: totalAgents,
    active_agents: activeAgents,
    total_enrollments: totalEnrollments,
    pending_enrollments: pendingEnrollments,
    approved_enrollments: approvedEnrollments,
    total_billing_records: totalBilling,
    recent_signups_30d: recentSignups,
    recent_enrollments_30d: recentEnrollments,
  };
}

async function getChampionTrends(days: number): Promise<{
  configured: boolean;
  user_signups: { date: string; count: number }[];
  enrollments: { date: string; count: number }[];
}> {
  const client = getChampionClient();
  if (!client) {
    return { configured: false, user_signups: [], enrollments: [] };
  }

  const [userSignups, enrollments] = await Promise.all([
    safeTrendByDay(client, "profiles", "created_at", days)
      .then(r => r.length ? r : safeTrendByDay(client, "users", "created_at", days)),
    safeTrendByDay(client, "enrollments", "created_at", days)
      .then(r => r.length ? r : safeTrendByDay(client, "subscriptions", "created_at", days)),
  ]);

  return { configured: true, user_signups: userSignups, enrollments };
}

// ---------------------------------------------------------------------------
// Mobile App stats
// ---------------------------------------------------------------------------

interface MobileStats {
  configured: boolean;
  total_users: number;
  active_users: number;
  total_sessions: number;
  recent_sessions_30d: number;
  recent_signups_30d: number;
}

async function getMobileStats(): Promise<MobileStats> {
  const client = getMobileClient();
  if (!client) {
    return {
      configured: false,
      total_users: 0, active_users: 0,
      total_sessions: 0, recent_sessions_30d: 0, recent_signups_30d: 0,
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since30 = thirtyDaysAgo.toISOString();

  const [
    totalUsers, activeUsers,
    totalSessions, recentSessions, recentSignups,
  ] = await Promise.all([
    safeCount(client, "profiles").then(c => c || safeCount(client, "users")),
    safeCount(client, "profiles", { column: "status", value: "active" })
      .then(c => c || safeCount(client, "users", { column: "status", value: "active" })),
    safeCount(client, "sessions").then(c => c || safeCount(client, "app_sessions")
      .then(c2 => c2 || safeCount(client, "analytics"))),
    safeCountSince(client, "sessions", "created_at", since30)
      .then(c => c || safeCountSince(client, "app_sessions", "created_at", since30)),
    safeCountSince(client, "profiles", "created_at", since30)
      .then(c => c || safeCountSince(client, "users", "created_at", since30)),
  ]);

  return {
    configured: true,
    total_users: totalUsers,
    active_users: activeUsers,
    total_sessions: totalSessions,
    recent_sessions_30d: recentSessions,
    recent_signups_30d: recentSignups,
  };
}

async function getMobileTrends(days: number): Promise<{
  configured: boolean;
  user_signups: { date: string; count: number }[];
  sessions: { date: string; count: number }[];
}> {
  const client = getMobileClient();
  if (!client) {
    return { configured: false, user_signups: [], sessions: [] };
  }

  const [userSignups, sessions] = await Promise.all([
    safeTrendByDay(client, "profiles", "created_at", days)
      .then(r => r.length ? r : safeTrendByDay(client, "users", "created_at", days)),
    safeTrendByDay(client, "sessions", "created_at", days)
      .then(r => r.length ? r : safeTrendByDay(client, "app_sessions", "created_at", days)),
  ]);

  return { configured: true, user_signups: userSignups, sessions };
}

// ---------------------------------------------------------------------------
// Support (ITSTS) stats
// ---------------------------------------------------------------------------

interface SupportStats {
  configured: boolean;
  total: number;
  new_tickets: number;
  open: number;
  pending: number;
  closed: number;
}

async function getSupportStats(): Promise<SupportStats> {
  const client = getItstsClient();
  if (!client) {
    return { configured: false, total: 0, new_tickets: 0, open: 0, pending: 0, closed: 0 };
  }

  const statuses = ["new", "open", "pending", "closed"] as const;
  const results = await Promise.all(
    statuses.map(status => safeCount(client, "tickets", { column: "status", value: status })),
  );

  const [newCount, openCount, pendingCount, closedCount] = results;
  return {
    configured: true,
    total: newCount + openCount + pendingCount + closedCount,
    new_tickets: newCount,
    open: openCount,
    pending: pendingCount,
    closed: closedCount,
  };
}

// ---------------------------------------------------------------------------
// Google Analytics 4 Data API
// ---------------------------------------------------------------------------

interface GA4Overview {
  configured: boolean;
  measurement_id: string;
  stream_id: string;
  stream_name: string;
  total_sessions: number;
  total_page_views: number;
  total_users: number;
  new_users: number;
  avg_session_duration: number;
  bounce_rate: number;
  top_pages: { path: string; views: number }[];
  top_sources: { source: string; sessions: number }[];
}

async function getGA4AccessToken(): Promise<string | null> {
  const saJson = Deno.env.get("GA4_SERVICE_ACCOUNT_JSON");
  if (!saJson) return null;

  try {
    const sa = JSON.parse(saJson);
    const now = Math.floor(Date.now() / 1000);

    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }));

    const signingInput = `${header}.${payload}`;

    // Import the RSA private key
    const pemBody = sa.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");
    const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const sig = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(signingInput),
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const jwt = `${header}.${payload}.${sigB64}`;

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResp.ok) {
      log.error("GA4 token exchange failed", { status: tokenResp.status });
      return null;
    }

    const tokenData = await tokenResp.json();
    return tokenData.access_token || null;
  } catch (err) {
    log.error("GA4 auth error", { error: String(err) });
    return null;
  }
}

async function getGA4Overview(days: number): Promise<GA4Overview> {
  const propertyId = Deno.env.get("GA4_PROPERTY_ID") || "494661371";
  const measurementId = "G-MQMM1N1MSL";
  const streamId = "11406103800";

  const emptyGA4: GA4Overview = {
    configured: false, measurement_id: measurementId, stream_id: streamId, stream_name: "MPB Health",
    total_sessions: 0, total_page_views: 0, total_users: 0, new_users: 0,
    avg_session_duration: 0, bounce_rate: 0, top_pages: [], top_sources: [],
  };

  if (!propertyId) return emptyGA4;

  const token = await getGA4AccessToken();
  if (!token) {
    log.warn("GA4 not configured — missing service account or token exchange failed");
    return emptyGA4;
  }

  const apiBase = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  try {
    // Main metrics report
    const [metricsResp, pagesResp, sourcesResp] = await Promise.all([
      fetch(apiBase, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
          metrics: [
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "totalUsers" },
            { name: "newUsers" },
            { name: "averageSessionDuration" },
            { name: "bounceRate" },
          ],
        }),
      }),
      fetch(apiBase, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 10,
        }),
      }),
      fetch(apiBase, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "sessionSource" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 10,
        }),
      }),
    ]);

    const metricsData = metricsResp.ok ? await metricsResp.json() : null;
    const pagesData = pagesResp.ok ? await pagesResp.json() : null;
    const sourcesData = sourcesResp.ok ? await sourcesResp.json() : null;

    const row = metricsData?.rows?.[0]?.metricValues || [];

    const top_pages = (pagesData?.rows || []).map(
      (r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        path: r.dimensionValues?.[0]?.value || "/",
        views: parseInt(r.metricValues?.[0]?.value || "0", 10),
      }),
    );

    const top_sources = (sourcesData?.rows || []).map(
      (r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        source: r.dimensionValues?.[0]?.value || "(direct)",
        sessions: parseInt(r.metricValues?.[0]?.value || "0", 10),
      }),
    );

    return {
      configured: true,
      measurement_id: measurementId,
      stream_id: streamId,
      stream_name: "MPB Health",
      total_sessions: parseInt(row[0]?.value || "0", 10),
      total_page_views: parseInt(row[1]?.value || "0", 10),
      total_users: parseInt(row[2]?.value || "0", 10),
      new_users: parseInt(row[3]?.value || "0", 10),
      avg_session_duration: parseFloat(row[4]?.value || "0"),
      bounce_rate: parseFloat(row[5]?.value || "0") * 100,
      top_pages,
      top_sources,
    };
  } catch (err) {
    log.error("GA4 Data API error", { error: String(err) });
    return emptyGA4;
  }
}

// ---------------------------------------------------------------------------
// Admin role check (against primary project)
// ---------------------------------------------------------------------------

async function checkAdminRole(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data || []).map((r: { role: string }) => r.role);
  return roles.includes("admin") || roles.includes("super_admin");
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Warmup bypass
  const warmupSecret = Deno.env.get("WARMUP_CRON_SECRET");
  const warmupHeader = req.headers.get("x-warmup-secret");
  if (warmupSecret && warmupHeader === warmupSecret) {
    return new Response(
      JSON.stringify({ warm: true, ts: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const correlationId =
    req.headers.get("x-request-id") ??
    `ahp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const corsHeaders = getCorsHeaders(req);
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "x-request-id": correlationId,
  };

  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: "analytics-hub",
  }, corsHeaders);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization", correlationId }),
        { status: 401, headers },
      );
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired authorization", correlationId }),
        { status: 401, headers },
      );
    }

    const isAdmin = await checkAdminRole(supabaseAdmin, user.id);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required", correlationId }),
        { status: 403, headers },
      );
    }

    const body: ProxyRequest = await req.json();
    const { action, days = 30 } = body;

    log.info("Handling action", { action, userId: user.id, correlationId });

    let result: unknown;

    switch (action) {
      case "champion_stats":
        result = await getChampionStats();
        break;

      case "champion_trends":
        result = await getChampionTrends(Math.min(days, 90));
        break;

      case "mobile_stats":
        result = await getMobileStats();
        break;

      case "mobile_trends":
        result = await getMobileTrends(Math.min(days, 90));
        break;

      case "support_stats":
        result = await getSupportStats();
        break;

      case "ga4_overview":
        result = await getGA4Overview(Math.min(days, 90));
        break;

      case "discover_schema": {
        const project = body.project;
        if (!project) {
          return new Response(
            JSON.stringify({ success: false, error: "project is required (champion | mobile | itsts)" }),
            { status: 400, headers },
          );
        }
        const clientMap: Record<string, { client: SupabaseClient | null; url: string }> = {
          champion: { client: getChampionClient(), url: Deno.env.get("CHAMPION_ENROLL_SUPABASE_URL") || "" },
          mobile: { client: getMobileClient(), url: Deno.env.get("MOBILE_APP_SUPABASE_URL") || "" },
          itsts: { client: getItstsClient(), url: Deno.env.get("ITSTS_SUPABASE_URL") || "" },
        };
        const entry = clientMap[project];
        if (!entry?.client) {
          return new Response(
            JSON.stringify({ success: false, error: `${project} project is not configured` }),
            { status: 503, headers },
          );
        }
        result = await discoverSchema(entry.client, entry.url);
        break;
      }

      case "combined_summary": {
        const [champion, mobile, support, ga4] = await Promise.allSettled([
          getChampionStats(),
          getMobileStats(),
          getSupportStats(),
          getGA4Overview(days),
        ]);

        result = {
          champion_enrollment: champion.status === "fulfilled" ? champion.value : { configured: false },
          mobile_app: mobile.status === "fulfilled" ? mobile.value : { configured: false },
          support: support.status === "fulfilled" ? support.value : { configured: false },
          ga4: ga4.status === "fulfilled" ? ga4.value : { configured: false },
          timestamp: new Date().toISOString(),
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}`, correlationId }),
          { status: 400, headers },
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result as Record<string, unknown>, correlationId }),
      { status: 200, headers },
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error(`Analytics hub error [${correlationId}]: ${errMsg}`);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", correlationId }),
      { status: 500, headers },
    );
  }
});
