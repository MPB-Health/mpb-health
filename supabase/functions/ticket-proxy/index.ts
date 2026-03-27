import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";
import { htmlToPlainPreview, sanitizeTicketHtml } from "../_shared/ticketHtmlSanitize.ts";

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
  | "resign_attachments";

const ADMIN_ACTIONS: ProxyAction[] = ["list_all", "detail_admin", "stats_all", "add_comment", "update_ticket", "create_for_advisor"];
const NO_USER_LOOKUP_ACTIONS: ProxyAction[] = ["get_categories", "resign_attachments"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_COMMENT_LENGTH = 10_000;
/** Rich HTML replies may include long signed URLs for inline images and attachment links */
const MAX_HTML_COMMENT_LENGTH = 120_000;
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
  /** When "html", content is sanitized server-side before insert. Default plain (legacy). */
  content_format?: "plain" | "html";
  is_internal?: boolean;
  /** Storage paths for resign_attachments action */
  storage_paths?: string[];
}

function normalizeContentFormat(raw: unknown): "plain" | "html" {
  return raw === "html" ? "html" : "plain";
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
    // User may already exist in auth but the profile row is missing.
    // Scan the first page of auth users to find them.
    const { data: list } = await itstsAdmin.auth.admin.listUsers({ perPage: 1000 });
    uid = list?.users?.find((u: { email?: string; id: string }) => u.email === email)?.id ?? null;
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

async function getTicketDetail(
  itstsAdmin: ReturnType<typeof createClient>,
  userId: string,
  ticketId: string,
) {
  const { data: ticket, error } = await itstsAdmin
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("requester_id", userId)
    .single();

  if (error) throw error;

  // Fetch comments/replies visible to the requester (not internal notes).
  // Use OR so legacy rows with is_internal NULL still appear (PostgREST: eq.false excludes NULL).
  const { data: comments, error: commentsError } = await itstsAdmin
    .from("ticket_comments")
    .select("id, content:body, is_internal, created_at, author_id, content_format")
    .eq("ticket_id", ticketId)
    .or("is_internal.eq.false,is_internal.is.null")
    .order("created_at", { ascending: true });

  if (commentsError) {
    log.error("ticket_comments fetch failed (advisor detail)", {
      ticketId,
      message: commentsError.message,
    });
    throw new Error(`Failed to load conversation: ${commentsError.message}`);
  }

  // Fetch author names for comments
  const authorIds = [...new Set((comments || []).map((c) => c.author_id).filter(Boolean))];
  let authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await itstsAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    authorMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
  }

  const enrichedComments = (comments || []).map((c: Record<string, unknown>) => ({
    ...c,
    author_name: authorMap[c.author_id as string] || "Support Agent",
    content_format: (c.content_format as string) || "plain",
  }));

  return { ticket, comments: enrichedComments };
}

