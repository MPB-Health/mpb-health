import { supabase } from '@mpbhealth/database';

/**
 * How many seconds before the JWT's `exp` claim we force a synchronous
 * refresh. 30 s covers typical network RTT to Supabase edge functions on
 * slow connections, so the token never expires while the HTTP request is
 * in-flight.
 *
 * Background: `getSession()` auto-refresh is ASYNCHRONOUS — it fires a
 * background refresh when the token is within 60 s of expiry but returns
 * the CURRENT (soon-to-expire) token immediately. With `noOpLock` bypassing
 * the Web Locks API, concurrent refresh attempts can race and one leg ends
 * up with a stale token. A 30-second synchronous buffer eliminates both
 * problems: we get a guaranteed-fresh token before building the auth header.
 */
const TOKEN_EXPIRY_BUFFER_SECONDS = 30;

/**
 * Ensure the current session has a non-expired access token before calling
 * an Edge Function. Returns null when there is no session (user is not
 * authenticated).
 */
async function getResolvedAuthHeader(): Promise<{ Authorization: string } | null> {
  // getSession() will attempt a background refresh when the token is within
  // 60 s of expiry, but returns the CURRENT token without awaiting the refresh.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  // Force a SYNCHRONOUS refresh if the token has already expired OR expires
  // within the next TOKEN_EXPIRY_BUFFER_SECONDS seconds. This guarantees the
  // token won't expire mid-flight on slow connections or under load.
  const nowSec = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at < nowSec + TOKEN_EXPIRY_BUFFER_SECONDS) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      // Refresh failed — session is invalid. Return null to trigger re-auth
      // in the caller rather than firing a request with a bad token.
      return null;
    }
    return { Authorization: `Bearer ${refreshed.session.access_token}` };
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Generate a short random correlation ID for request tracing.
 * Appears in Edge Function logs and can be surfaced to users/ops.
 */
