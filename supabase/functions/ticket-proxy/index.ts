import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("ticket-proxy");

type ProxyAction = "list" | "detail" | "stats";

interface ProxyRequest {
  action: ProxyAction;
  ticket_id?: string;
  status?: string;
  priority?: string;
  page?: number;
  per_page?: number;
}

function getItstsClient() {
  const url = Deno.env.get("ITSTS_SUPABASE_URL");
  const key = Deno.env.get("ITSTS_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("ITSTS not configured");
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

async function listTickets(
  itstsAdmin: ReturnType<typeof createClient>,
  userId: string,
  opts: { status?: string; priority?: string; page: number; perPage: number },
) {
  let query = itstsAdmin
    .from("tickets")
    .select("id, ticket_number, subject, description, status, priority, category, created_at, updated_at", { count: "exact" })
    .eq("requester_id", userId)
    .order("created_at", { ascending: false })
    .range((opts.page - 1) * opts.perPage, opts.page * opts.perPage - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.priority) query = query.eq("priority", opts.priority);

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

  // Fetch comments/replies for this ticket
  const { data: comments } = await itstsAdmin
    .from("ticket_comments")
    .select("id, content, is_internal, created_at, author_id")
    .eq("ticket_id", ticketId)
    .eq("is_internal", false)
    .order("created_at", { ascending: true });

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

  const enrichedComments = (comments || []).map((c) => ({
    ...c,
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    // Verify caller from monorepo
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers },
      );
    }

    const body: ProxyRequest = await req.json();
    const { action } = body;

    const itstsAdmin = getItstsClient();

    // Find the user's ITSTS profile
    const itstsUserId = await getItstsUserId(itstsAdmin, user.email);
    if (!itstsUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "Support account not found" }),
        { status: 404, headers },
      );
    }

    let result;
    switch (action) {
      case "list":
        result = await listTickets(itstsAdmin, itstsUserId, {
          status: body.status,
          priority: body.priority,
          page: body.page || 1,
          perPage: body.per_page || 20,
        });
        break;
      case "detail":
        if (!body.ticket_id) {
          return new Response(
            JSON.stringify({ success: false, error: "ticket_id required" }),
            { status: 400, headers },
          );
        }
        result = await getTicketDetail(itstsAdmin, itstsUserId, body.ticket_id);
        break;
      case "stats":
        result = await getTicketStats(itstsAdmin, itstsUserId);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers },
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers },
    );
  } catch (error) {
    log.error("Ticket proxy error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers },
    );
  }
});