async function getTicketStats(
  itstsAdmin: ReturnType<typeof createClient>,
  userId: string,
) {
  const statuses = ["new", "open", "pending", "resolved", "closed"] as const;

  const results = await Promise.all(
    statuses.map((status) =>
      itstsAdmin
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("requester_id", userId)
        .eq("status", status)
    ),
  );

  const counts: Record<string, number> = {};
  let total = 0;
  for (let i = 0; i < statuses.length; i++) {
    if (results[i].error) throw results[i].error;
    const c = results[i].count ?? 0;
    counts[statuses[i]] = c;
    total += c;
  }

  return { total, ...counts };
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
  opts: { status?: string; priority?: string; search?: string; page: number; perPage: number },
) {
  let query = itstsAdmin
    .from("tickets")
    .select("id, ticket_number, subject, description, status, priority, category, created_at, updated_at, requester_id", { count: "exact" })
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
  const { data: ticket, error } = await itstsAdmin
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (error) throw error;

  // Requester info
  let requesterName = "Unknown";
  let requesterEmail = "";
  let requesterAgentId: string | null = null;
  let requesterCompany: string | null = null;
  if (ticket.requester_id) {
    const { data: profile } = await itstsAdmin
      .from("profiles")
      .select("full_name, email, agent_id, company_name")
      .eq("id", ticket.requester_id)
      .maybeSingle();
    if (profile) {
      requesterName = profile.full_name;
      requesterEmail = profile.email;
      requesterAgentId = profile.agent_id || null;
      requesterCompany = profile.company_name || null;
    }
  }

  // All comments including internal notes (admin sees everything)
  const { data: comments, error: commentsError } = await itstsAdmin
    .from("ticket_comments")
    .select("id, content:body, is_internal, created_at, author_id, content_format")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    log.error("ticket_comments fetch failed (admin detail)", {
      ticketId,
      message: commentsError.message,
    });
    throw new Error(`Failed to load conversation: ${commentsError.message}`);
  }

  const authorIds = [...new Set((comments || []).map((c: { author_id: string }) => c.author_id).filter(Boolean))];
  let authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await itstsAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    authorMap = Object.fromEntries((profiles || []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));
  }

  const enrichedComments = (comments || []).map((c: Record<string, unknown>) => ({
    ...c,
    author_name: authorMap[c.author_id as string] || "Support Agent",
    content_format: (c.content_format as string) || "plain",
  }));

  return {
    ticket: { ...ticket, requester_name: requesterName, requester_email: requesterEmail, requester_agent_id: requesterAgentId, requester_company: requesterCompany },
    comments: enrichedComments,
  };
}

async function getAllTicketStats(
  itstsAdmin: ReturnType<typeof createClient>,
) {
  const statuses = ["new", "open", "pending", "resolved", "closed"] as const;

  const results = await Promise.all(
    statuses.map((status) =>
      itstsAdmin
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", status)
    ),
  );

  const counts: Record<string, number> = {};
  let total = 0;
  for (let i = 0; i < statuses.length; i++) {
    if (results[i].error) throw results[i].error;
    const c = results[i].count ?? 0;
    counts[statuses[i]] = c;
    total += c;
  }

  return { total, ...counts };
}

