import { supabase } from '@mpbhealth/database';

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
  page?: number;
  perPage?: number;
}

export interface AdminTicket extends Ticket {
  requester_name: string;
  requester_email: string;
}

export interface AdminTicketDetail {
  ticket: Ticket & { requester_name: string; requester_email: string };
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

export class TicketService {
  async getMyTickets(opts: ListTicketsOptions = {}): Promise<TicketListResult> {
    const { data, error } = await supabase.functions.invoke<TicketListResult & { success: boolean }>('ticket-proxy', {
      body: {
        action: 'list',
        status: opts.status,
        priority: opts.priority,
        page: opts.page || 1,
        per_page: opts.perPage || 20,
      },
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
    const { data, error } = await supabase.functions.invoke<TicketDetail & { success: boolean }>('ticket-proxy', {
      body: {
        action: 'detail',
        ticket_id: ticketId,
      },
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch ticket details');

    return { ticket: data.ticket, comments: data.comments };
  }

  async getTicketStats(): Promise<TicketStats> {
    const { data, error } = await supabase.functions.invoke<TicketStats & { success: boolean }>('ticket-proxy', {
      body: { action: 'stats' },
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
    const { data, error } = await supabase.functions.invoke<AdminTicketListResult & { success: boolean }>('ticket-proxy', {
      body: {
        action: 'list_all',
        status: opts.status,
        priority: opts.priority,
        search: opts.search,
        page: opts.page || 1,
        per_page: opts.perPage || 20,
      },
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch tickets');

    return { tickets: data.tickets, total: data.total, page: data.page, per_page: data.per_page };
  }

  async getTicketDetailAdmin(ticketId: string): Promise<AdminTicketDetail> {
    const { data, error } = await supabase.functions.invoke<AdminTicketDetail & { success: boolean }>('ticket-proxy', {
      body: { action: 'detail_admin', ticket_id: ticketId },
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to fetch ticket details');

    return { ticket: data.ticket, comments: data.comments };
  }

  async getAllTicketStats(): Promise<TicketStats> {
    const { data, error } = await supabase.functions.invoke<TicketStats & { success: boolean }>('ticket-proxy', {
      body: { action: 'stats_all' },
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
    const { data, error } = await supabase.functions.invoke<{ success: boolean }>('ticket-proxy', {
      body: { action: 'add_comment', ticket_id: ticketId, content },
    });

    if (error) throw new Error(await extractFunctionError(error));
    if (!data?.success) throw new Error((data as any)?.error || 'Failed to add comment');
  }
}

export const ticketService = new TicketService();