function newCorrelationId(): string {
  return `tid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Extract the real error message from a Supabase Functions error.
 * The SDK wraps non-2xx responses in a generic "Edge Function returned a non-2xx status code"
 * but the actual response body (with the real error) is accessible via context.json().
 */
async function extractFunctionError(error: unknown): Promise<string> {
  // Check if error has a context property (FunctionsHttpError stores the raw Response in .context)
  if (error && typeof error === 'object' && 'context' in error) {
    try {
      const ctx = (error as Record<string, unknown>).context;
      if (ctx && typeof ctx === 'object' && 'json' in ctx && typeof (ctx as any).json === 'function') {
        const body = await (ctx as any).json();
        if (body?.error) return body.error;
      }
    } catch {
      // context already consumed or not JSON
    }
  }
  return error instanceof Error ? error.message : 'Unknown error';
}

export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author_id: string;
  author_name: string;
}

export interface TicketDetail {
  ticket: Ticket;
  comments: TicketComment[];
}

export interface TicketStats {
  total: number;
  new: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
}

export interface TicketListResult {
  tickets: Ticket[];
  total: number;
  page: number;
  per_page: number;
}

export interface ListTicketsOptions {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface AdminTicket extends Ticket {
  requester_name: string;
  requester_email: string;
  requester_agent_id?: string | null;
  requester_company?: string | null;
}

export interface AdminTicketDetail {
  ticket: Ticket & { requester_name: string; requester_email: string; requester_agent_id?: string | null; requester_company?: string | null };
  comments: TicketComment[];
}

export interface AdminTicketListResult {
  tickets: AdminTicket[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminListTicketsOptions extends ListTicketsOptions {
  search?: string;
}

export interface CreateTicketOptions {
  subject: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
}

export interface CreateTicketResult {
  ticket_id: string;
  ticket_number: number;
}

export interface UpdateTicketOptions {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export class TicketService {
  /**
   * Central invocation wrapper for all ticket-proxy calls.
   *
   * Responsibilities:
   *  - Resolves a guaranteed-fresh auth token (30 s expiry buffer).
   *  - Generates a per-request correlation ID (`x-request-id`) so every
   *    call can be traced in Supabase Edge Function logs.
   *  - Normalises error handling: 401/auth errors trigger re-auth messages;
   *    all errors include the correlation ID for operators to cross-reference.
   *
   * @param action  The ProxyAction string (must match the function's switch).
   * @param body    Additional fields merged into the request body.
   * @param opts    Optional overrides — `allowUnauthenticated` skips the auth
   *                guard and returns null instead of throwing.
   */
  private async call<T extends { success: boolean }>(
    action: string,
    body: Record<string, unknown> = {},
    opts: { allowUnauthenticated?: boolean } = {},
  ): Promise<T> {
    const authHeader = await getResolvedAuthHeader();
    const correlationId = newCorrelationId();

    if (!authHeader) {
      if (opts.allowUnauthenticated) return null as unknown as T;
      throw new Error(`Authentication required — please sign in again [${correlationId}]`);
    }

    const { data, error } = await supabase.functions.invoke<T>('ticket-proxy', {
      body: { action, ...body },
      headers: {
        ...authHeader,
        'x-request-id': correlationId,
      },
    });

    if (error) {
      const msg = await extractFunctionError(error);
      const isAuthError = /authorization|unauthorized|auth/i.test(msg);
      if (isAuthError) {
        throw new Error(`Authentication expired — please sign in again [${correlationId}]`);
      }
      throw new Error(`${msg} [${correlationId}]`);
    }

    if (!data?.success) {
      const errMsg = (data as Record<string, unknown>)?.error as string | undefined;
      throw new Error(`${errMsg ?? 'Request failed'} [${correlationId}]`);
    }

    return data;
  }

  // ── Advisor read methods ───────────────────────────────────────────────

  async getMyTickets(opts: ListTicketsOptions = {}): Promise<TicketListResult> {
    // Unauthenticated → return empty list; no noisy 401 in console.
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required — please sign in again');
      return { tickets: [], total: 0, page: opts.page ?? 1, per_page: opts.perPage ?? 20 };
    }

    const data = await this.call<TicketListResult & { success: boolean }>('list', {
      status: opts.status,
      priority: opts.priority,
      search: opts.search,
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 20,
    });

    return { tickets: data.tickets, total: data.total, page: data.page, per_page: data.per_page };
  }

  async getTicketDetail(ticketId: string): Promise<TicketDetail> {
    const data = await this.call<TicketDetail & { success: boolean }>('detail', { ticket_id: ticketId });
    return { ticket: data.ticket, comments: data.comments };
  }

  async getTicketStats(): Promise<TicketStats> {
    // Unauthenticated → return zeros silently.
    const data = await this.call<TicketStats & { success: boolean }>('stats', {}, { allowUnauthenticated: true });
    if (!data) return { total: 0, new: 0, open: 0, pending: 0, resolved: 0, closed: 0 };
    return { total: data.total, new: data.new, open: data.open, pending: data.pending, resolved: data.resolved, closed: data.closed };
  }

  async getCategories(): Promise<string[]> {
    // Best-effort — return empty array on any failure.
    try {
      const data = await this.call<{ success: boolean; categories: string[] }>('get_categories', {}, { allowUnauthenticated: true });
      return data?.categories ?? [];
    } catch {
      return [];
    }
  }

  // ── Advisor write methods ──────────────────────────────────────────────

  async createTicket(opts: CreateTicketOptions): Promise<CreateTicketResult> {
    const data = await this.call<CreateTicketResult & { success: boolean }>('create', {
      subject: opts.subject,
      description: opts.description,
      category: opts.category,
      priority: opts.priority,
    });
    return { ticket_id: data.ticket_id, ticket_number: data.ticket_number };
  }

  async replyToTicket(ticketId: string, content: string): Promise<void> {
    await this.call<{ success: boolean }>('reply', { ticket_id: ticketId, content });
  }

  // ── Admin read methods ─────────────────────────────────────────────────

  async getAllTickets(opts: AdminListTicketsOptions = {}): Promise<AdminTicketListResult> {
    const data = await this.call<AdminTicketListResult & { success: boolean }>('list_all', {
      status: opts.status,
      priority: opts.priority,
      search: opts.search,
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 20,
    });
    return { tickets: data.tickets, total: data.total, page: data.page, per_page: data.per_page };
  }

  async getTicketDetailAdmin(ticketId: string): Promise<AdminTicketDetail> {
    const data = await this.call<AdminTicketDetail & { success: boolean }>('detail_admin', { ticket_id: ticketId });
    return { ticket: data.ticket, comments: data.comments };
  }

  async getAllTicketStats(): Promise<TicketStats> {
    const data = await this.call<TicketStats & { success: boolean }>('stats_all');
    return { total: data.total, new: data.new, open: data.open, pending: data.pending, resolved: data.resolved, closed: data.closed };
  }

  // ── Admin write methods ────────────────────────────────────────────────

  async addComment(ticketId: string, content: string): Promise<void> {
    await this.call<{ success: boolean }>('add_comment', { ticket_id: ticketId, content });
  }

  async updateTicket(ticketId: string, opts: UpdateTicketOptions): Promise<void> {
    await this.call<{ success: boolean }>('update_ticket', {
      ticket_id: ticketId,
      status: opts.status,
      priority: opts.priority,
    });
  }

  async createTicketForAdvisor(advisorEmail: string, opts: CreateTicketOptions): Promise<CreateTicketResult> {
    if (!advisorEmail?.trim()) throw new Error('advisorEmail is required');
    const data = await this.call<CreateTicketResult & { success: boolean }>('create_for_advisor', {
      advisor_email: advisorEmail.trim(),
      subject: opts.subject,
      description: opts.description,
      category: opts.category,
      priority: opts.priority,
    });
    return { ticket_id: data.ticket_id, ticket_number: data.ticket_number };
  }
}

export const ticketService = new TicketService();
