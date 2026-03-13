import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";

const log = createLogger("ticket-proxy");

type ProxyAction =
  | "list"
  | "detail"
  | "stats"
  | "list_all"
  | "detail_admin"
  | "stats_all"
  | "add_comment"
  | "create"
  | "reply"
  | "update_ticket"
  | "get_categories"
  | "create_for_advisor"
  | "list_kb"
  | "list_requesters"
  | "bulk_close";

const ADMIN_ACTIONS: ProxyAction[] = ["list_all", "detail_admin", "stats_all", "add_comment", "update_ticket", "create_for_advisor", "list_requesters", "bulk_close"];
const NO_USER_LOOKUP_ACTIONS: ProxyAction[] = ["get_categories", "list_kb"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_COMMENT_LENGTH = 10_000;
const MAX_SUBJECT_LENGTH = 255;

/** Strip characters that could manipulate PostgREST filter syntax */
function sanitizeSearch(raw: string): string {
  return raw.replace(/[%_*(),."\\]/g, "").trim().slice(0, 200);
}

interface ProxyRequest {
  action: ProxyAction;
  ticket_id?: string;
  subject?: string;
  description?: string;
  category?: string;
  advisor_email?: string;
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  per_page?: number;
  content?: string;
  is_internal?: boolean;
  requester_id?: string;
  sort_by?: string;
  sort_order?: string;
}

function getItstsClient(): ReturnType<typeof createClient> | null {
  const url = Deno.env.get("ITSTS_SUPABASE_URL");
  const key = Deno.env.get("ITSTS_SERVICE_ROLE_KEY");
  if (!url || !key) {
    log.warn("ITSTS_SUPABASE_URL / ITSTS_SERVICE_ROLE_KEY not set — support system not configured");
    return null;
  }
  log.info("Using ITSTS Supabase configuration");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getItstsUserId(itstsAdmin: ReturnType<typeof createClient>, email: string): Promise<string | null> {
  const { data } = await itstsAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data?.id || null;
}

/**
 * Returns the ITSTS profile ID for the given email, creating a staff profile
 * automatically if none exists. This lets admin-portal staff reply to tickets
 * without needing a manual ITSTS account setup.
 */
async function getOrCreateItstsUserId(
  itstsAdmin: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
): Promise<string> {
  // 1. Fast path — profile already exists
  const existing = await getItstsUserId(itstsAdmin, email);
  if (existing) return existing;

  // 2. Try to create a new auth user in the ITSTS instance
  const { data: created, error: createErr } = await itstsAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    // Random password — staff will never log in via ITSTS directly
    password: Array.from(
      (globalThis.crypto ?? crypto).getRandomValues(new Uint8Array(20)),
    ).map((b) => b.toString(16).padStart(2, "0")).join(""),
    user_metadata: { full_name: fullName },
  });

  let uid: string | null = null;

  if (!createErr && created?.user?.id) {
    uid = created.user.id;
  } else {
    // User already exists in auth but the profile row is missing.
    // Use getUserByEmail (O(1) lookup) instead of listUsers(1000) which
    // was scanning all auth users and blocking admin replies.
    try {
      const { data: existingUser } = await itstsAdmin.auth.admin.getUserByEmail(email);
      uid = existingUser?.user?.id ?? null;
    } catch {
      uid = null;
    }
  }

  if (!uid) {
    throw new Error(
      `Unable to provision a support account for ${email}. Please ask an administrator to create the account manually in ITSTS.`,
    );
  }

  // 3. Upsert the profile row (handles both trigger-created and missing rows)
  await itstsAdmin.from("profiles").upsert(
    { id: uid, email, full_name: fullName },
    { onConflict: "id", ignoreDuplicates: false },
  );

  return uid;
}

async function listTickets(
  itstsAdmin: ReturnType<typeof createClient>,
  userId: string,
  opts: { status?: string; priority?: string; search?: string; page: number; perPage: number },
) {
  let query = itstsAdmin
    .from("tickets")
    .select("id, ticket_number, subject, description, status, priority, category, created_at, updated_at", { count: "exact" })
    .eq("requester_id", userId)
    .order("created_at", { ascending: false })
    .range((opts.page - 1) * opts.perPage, opts.page * opts.perPage - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.priority) query = query.eq("priority", opts.priority);
  if (opts.search) {
    const safe = sanitizeSearch(opts.search);
    if (safe) {
      query = query.or(`subject.ilike.%${safe}%,ticket_number.eq.${parseInt(safe) || 0}`);
    }
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { tickets: data || [], total: count || 0, page: opts.page, per_page: opts.perPage };
}

async function listKnowledgeBase(
  itstsAdmin: ReturnType<typeof createClient>,
  opts: { search?: string; category?: string; page: number; perPage: number },
) {
  let query = itstsAdmin
    .from("tickets")
    .select("id, ticket_number, subject, description, status, priority, category, created_at", { count: "exact" })
    .eq("is_imported", true)
    .in("status", ["resolved", "closed"])
    .order("created_at", { ascending: false })
    .range((opts.page - 1) * opts.perPage, opts.page * opts.perPage - 1);

  if (opts.category) query = query.eq("category", opts.category);
  if (opts.search) {
    const safe = opts.search.replace(/[%_\\]/g, "").slice(0, 100);
    if (safe) {
      query = query.or(`subject.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { tickets: data || [], total: count || 0, page: opts.page, per_page: opts.perPage };
}

async function getTicketDetail(
  itstsAdmin: ReturnType<typeof createClient>,
  userId: string,
  ticketId: string,
) {
  // Fetch ticket + comments in parallel (was sequential — saves ~50-100ms)
  const [ticketResult, commentsResult] = await Promise.all([
    itstsAdmin.from("tickets").select("*").eq("id", ticketId).eq("requester_id", userId).single(),
    itstsAdmin.from("ticket_comments").select("id, body, is_internal, created_at, author_id").eq("ticket_id", ticketId).eq("is_internal", false).order("created_at", { ascending: true }),
  ]);

  if (ticketResult.error) throw ticketResult.error;
  const ticket = ticketResult.data;
  const comments = commentsResult.data || [];

  // Fetch author names for comments
  const authorIds = [...new Set(comments.map((c) => c.author_id).filter(Boolean))];
  let authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await itstsAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    authorMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
  }

  const enrichedComments = comments.map((c) => ({
    id: c.id,
    content: c.body,
    is_internal: c.is_internal,
    created_at: c.created_at,
    author_id: c.author_id,
    author_name: authorMap[c.author_id] || "Support Agent",
  }));

  return { ticket, comments: enrichedComments };
}

async function getTicketStats(
  itstsAdmin: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: tickets, error } = await itstsAdmin
    .from("tickets")
    .select("status")
    .eq("requester_id", userId);

  if (error) throw error;

  const stats = {
    total: tickets?.length || 0,
    new: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
  };

  for (const t of tickets || []) {
    const s = t.status as keyof typeof stats;
    if (s in stats) stats[s]++;
  }

  return stats;
}

// ── Admin helpers ──────────────────────────────────────────────────────────

async function checkAdminRole(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data || []).map((r: { role: string }) => r.role);
  return roles.includes("admin") || roles.includes("super_admin");
}

async function listAllTickets(
  itstsAdmin: ReturnType<typeof createClient>,
  opts: { status?: string; priority?: string; search?: string; requester_id?: string; sort_by?: string; sort_order?: string; page: number; perPage: number },
) {
  const sortColumn = ["created_at", "updated_at", "ticket_number", "priority", "status"].includes(opts.sort_by || "")
    ? opts.sort_by!
    : "created_at";
  const ascending = opts.sort_order === "asc";

  let query = itstsAdmin
    .from("tickets")
    .select("id, ticket_number, subject, description, status, priority, category, created_at, updated_at, requester_id", { count: "exact" })
    .order(sortColumn, { ascending })
    .range((opts.page - 1) * opts.perPage, opts.page * opts.perPage - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.priority) query = query.eq("priority", opts.priority);
  if (opts.requester_id) query = query.eq("requester_id", opts.requester_id);
  if (opts.search) {
    const safe = sanitizeSearch(opts.search);
    if (safe) {
      query = query.or(`subject.ilike.%${safe}%,ticket_number.eq.${parseInt(safe) || 0}`);
    }
  }

  const { data: tickets, count, error } = await query;
  if (error) throw error;

  // Enrich with requester info
  const requesterIds = [...new Set((tickets || []).map((t: { requester_id: string }) => t.requester_id).filter(Boolean))];
  let requesterMap: Record<string, { full_name: string; email: string }> = {};
  if (requesterIds.length > 0) {
    const { data: profiles } = await itstsAdmin
      .from("profiles")
      .select("id, full_name, email, agent_id, company_name")
      .in("id", requesterIds);
    requesterMap = Object.fromEntries(
      (profiles || []).map((p: { id: string; full_name: string; email: string; agent_id?: string; company_name?: string }) => [
        p.id,
        { full_name: p.full_name, email: p.email, agent_id: p.agent_id || null, company_name: p.company_name || null },
      ]),
    );
  }

  const enriched = (tickets || []).map((t: Record<string, unknown>) => ({
    ...t,
    requester_name: (requesterMap[t.requester_id as string]?.full_name) || "Unknown",
    requester_email: (requesterMap[t.requester_id as string]?.email) || "",
    requester_agent_id: (requesterMap[t.requester_id as string]?.agent_id) ?? null,
    requester_company: (requesterMap[t.requester_id as string]?.company_name) ?? null,
  }));

  return { tickets: enriched, total: count || 0, page: opts.page, per_page: opts.perPage };
}

async function getTicketDetailAdmin(
  itstsAdmin: ReturnType<typeof createClient>,
  ticketId: string,
) {
  // Fetch ticket + comments in parallel (was 4 sequential queries — saves ~150-300ms)
  const [ticketResult, commentsResult] = await Promise.all([
    itstsAdmin.from("tickets").select("*").eq("id", ticketId).single(),
    itstsAdmin.from("ticket_comments").select("id, body, is_internal, created_at, author_id").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
  ]);

  if (ticketResult.error) throw ticketResult.error;
  const ticket = ticketResult.data;
  const comments = commentsResult.data || [];

  // Fetch requester profile + comment author profiles in parallel
  const authorIds = [...new Set(comments.map((c: { author_id: string }) => c.author_id).filter(Boolean))];

  const [requesterResult, authorResult] = await Promise.all([
    ticket.requester_id
      ? itstsAdmin.from("profiles").select("full_name, email, agent_id, company_name").eq("id", ticket.requester_id).maybeSingle()
      : Promise.resolve({ data: null }),
    authorIds.length > 0
      ? itstsAdmin.from("profiles").select("id, full_name").in("id", authorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profile = requesterResult.data;
  const requesterName = profile?.full_name || "Unknown";
  const requesterEmail = profile?.email || "";
  const requesterAgentId = profile?.agent_id || null;
  const requesterCompany = profile?.company_name || null;

  const authorMap: Record<string, string> = Object.fromEntries(
    ((authorResult.data as { id: string; full_name: string }[]) || []).map((p) => [p.id, p.full_name]),
  );

  const enrichedComments = comments.map((c: Record<string, unknown>) => ({
    id: c.id,
    content: c.body,
    is_internal: c.is_internal,
    created_at: c.created_at,
    author_id: c.author_id,
    author_name: authorMap[c.author_id as string] || "Support Agent",
  }));

  return {
    ticket: { ...ticket, requester_name: requesterName, requester_email: requesterEmail, requester_agent_id: requesterAgentId, requester_company: requesterCompany },
    comments: enrichedComments,
  };
}

async function getAllTicketStats(
  itstsAdmin: ReturnType<typeof createClient>,
) {
  const { data: tickets, error } = await itstsAdmin
    .from("tickets")
    .select("status");

  if (error) throw error;

  const stats = { total: tickets?.length || 0, new: 0, open: 0, pending: 0, resolved: 0, closed: 0 };
  for (const t of tickets || []) {
    const s = t.status as keyof typeof stats;
    if (s in stats) stats[s]++;
  }
  return stats;
}

async function addComment(
  itstsAdmin: ReturnType<typeof createClient>,
  ticketId: string,
  content: string,
  authorEmail: string,
  authorFullName: string,
  isInternal = false,
) {
  // Find or auto-provision admin's ITSTS profile
  const authorId = await getOrCreateItstsUserId(itstsAdmin, authorEmail, authorFullName);

  const { error: commentError } = await itstsAdmin
    .from("ticket_comments")
    .insert({
      ticket_id: ticketId,
      body: content,
      author_id: authorId,
      is_internal: isInternal,
    });

  if (commentError) throw commentError;

  // Touch ticket updated_at
  await itstsAdmin
    .from("tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  // Fetch requester info so ticket-proxy can fire a notification
  const { data: ticketMeta } = await itstsAdmin
    .from("tickets")
    .select("requester_id, ticket_number, subject, priority, status")
    .eq("id", ticketId)
    .maybeSingle();
  let notifEmail: string | null = null;
  let notifName = "Advisor";
  if (ticketMeta?.requester_id) {
    const { data: rp } = await itstsAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", ticketMeta.requester_id)
      .maybeSingle();
    notifEmail = rp?.email || null;
    notifName = rp?.full_name || "Advisor";
  }

  return {
    ok: true,
    _notif: {
      requester_email: notifEmail,
      requester_name: notifName,
      ticket_number: ticketMeta?.ticket_number,
      subject: ticketMeta?.subject,
      priority: ticketMeta?.priority,
      status: ticketMeta?.status,
    },
  };
}

async function createTicket(
  itstsAdmin: ReturnType<typeof createClient>,
  requesterId: string,
  opts: { subject: string; description?: string; category?: string; priority?: string; origin?: string; agentId?: string | null },
) {
  if (!opts.subject?.trim()) throw new Error("Subject is required");
  const { data, error } = await itstsAdmin
    .from("tickets")
    .insert({
      subject: opts.subject.trim().slice(0, MAX_SUBJECT_LENGTH),
      description: opts.description?.trim() || null,
      category: opts.category?.trim() || null,
      priority: opts.priority || "medium",
      status: "new",
      requester_id: requesterId,
      origin: (opts.origin ?? "advisor") as "member" | "advisor" | "staff" | "concierge",
      ...(opts.agentId ? { agent_id: opts.agentId } : {}),
    })
    .select("id, ticket_number")
    .single();

  if (error) throw error;
  return { ticket_id: data.id, ticket_number: data.ticket_number };
}

async function replyToTicket(
  itstsAdmin: ReturnType<typeof createClient>,
  advisorId: string,
  ticketId: string,
  content: string,
) {
  // Verify the ticket belongs to this advisor before allowing a reply
  const { data: ticket, error: ticketErr } = await itstsAdmin
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("requester_id", advisorId)
    .maybeSingle();

  if (ticketErr || !ticket) throw new Error("Ticket not found or access denied");

  const { error } = await itstsAdmin
    .from("ticket_comments")
    .insert({
      ticket_id: ticketId,
      body: content.trim(),
      author_id: advisorId,
      is_internal: false,
    });

  if (error) throw error;

  await itstsAdmin
    .from("tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  return { ok: true };
}

async function updateTicket(
  itstsAdmin: ReturnType<typeof createClient>,
  ticketId: string,
  opts: { status?: string; priority?: string },
) {
  if (!opts.status && !opts.priority) throw new Error("At least one of status or priority is required");

  // Fetch current state before updating (captures old status/priority + requester for notification)
  const { data: existing } = await itstsAdmin
    .from("tickets")
    .select("status, priority, requester_id, ticket_number, subject")
    .eq("id", ticketId)
    .maybeSingle();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (opts.status) updates.status = opts.status;
  if (opts.priority) updates.priority = opts.priority;

  const { error } = await itstsAdmin
    .from("tickets")
    .update(updates)
    .eq("id", ticketId);

  if (error) throw error;

  // Fetch requester for notification
  let notifEmail: string | null = null;
  let notifName = "Advisor";
  if (existing?.requester_id) {
    const { data: rp } = await itstsAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", existing.requester_id)
      .maybeSingle();
    notifEmail = rp?.email || null;
    notifName = rp?.full_name || "Advisor";
  }

  return {
    ok: true,
    _notif: {
      old_status: existing?.status || null,
      old_priority: existing?.priority || null,
      requester_email: notifEmail,
      requester_name: notifName,
      ticket_number: existing?.ticket_number,
      subject: existing?.subject,
    },
  };
}

async function getCategories(_itstsAdmin: ReturnType<typeof createClient>) {
  // Read from the advisor-portal ticket_categories table (dtmnkzllidaiqyheguhl)
  // so categories are managed centrally, not derived from free-text ticket data.
  const primaryUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const primary = createClient(primaryUrl, serviceKey);

  const { data, error } = await primary
    .from("ticket_categories")
    .select("name")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;

  const categories = (data || []).map((r: { name: string }) => r.name);
  return { categories };
}

async function listRequesters(
  itstsAdmin: ReturnType<typeof createClient>,
) {
  // Get distinct requester_ids from tickets, then look up their profiles
  const { data: tickets, error } = await itstsAdmin
    .from("tickets")
    .select("requester_id");
  if (error) throw error;

  const uniqueIds = [...new Set((tickets || []).map((t: { requester_id: string }) => t.requester_id).filter(Boolean))];
  if (uniqueIds.length === 0) return { requesters: [] };

  const { data: profiles, error: profileErr } = await itstsAdmin
    .from("profiles")
    .select("id, full_name, email, agent_id")
    .in("id", uniqueIds)
    .order("full_name", { ascending: true });
  if (profileErr) throw profileErr;

  return {
    requesters: (profiles || []).map((p: { id: string; full_name: string; email: string; agent_id?: string }) => ({
      id: p.id,
      name: p.full_name || p.email,
      email: p.email,
      agent_id: p.agent_id || null,
    })),
  };
}

async function bulkCloseAll(
  itstsAdmin: ReturnType<typeof createClient>,
) {
  const { count, error } = await itstsAdmin
    .from("tickets")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .neq("status", "closed")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return { closed_count: count || 0 };
}

// ── Email notification (fire-and-forget with timeout) ─────────────────────────
function fireNotification(payload: Record<string, unknown>): void {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10s timeout
  fetch(`${supabaseUrl}/functions/v1/send-ticket-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).catch(() => { /* fire-and-forget — never block the response */ })
    .finally(() => clearTimeout(timeoutId));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // ── Correlation ID ──────────────────────────────────────────────────────
  // Accept x-request-id from the client (TicketService sends one for every
  // call) or generate a fallback. Echoed back in the response so clients can
  // match request ↔ log entry.
  // Sanitize client-provided correlation ID to prevent log injection
  const rawRequestId = req.headers.get("x-request-id");
  const correlationId = rawRequestId
    ? rawRequestId.replace(/[^a-zA-Z0-9\-_.:]/g, "").slice(0, 128)
    : `sf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const corsHeaders = getCorsHeaders(req);
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "x-request-id": correlationId,
  };

  // Rate limit: proxy endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 60,
    windowSeconds: 60,
    keyPrefix: 'ticket-proxy',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Verify caller from monorepo
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      log.warn("Missing or malformed Authorization header", { correlationId });
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization", correlationId }),
        { status: 401, headers },
      );
    }

    const token = authHeader.slice(7); // strip "Bearer " prefix
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user?.email) {
      log.warn("JWT verification failed", { correlationId, error: authError?.message });
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired authorization", correlationId }),
        { status: 401, headers },
      );
    }

    const body: ProxyRequest = await req.json();
    const { action } = body;

    // ── Health-check ping (no DB access required) ────────────────────────
    if ((action as string) === "ping") {
      return new Response(
        JSON.stringify({ success: true, pong: true, userId: user.id, correlationId }),
        { status: 200, headers },
      );
    }

    log.info("Handling action", { action, userId: user.id, correlationId });

    const itstsAdmin = getItstsClient();

    // ── ITSTS not configured → return graceful stubs for read actions ──────
    if (!itstsAdmin) {
      const READ_STUB_ACTIONS = ["list", "stats", "get_categories", "list_all", "stats_all", "list_kb", "list_requesters", "bulk_close"];
      if (READ_STUB_ACTIONS.includes(action as string)) {
        const stubs: Record<string, unknown> = {
          list:             { tickets: [], total: 0, page: body.page || 1, per_page: body.per_page || 20 },
          stats:            { total: 0, new: 0, open: 0, pending: 0, resolved: 0, closed: 0 },
          get_categories:   { categories: [] },
          list_all:         { tickets: [], total: 0, page: body.page || 1, per_page: body.per_page || 20 },
          stats_all:        { total: 0, new: 0, open: 0, pending: 0, resolved: 0, closed: 0 },
          list_kb:          { tickets: [], total: 0, page: body.page || 1, per_page: body.per_page || 20 },
          list_requesters:  { requesters: [] },
          bulk_close:       { closed_count: 0 },
        };
        return new Response(
          JSON.stringify({ success: true, ...(stubs[action as string] ?? {}), correlationId }),
          { status: 200, headers },
        );
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: "Support system is not yet configured. Please contact an administrator.",
          correlationId,
        }),
        { status: 503, headers },
      );
    }

    // Admin actions require role check against monorepo user_roles
    if (ADMIN_ACTIONS.includes(action)) {
      const isAdmin = await checkAdminRole(supabaseAdmin, user.id);
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ success: false, error: "Admin access required" }),
          { status: 403, headers },
        );
      }
    }

    // Non-admin actions need the user's ITSTS profile (except category lookup)
    let itstsUserId: string | null = null;
    if (!ADMIN_ACTIONS.includes(action) && !NO_USER_LOOKUP_ACTIONS.includes(action)) {
      itstsUserId = await getItstsUserId(itstsAdmin, user.email);
      if (!itstsUserId) {
        // For read-only actions, return empty results instead of blocking
        if (action === "list") {
          return new Response(
            JSON.stringify({ success: true, tickets: [], total: 0, page: 1, per_page: body.per_page || 20 }),
            { status: 200, headers },
          );
        }
        if (action === "stats") {
          return new Response(
            JSON.stringify({ success: true, total: 0, new: 0, open: 0, pending: 0, resolved: 0, closed: 0 }),
            { status: 200, headers },
          );
        }
        // For detail/write actions the user must exist in ITSTS
        return new Response(
          JSON.stringify({ success: false, error: "Support account not found. Your account has not been synced to the support system yet." }),
          { status: 404, headers },
        );
      }
    }

    let result;
    switch (action) {
      case "list":
        result = await listTickets(itstsAdmin, itstsUserId!, {
          status: body.status,
          priority: body.priority,
          search: body.search,
          page: body.page || 1,
          perPage: body.per_page || 20,
        });
        break;
      case "detail":
        if (!body.ticket_id || !UUID_RE.test(body.ticket_id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Valid ticket_id required" }),
            { status: 400, headers },
          );
        }
        result = await getTicketDetail(itstsAdmin, itstsUserId!, body.ticket_id);
        break;
      case "stats":
        result = await getTicketStats(itstsAdmin, itstsUserId!);
        break;

      // ── Admin actions ──
      case "list_all":
        result = await listAllTickets(itstsAdmin, {
          status: body.status,
          priority: body.priority,
          search: body.search,
          requester_id: body.requester_id,
          sort_by: body.sort_by,
          sort_order: body.sort_order,
          page: body.page || 1,
          perPage: body.per_page || 20,
        });
        break;
      case "list_requesters":
        result = await listRequesters(itstsAdmin);
        break;
      case "bulk_close":
        result = await bulkCloseAll(itstsAdmin);
        break;
      case "detail_admin":
        if (!body.ticket_id || !UUID_RE.test(body.ticket_id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Valid ticket_id required" }),
            { status: 400, headers },
          );
        }
        result = await getTicketDetailAdmin(itstsAdmin, body.ticket_id);
        break;
      case "stats_all":
        result = await getAllTicketStats(itstsAdmin);
        break;
      case "add_comment": {
        if (!body.ticket_id || !UUID_RE.test(body.ticket_id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Valid ticket_id required" }),
            { status: 400, headers },
          );
        }
        if (!body.content || body.content.trim().length === 0 || body.content.length > MAX_COMMENT_LENGTH) {
          return new Response(
            JSON.stringify({ success: false, error: `Content required (max ${MAX_COMMENT_LENGTH} chars)` }),
            { status: 400, headers },
          );
        }
        // Resolve admin's display name for auto-provisioning their ITSTS profile
        const { data: adminRow } = await supabaseAdmin
          .from("admin_users")
          .select("first_name, last_name")
          .eq("email", user.email)
          .maybeSingle();
        const adminFullName = adminRow
          ? `${adminRow.first_name} ${adminRow.last_name}`.trim()
          : user.email;
        result = await addComment(itstsAdmin, body.ticket_id, body.content.trim(), user.email, adminFullName, Boolean(body.is_internal));
        // Internal notes are never sent to the advisor — skip notification
        if (!body.is_internal && result._notif?.requester_email) {
          fireNotification({
            event: "staff_replied",
            ticket_id: body.ticket_id!,
            ticket_number: result._notif.ticket_number,
            subject: result._notif.subject,
            priority: result._notif.priority,
            status: result._notif.status,
            advisor_email: result._notif.requester_email,
            advisor_name: result._notif.requester_name,
            agent_id: null,
            company_name: null,
            comment: body.content?.slice(0, 500),
            actor_name: user.email,
          });
        }
        break;
      }

      // ── Advisor write actions ──
      case "create":
        if (!body.subject?.trim()) {
          return new Response(
            JSON.stringify({ success: false, error: "Subject is required" }),
            { status: 400, headers },
          );
        }
        {
          // Fetch advisor profile first to tag ticket with correct origin + agent_id
          const { data: ap } = await itstsAdmin
            .from("profiles")
            .select("full_name, agent_id, company_name")
            .eq("id", itstsUserId!)
            .maybeSingle();
          result = await createTicket(itstsAdmin, itstsUserId!, {
            subject: body.subject,
            description: body.description,
            category: body.category,
            priority: body.priority,
            origin: "advisor",
            agentId: ap?.agent_id || null,
          });
          fireNotification({
            event: "created",
            ticket_id: result.ticket_id,
            ticket_number: result.ticket_number,
            subject: body.subject,
            priority: body.priority || "medium",
            status: "new",
            category: body.category || null,
            advisor_email: user.email,
            advisor_name: ap?.full_name || user.email,
            agent_id: ap?.agent_id || null,
            company_name: ap?.company_name || null,
          });
        }
        break;
      case "reply":
        if (!body.ticket_id || !UUID_RE.test(body.ticket_id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Valid ticket_id required" }),
            { status: 400, headers },
          );
        }
        if (!body.content || body.content.trim().length === 0 || body.content.length > MAX_COMMENT_LENGTH) {
          return new Response(
            JSON.stringify({ success: false, error: `Content required (max ${MAX_COMMENT_LENGTH} chars)` }),
            { status: 400, headers },
          );
        }
        result = await replyToTicket(itstsAdmin, itstsUserId!, body.ticket_id, body.content);
        {
          const [{ data: rTicket }, { data: rAp }] = await Promise.all([
            itstsAdmin.from("tickets").select("ticket_number, subject, priority, status").eq("id", body.ticket_id!).maybeSingle(),
            itstsAdmin.from("profiles").select("full_name, agent_id, company_name").eq("id", itstsUserId!).maybeSingle(),
          ]);
          fireNotification({
            event: "advisor_replied",
            ticket_id: body.ticket_id!,
            ticket_number: rTicket?.ticket_number,
            subject: rTicket?.subject,
            priority: rTicket?.priority,
            status: rTicket?.status,
            advisor_email: user.email,
            advisor_name: rAp?.full_name || user.email,
            agent_id: rAp?.agent_id || null,
            company_name: rAp?.company_name || null,
            comment: body.content?.slice(0, 500),
          });
        }
        break;
      case "get_categories":
        result = await getCategories(itstsAdmin);
        break;
      case "list_kb":
        result = await listKnowledgeBase(itstsAdmin, {
          search: body.search,
          category: body.category,
          page: body.page || 1,
          perPage: body.per_page || 20,
        });
        break;

      // ── Admin write actions ──
      case "update_ticket":
        if (!body.ticket_id || !UUID_RE.test(body.ticket_id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Valid ticket_id required" }),
            { status: 400, headers },
          );
        }
        result = await updateTicket(itstsAdmin, body.ticket_id, {
          status: body.status,
          priority: body.priority,
        });
        if (result._notif?.requester_email) {
          fireNotification({
            event: "status_changed",
            ticket_id: body.ticket_id!,
            ticket_number: result._notif.ticket_number,
            subject: result._notif.subject,
            advisor_email: result._notif.requester_email,
            advisor_name: result._notif.requester_name,
            agent_id: null,
            company_name: null,
            old_status: result._notif.old_status,
            new_status: body.status || null,
            old_priority: result._notif.old_priority,
            new_priority: body.priority || null,
            actor_name: user.email,
          });
        }
        break;
      case "create_for_advisor": {
        if (!body.advisor_email) {
          return new Response(
            JSON.stringify({ success: false, error: "advisor_email is required" }),
            { status: 400, headers },
          );
        }
        if (!body.subject?.trim()) {
          return new Response(
            JSON.stringify({ success: false, error: "Subject is required" }),
            { status: 400, headers },
          );
        }
        const advisorId = await getItstsUserId(itstsAdmin, body.advisor_email);
        if (!advisorId) {
          return new Response(
            JSON.stringify({ success: false, error: `No support account found for ${body.advisor_email}` }),
            { status: 404, headers },
          );
        }
        {
          const { data: caAp } = await itstsAdmin
            .from("profiles")
            .select("full_name, agent_id, company_name")
            .eq("id", advisorId)
            .maybeSingle();
          result = await createTicket(itstsAdmin, advisorId, {
            subject: body.subject,
            description: body.description,
            category: body.category,
            priority: body.priority,
            origin: "staff",
            agentId: caAp?.agent_id || null,
          });
          fireNotification({
            event: "created_for_advisor",
            ticket_id: result.ticket_id,
            ticket_number: result.ticket_number,
            subject: body.subject!,
            priority: body.priority || "medium",
            status: "new",
            category: body.category || null,
            advisor_email: body.advisor_email!,
            advisor_name: caAp?.full_name || body.advisor_email!,
            agent_id: caAp?.agent_id || null,
            company_name: caAp?.company_name || null,
            actor_name: user.email,
          });
        }
        break;
      }
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers },
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result, correlationId }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Ticket proxy error", { correlationId, error });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        correlationId,
      }),
      { status: 500, headers },
    );
  }
});
