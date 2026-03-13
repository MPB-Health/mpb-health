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
 * Singleton refresh promise — prevents multiple simultaneous calls from each
 * triggering their own `refreshSession()`. With Supabase's `noOpLock`, the
 * refresh token is single-use; a second concurrent refresh races and whichever
 * call is second gets a token that has already been rotated, causing a 401.
 *
 * By sharing one pending Promise, concurrent callers all await the same
 * in-flight refresh and receive the same fresh session.
 */
let _pendingRefresh: Promise<Awaited<ReturnType<typeof supabase.auth.refreshSession>>> | null = null;

async function refreshOnce() {
  if (!_pendingRefresh) {
    _pendingRefresh = supabase.auth.refreshSession().finally(() => {
      _pendingRefresh = null;
    });
  }
  return _pendingRefresh;
}

/**
 * Ensure the current session has a non-expired access token before calling
 * an Edge Function. Returns null when there is no session (user is not
 * authenticated).
 *
 * Uses a singleton refresh promise so that concurrent callers (e.g. loadTickets
 * + loadStats + getCategories firing at the same time) share one refresh round-
 * trip instead of each consuming the single-use refresh token and racing.
 */
async function getResolvedAuthHeader(): Promise<{ Authorization: string } | null> {
  // getSession() will attempt a background refresh when the token is within
  // 60 s of expiry, but returns the CURRENT token without awaiting the refresh.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  // Force a SYNCHRONOUS refresh if:
  //  - expires_at is absent (defensive — treat as unknown/stale), OR
  //  - token has already expired or expires within TOKEN_EXPIRY_BUFFER_SECONDS.
  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh = !session.expires_at || session.expires_at < nowSec + TOKEN_EXPIRY_BUFFER_SECONDS;

  if (needsRefresh) {
    const { data: refreshed, error: refreshError } = await refreshOnce();
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
      const ctxWithJson = ctx as { json?: () => Promise<{ error?: string }> };
      if (ctxWithJson?.json && typeof ctxWithJson.json === 'function') {
        const body = await ctxWithJson.json();
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
  requesterId?: string;
  sortBy?: 'created_at' | 'updated_at' | 'ticket_number' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface TicketRequester {
  id: string;
  name: string;
  email: string;
  agent_id: string | null;
}

export interface CreateTicketOptions {
  subject: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  attachments?: File[];
}

export interface CreateTicketResult {
  ticket_id: string;
  ticket_number: number;
}

interface TicketAttachmentUploadResult {
  fileName: string;
  accessUrl: string;
  size: number;
}

export interface UpdateTicketOptions {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export class TicketService {
  private static ATTACHMENTS_BUCKET = 'ticket-attachments';
  private static ATTACHMENT_MAX_SIZE = 15 * 1024 * 1024; // 15 MB per file
  private static ATTACHMENT_MAX_COUNT = 10;

  private sanitizeFileName(fileName: string): string {
    const dotIdx = fileName.lastIndexOf('.');
    const base = (dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName)
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'file';
    const ext = dotIdx > 0 ? fileName.slice(dotIdx + 1).toLowerCase().replace(/[^a-z0-9]+/g, '') : '';
    return ext ? `${base}.${ext.slice(0, 10)}` : base;
  }

  private formatAttachmentComment(uploads: TicketAttachmentUploadResult[]): string {
    const lines = uploads.map((upload) => {
      const kb = Math.max(1, Math.round(upload.size / 1024));
      return `- ${upload.fileName} (${kb} KB): ${upload.accessUrl}`;
    });
    return ['Attachments uploaded by advisor:', ...lines].join('\n');
  }

  private async uploadAttachments(ticketId: string, attachments: File[]): Promise<TicketAttachmentUploadResult[]> {
    if (!attachments.length) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('Authentication required to upload attachments. Please sign in again.');

    if (attachments.length > TicketService.ATTACHMENT_MAX_COUNT) {
      throw new Error(`You can upload up to ${TicketService.ATTACHMENT_MAX_COUNT} attachments per ticket.`);
    }

    const uploaded: TicketAttachmentUploadResult[] = [];
    const uploadedPaths: string[] = [];

    try {
      for (const file of attachments) {
        if (file.size > TicketService.ATTACHMENT_MAX_SIZE) {
          throw new Error(`File "${file.name}" exceeds the 15 MB limit.`);
        }

        const safeName = this.sanitizeFileName(file.name);
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const path = `${user.id}/${ticketId}/${uniqueSuffix}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(TicketService.ATTACHMENTS_BUCKET)
          .upload(path, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

        if (uploadError) {
          if (uploadError.message?.includes('Bucket not found')) {
            throw new Error('Ticket attachment storage is not configured. Please contact support.');
          }
          throw uploadError;
        }

        uploadedPaths.push(path);

        const { data: signedData, error: signedError } = await supabase.storage
          .from(TicketService.ATTACHMENTS_BUCKET)
          .createSignedUrl(path, 60 * 60 * 24 * 365);

        if (signedError || !signedData?.signedUrl) {
          throw signedError || new Error('Failed to create secure attachment URL.');
        }

        uploaded.push({
          fileName: file.name,
          accessUrl: signedData.signedUrl,
          size: file.size,
        });
      }

      return uploaded;
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await Promise.all(
          uploadedPaths.map((path) =>
            supabase.storage
              .from(TicketService.ATTACHMENTS_BUCKET)
              .remove([path])
              .catch(() => undefined),
          ),
        );
      }
      throw error;
    }
  }

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
  /** Request timeout — prevents infinite hangs if the edge function or ITSTS is down */
  private static REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

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

    // Wrap the invoke in a timeout so the UI never hangs indefinitely
    const invokePromise = supabase.functions.invoke<T>('ticket-proxy', {
      body: { action, ...body },
      headers: {
        ...authHeader,
        'x-request-id': correlationId,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out [${correlationId}]`)), TicketService.REQUEST_TIMEOUT_MS),
    );

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

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
    // Use this.call() which already resolves auth via getResolvedAuthHeader().
    // Previously this called getResolvedAuthHeader() separately, causing
    // duplicate token refresh races when fired concurrently with getTicketStats().
    const data = await this.call<TicketListResult & { success: boolean }>('list', {
      status: opts.status,
      priority: opts.priority,
      search: opts.search,
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 20,
    }, { allowUnauthenticated: true });

    if (!data) return { tickets: [], total: 0, page: opts.page ?? 1, per_page: opts.perPage ?? 20 };
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

  async getKnowledgeBase(opts: { search?: string; category?: string; page?: number; perPage?: number } = {}): Promise<TicketListResult> {
    const data = await this.call<TicketListResult & { success: boolean }>('list_kb', {
      search: opts.search,
      category: opts.category,
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 20,
    }, { allowUnauthenticated: true });
    if (!data) return { tickets: [], total: 0, page: opts.page ?? 1, per_page: opts.perPage ?? 20 };
    return { tickets: data.tickets, total: data.total, page: data.page, per_page: data.per_page };
  }

  // ── Advisor write methods ──────────────────────────────────────────────

  async createTicket(opts: CreateTicketOptions): Promise<CreateTicketResult> {
    const data = await this.call<CreateTicketResult & { success: boolean }>('create', {
      subject: opts.subject,
      description: opts.description,
      category: opts.category,
      priority: opts.priority,
    });

    if (opts.attachments?.length) {
      const uploads = await this.uploadAttachments(data.ticket_id, opts.attachments);
      if (uploads.length) {
        await this.replyToTicket(data.ticket_id, this.formatAttachmentComment(uploads));
      }
    }

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
      requester_id: opts.requesterId,
      sort_by: opts.sortBy,
      sort_order: opts.sortOrder,
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

  async addComment(ticketId: string, content: string, isInternal = false): Promise<void> {
    await this.call<{ success: boolean }>('add_comment', { ticket_id: ticketId, content, is_internal: isInternal });
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

  async getRequesters(): Promise<TicketRequester[]> {
    const data = await this.call<{ success: boolean; requesters: TicketRequester[] }>('list_requesters');
    return data.requesters ?? [];
  }

  async bulkCloseAll(): Promise<number> {
    const data = await this.call<{ success: boolean; closed_count: number }>('bulk_close');
    return data.closed_count;
  }

  async bulkUpdateTickets(ticketIds: string[], opts: UpdateTicketOptions): Promise<number> {
    const data = await this.call<{ success: boolean; updated_count: number }>('bulk_update', {
      ticket_ids: ticketIds,
      status: opts.status,
      priority: opts.priority,
    });
    return data.updated_count;
  }

  async bulkDeleteTickets(ticketIds: string[]): Promise<number> {
    const data = await this.call<{ success: boolean; deleted_count: number }>('bulk_delete', {
      ticket_ids: ticketIds,
    });
    return data.deleted_count;
  }

  /** Fire-and-forget warm-up ping to keep the ticket-proxy edge function warm.
   *  Silently no-ops when the user is not authenticated. */
  async ping(): Promise<void> {
    await this.call<{ success: boolean }>('ping', {}, { allowUnauthenticated: true });
  }
}

export const ticketService = new TicketService();
