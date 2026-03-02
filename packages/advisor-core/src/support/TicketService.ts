import { supabase } from '@mpbhealth/database';

/**
 * Ensure the current session has a non-expired access token before calling
 * an Edge Function. With the noOpLock bypass in the Supabase client, two
 * concurrent functions.invoke() calls that both hit an expiring token can
 * race on the internal refresh and one ends up sending a stale token → 401.
 *
 * By fetching the session once here (which triggers a refresh if needed) and
 * returning the resolved access_token, we avoid that race condition: callers
 * can then pass the already-resolved token explicitly so no further refresh
 * is attempted inside invoke().
 *
 * Returns null when there is no session (user is not authenticated).
 */
async function getResolvedAuthHeader(): Promise<{ Authorization: string } | null> {
  // getSession() auto-refreshes when the token is within 60 s of expiry.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  // Belt-and-suspenders: if the token is already past its expiry (clock skew
  // or a failed silent-refresh), force an explicit refresh before proceeding.
  const nowSec = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at < nowSec) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (!refreshed.session?.access_token) return null;
    return { Authorization: `Bearer ${refreshed.session.access_token}` };
  }

  return { Authorization: `Bearer ${session.access_token}` };
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
  async getMyTickets(opts: ListTicketsOptions = {}): Promise<TicketListResult> {
    const authHeader = await getResolvedAuthHeader();
    // Not authenticated — return empty list instead of hitting the edge function
    // with a missing/invalid token (which would produce a noisy 401).
    if (!authHeader) return { tickets: [], total: 0, page: opts.page || 1, per_page: opts.perPage || 20 };

    const { data, error } = await supabase.functions.invoke<TicketListResult & { success: boolean }>('ticket-proxy', {
      body: {
        action: 'list',
        status: opts.status,
        priority: opts.priority,
        search: opts.search,
        page: opts.page || 1,
        per_page: opts.perPage || 20,
      },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch tickets');

    return {
      tickets: data.tickets,
      total: data.total,
      page: data.page,
      per_page: data.per_page,
    };
  }

  async getTicketDetail(ticketId: string): Promise<TicketDetail> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<TicketDetail & { success: boolean }>('ticket-proxy', {
      body: {
        action: 'detail',
        ticket_id: ticketId,
      },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch ticket details');

    return { ticket: data.ticket, comments: data.comments };
  }

  async getTicketStats(): Promise<TicketStats> {
    const authHeader = await getResolvedAuthHeader();
    // Not authenticated — return zeroed stats silently.
    if (!authHeader) return { total: 0, new: 0, open: 0, pending: 0, resolved: 0, closed: 0 };

    const { data, error } = await supabase.functions.invoke<TicketStats & { success: boolean }>('ticket-proxy', {
      body: { action: 'stats' },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch ticket stats');

    return {
      total: data.total,
      new: data.new,
      open: data.open,
      pending: data.pending,
      resolved: data.resolved,
      closed: data.closed,
    };
  }

  // ── Admin methods ──────────────────────────────────────────────────────

  async getAllTickets(opts: AdminListTicketsOptions = {}): Promise<AdminTicketListResult> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<AdminTicketListResult & { success: boolean }>('ticket-proxy', {
      body: {
        action: 'list_all',
        status: opts.status,
        priority: opts.priority,
        search: opts.search,
        page: opts.page || 1,
        per_page: opts.perPage || 20,
      },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch tickets');

    return { tickets: data.tickets, total: data.total, page: data.page, per_page: data.per_page };
  }

  async getTicketDetailAdmin(ticketId: string): Promise<AdminTicketDetail> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<AdminTicketDetail & { success: boolean }>('ticket-proxy', {
      body: { action: 'detail_admin', ticket_id: ticketId },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch ticket details');

    return { ticket: data.ticket, comments: data.comments };
  }

  async getAllTicketStats(): Promise<TicketStats> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<TicketStats & { success: boolean }>('ticket-proxy', {
      body: { action: 'stats_all' },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch ticket stats');

    return {
      total: data.total,
      new: data.new,
      open: data.open,
      pending: data.pending,
      resolved: data.resolved,
      closed: data.closed,
    };
  }

  async addComment(ticketId: string, content: string): Promise<void> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<{ success: boolean }>('ticket-proxy', {
      body: { action: 'add_comment', ticket_id: ticketId, content },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to add comment');
  }

  // ── Advisor write methods ──────────────────────────────────────────────────────

  async getCategories(): Promise<string[]> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) return [];

    const { data, error } = await supabase.functions.invoke<{ success: boolean; categories: string[] }>('ticket-proxy', {
      body: { action: 'get_categories' },
      headers: authHeader,
    });

    if (error) return [];
    return data?.categories ?? [];
  }

  async createTicket(opts: CreateTicketOptions): Promise<CreateTicketResult> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<CreateTicketResult & { success: boolean }>('ticket-proxy', {
      body: {
        action: 'create',
        subject: opts.subject,
        description: opts.description,
        category: opts.category,
        priority: opts.priority,
      },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to create ticket');
    return { ticket_id: data.ticket_id, ticket_number: data.ticket_number };
  }

  async replyToTicket(ticketId: string, content: string): Promise<void> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<{ success: boolean }>('ticket-proxy', {
      body: { action: 'reply', ticket_id: ticketId, content },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to send reply');
  }

  // ── Admin write methods ────────────────────────────────────────────────────

  async updateTicket(ticketId: string, opts: UpdateTicketOptions): Promise<void> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<{ success: boolean }>('ticket-proxy', {
      body: { action: 'update_ticket', ticket_id: ticketId, status: opts.status, priority: opts.priority },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to update ticket');
  }

  async createTicketForAdvisor(advisorEmail: string, opts: CreateTicketOptions): Promise<CreateTicketResult> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke<CreateTicketResult & { success: boolean }>('ticket-proxy', {
      body: {
        action: 'create_for_advisor',
        advisor_email: advisorEmail,
        subject: opts.subject,
        description: opts.description,
        category: opts.category,
        priority: opts.priority,
      },
      headers: authHeader,
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to create ticket');
    return { ticket_id: data.ticket_id, ticket_number: data.ticket_number };
  }
}

export const ticketService = new TicketService();