async function addComment(
  itstsAdmin: ReturnType<typeof createClient>,
  ticketId: string,
  content: string,
  authorEmail: string,
  authorFullName: string,
  isInternal = false,
  contentFormat: "plain" | "html" = "plain",
) {
  // Find or auto-provision admin's ITSTS profile
  const authorId = await getOrCreateItstsUserId(itstsAdmin, authorEmail, authorFullName);

  const body = contentFormat === "html"
    ? sanitizeTicketHtml(content)
    : content.trim();
  if (!body) throw new Error("Content required");

  const { error: commentError } = await itstsAdmin
    .from("ticket_comments")
    .insert({
      ticket_id: ticketId,
      body,
      author_id: authorId,
      is_internal: isInternal,
      content_format: contentFormat,
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
  opts: { subject: string; description?: string; category?: string; priority?: string; origin?: string; agentId?: string | null; idempotencyKey?: string | null },
) {
  if (!opts.subject?.trim()) throw new Error("Subject is required");

  // Idempotency guard: if the client sent an idempotency key, check for a
  // recent ticket by the same requester with the same key to prevent duplicate
  // inserts caused by client retries or double-clicks.
  if (opts.idempotencyKey) {
    const { data: existing } = await itstsAdmin
      .from("tickets")
      .select("id, ticket_number")
      .eq("requester_id", requesterId)
      .eq("idempotency_key", opts.idempotencyKey)
      .maybeSingle();
    if (existing) {
      log.info("Duplicate create blocked by idempotency key", { key: opts.idempotencyKey, ticket_id: existing.id });
      return { ticket_id: existing.id, ticket_number: existing.ticket_number };
    }
  }

  // Secondary guard: prevent near-identical tickets within a short window.
  // Same requester + same subject within 60 seconds is almost certainly a duplicate.
  const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString();
  const { data: recentDupe } = await itstsAdmin
    .from("tickets")
    .select("id, ticket_number")
    .eq("requester_id", requesterId)
    .eq("subject", opts.subject.trim().slice(0, MAX_SUBJECT_LENGTH))
    .gte("created_at", sixtySecondsAgo)
    .maybeSingle();
  if (recentDupe) {
    log.info("Duplicate create blocked by subject+time window", { ticket_id: recentDupe.id });
    return { ticket_id: recentDupe.id, ticket_number: recentDupe.ticket_number };
  }

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
      ...(opts.idempotencyKey ? { idempotency_key: opts.idempotencyKey } : {}),
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
  contentFormat: "plain" | "html" = "plain",
) {
  // Verify the ticket belongs to this advisor before allowing a reply
  const { data: ticket, error: ticketErr } = await itstsAdmin
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("requester_id", advisorId)
    .maybeSingle();

  if (ticketErr || !ticket) throw new Error("Ticket not found or access denied");

  const body = contentFormat === "html"
    ? sanitizeTicketHtml(content)
    : content.trim();
  if (!body) throw new Error("Content required");

  const { error } = await itstsAdmin
    .from("ticket_comments")
    .insert({
      ticket_id: ticketId,
      body,
      author_id: advisorId,
      is_internal: false,
      content_format: contentFormat,
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
  // Read from the primary project's ticket_categories table (authoritative list)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return { categories: [] };

  const primary = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await primary
    .from("ticket_categories")
    .select("name")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;

  const categories = (data || []).map((r: { name: string }) => r.name);
  return { categories };
}

// ── Email notification (fire-and-forget) ──────────────────────────────────────
function fireNotification(payload: Record<string, unknown>): void {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    log.warn("send-ticket-notification skipped: missing env");
    return;
  }
  fetch(`${supabaseUrl}/functions/v1/send-ticket-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        log.error("send-ticket-notification failed", {
          status: res.status,
          body: body.slice(0, 500),
        });
      }
    })
    .catch((err) => log.error("send-ticket-notification fetch error", { err: String(err) }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // ── Warmup (cron) bypass ──────────────────────────────────────────────────
  // Allows pg_cron to keep the function warm without a user JWT.
  const warmupSecret = Deno.env.get("WARMUP_CRON_SECRET");
  const warmupHeader = req.headers.get("x-warmup-secret");
  if (warmupSecret && warmupHeader === warmupSecret) {
    return new Response(
      JSON.stringify({ warm: true, ts: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Correlation ID ──────────────────────────────────────────────────────
  // Accept x-request-id from the client (TicketService sends one for every
  // call) or generate a fallback. Echoed back in the response so clients can
  // match request ↔ log entry.
  const correlationId =
    req.headers.get("x-request-id") ??
    `sf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

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
  }, corsHeaders);
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
      const READ_STUB_ACTIONS = ["list", "stats", "get_categories", "list_all", "stats_all"];
      if (READ_STUB_ACTIONS.includes(action as string)) {
        const stubs: Record<string, unknown> = {
          list:          { tickets: [], total: 0, page: body.page || 1, per_page: body.per_page || 20 },
          stats:         { total: 0, new: 0, open: 0, pending: 0, resolved: 0, closed: 0 },
          get_categories:{ categories: [] },
          list_all:      { tickets: [], total: 0, page: body.page || 1, per_page: body.per_page || 20 },
          stats_all:     { total: 0, new: 0, open: 0, pending: 0, resolved: 0, closed: 0 },
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
          page: body.page || 1,
          perPage: body.per_page || 20,
        });
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
        const fmt = normalizeContentFormat(body.content_format);
        const raw = body.content ?? "";
        const maxLen = fmt === "html" ? MAX_HTML_COMMENT_LENGTH : MAX_COMMENT_LENGTH;
        if (raw.length > maxLen) {
          return new Response(
            JSON.stringify({ success: false, error: `Content required (max ${maxLen} chars)` }),
            { status: 400, headers },
          );
        }
        if (fmt === "plain" && !raw.trim()) {
          return new Response(
            JSON.stringify({ success: false, error: `Content required (max ${maxLen} chars)` }),
            { status: 400, headers },
          );
        }
        if (fmt === "html" && !sanitizeTicketHtml(raw)) {
          return new Response(
            JSON.stringify({ success: false, error: "Content required" }),
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
        result = await addComment(
          itstsAdmin,
          body.ticket_id,
          raw,
          user.email,
          adminFullName,
          Boolean(body.is_internal),
          fmt,
        );
        // Internal notes are never sent to the advisor — skip notification
        if (!body.is_internal && result._notif?.requester_email) {
          const commentPreview = fmt === "html"
            ? htmlToPlainPreview(sanitizeTicketHtml(raw), 500)
            : raw.slice(0, 500);
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
            comment: commentPreview,
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
          const idempotencyKey = req.headers.get("x-idempotency-key") || null;
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
            idempotencyKey,
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
      case "reply": {
        if (!body.ticket_id || !UUID_RE.test(body.ticket_id)) {
          return new Response(
            JSON.stringify({ success: false, error: "Valid ticket_id required" }),
            { status: 400, headers },
          );
        }
        const fmt = normalizeContentFormat(body.content_format);
        const raw = body.content ?? "";
        const maxLenReply = fmt === "html" ? MAX_HTML_COMMENT_LENGTH : MAX_COMMENT_LENGTH;
        if (raw.length > maxLenReply) {
          return new Response(
            JSON.stringify({ success: false, error: `Content required (max ${maxLenReply} chars)` }),
            { status: 400, headers },
          );
        }
        if (fmt === "plain" && !raw.trim()) {
          return new Response(
            JSON.stringify({ success: false, error: `Content required (max ${maxLenReply} chars)` }),
            { status: 400, headers },
          );
        }
        if (fmt === "html" && !sanitizeTicketHtml(raw)) {
          return new Response(
            JSON.stringify({ success: false, error: "Content required" }),
            { status: 400, headers },
          );
        }
        result = await replyToTicket(itstsAdmin, itstsUserId!, body.ticket_id, raw, fmt);
        const commentPreview = fmt === "html"
          ? htmlToPlainPreview(sanitizeTicketHtml(raw), 500)
          : raw.slice(0, 500);
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
            comment: commentPreview,
          });
        }
        break;
      }
      case "get_categories":
        result = await getCategories(itstsAdmin);
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
            idempotencyKey: req.headers.get("x-idempotency-key") || null,
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
      case "resign_attachments": {
        const paths = body.storage_paths;
        if (!Array.isArray(paths) || paths.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "storage_paths array is required" }),
            { status: 400, headers },
          );
        }
        if (paths.length > 20) {
          return new Response(
            JSON.stringify({ success: false, error: "Maximum 20 paths per request" }),
            { status: 400, headers },
          );
        }
        // Validate paths belong to user (or user is admin/super_admin)
        const primaryUrl = Deno.env.get("SUPABASE_URL")!;
        const primaryServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const primaryAdmin = createClient(primaryUrl, primaryServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const isAdmin = await checkAdminRole(supabaseAdmin, user.id);
        const signed: { path: string; url: string | null; error?: string }[] = [];
        for (const p of paths) {
          if (typeof p !== "string" || (!isAdmin && !p.startsWith(`${user.id}/`))) {
            signed.push({ path: p, url: null, error: "Access denied" });
            continue;
          }
          const { data, error: signErr } = await primaryAdmin.storage
            .from("ticket-attachments")
            .createSignedUrl(p, 60 * 60 * 24 * 365);
          if (signErr || !data?.signedUrl) {
            signed.push({ path: p, url: null, error: signErr?.message || "Failed to sign" });
          } else {
            signed.push({ path: p, url: data.signedUrl });
          }
        }
        result = { signed_urls: signed };
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
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error(`Ticket proxy error [${correlationId}]: ${errMsg}`);
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
