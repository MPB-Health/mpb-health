import { supabase, getResolvedAuthHeader, refreshSessionOnce } from '@mpbhealth/database';

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
export type TicketContentFormat = 'plain' | 'html';

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
  content_format?: TicketContentFormat;
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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TicketRequester {
  id: string;
  name: string;
  email: string;
  agent_id?: string | null;
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

export interface TicketAttachmentUploadResult {
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

    // Proactively refresh the session so storage RLS sees a valid JWT.
    // The preceding edge-function call may have consumed the refresh token;
    // refreshSessionOnce() deduplicates concurrent callers.
    const { data: { session } } = await supabase.auth.getSession();
    const nowSec = Math.floor(Date.now() / 1000);
    if (!session || !session.expires_at || session.expires_at < nowSec + 60) {
      await refreshSessionOnce();
    }

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
          throw new Error(`File \"${file.name}\" exceeds the 15 MB limit.`);
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
          .createSignedUrl(path, 60 * 60 * 24);

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
   * Built-in resilience:
   *  1. Resolves a guaranteed-fresh auth token via the shared app-wide
   *     singleton in @mpbhealth/database (avoids single-use refresh-token races).
   *  2. Per-attempt timeout covers BOTH auth resolution AND the invoke so
   *     the UI never hangs — even if refreshSession() stalls.
   *  3. Automatic silent retry (up to 3 attempts) with exponential back-off
   *     for transient failures (timeouts, network errors, 5xx).
   *  4. On auth errors, refreshes the session and retries silently.
   *  5. Only throws after all retries are exhausted.
   */
  private static CALL_TIMEOUT_MS = 25_000;
  private static MAX_RETRIES = 2; // 3 total attempts
  private static RETRY_BACKOFF = [1_000, 3_000]; // ms between retries

  private async call<T extends { success: boolean }>(
    action: string,
    body: Record<string, unknown> = {},
    opts: { allowUnauthenticated?: boolean; timeoutMs?: number; maxRetries?: number } = {},
  ): Promise<T> {
    const correlationId = newCorrelationId();
    const timeoutMs = opts.timeoutMs ?? TicketService.CALL_TIMEOUT_MS;
    const maxRetries = opts.maxRetries ?? TicketService.MAX_RETRIES;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = TicketService.RETRY_BACKOFF[attempt - 1] ?? 3_000;
        await new Promise((r) => setTimeout(r, delay));
      }

      try {
        // Single timeout covers auth resolution + invoke so a hung
        // refreshSession() can't leave the UI spinning forever.
        const attemptResult = await Promise.race([
          this.executeAttempt<T>(action, body, correlationId, attempt > 0, opts.allowUnauthenticated),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs),
          ),
        ]);

        if (attemptResult === null) {
          return null as unknown as T;
        }

        return attemptResult;
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'TIMEOUT' || err.message === '_RETRYABLE') {
            lastError = err;
            continue;
          }
          if (err.message === '_AUTH_RETRYABLE') {
            lastError = new Error('SESSION_EXPIRED');
            continue;
          }
          if (err.message === 'SESSION_EXPIRED') {
            if (opts.allowUnauthenticated) return null as unknown as T;
            throw err;
          }
        }
        throw err;
      }
    }

    throw lastError ?? new Error('Request failed');
  }

  /** Single attempt: resolve auth → invoke → validate response. */
  private async executeAttempt<T extends { success: boolean }>(
    action: string,
    body: Record<string, unknown>,
    correlationId: string,
    forceRefresh: boolean,
    allowUnauthenticated?: boolean,
  ): Promise<T | null> {
    if (forceRefresh) {
      await refreshSessionOnce();
    }

    const authHeader = await getResolvedAuthHeader();

    if (!authHeader) {
      if (allowUnauthenticated) return null;
      throw new Error('SESSION_EXPIRED');
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

      if (/authorization|unauthorized|auth/i.test(msg)) {
        throw new Error('_AUTH_RETRYABLE');
      }
      if (/not yet configured|not configured|account not found|not been synced/i.test(msg)) {
        throw new Error(msg);
      }
      if (/temporarily unavailable/i.test(msg)) {
        throw new Error(msg);
      }
      throw new Error('_RETRYABLE');
    }

    if (!data?.success) {
      const errMsg = (data as Record<string, unknown>)?.error as string | undefined;
      const err = new Error(errMsg ?? 'Request failed');
      if (errMsg && !/timeout|network|internal|server|503|502|504/i.test(errMsg)) {
        throw err;
      }
      throw new Error('_RETRYABLE');
    }

    return data as any;
  }

  // ── Advisor read methods ───────────────────────────────────────────────

  async getMyTickets(opts: ListTicketsOptions = {}): Promise<TicketListResult> {
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
    // Fast-fail with a short timeout and no retries — the UI has hardcoded
    // fallback categories, so there's no value in blocking the form for 60+ s
    // while the retry loop exhausts on a cold-start or flaky connection.
    try {
      const data = await this.call<{ success: boolean; categories: string[] }>(
        'get_categories',
        {},
        { allowUnauthenticated: true, timeoutMs: 5_000, maxRetries: 0 },
      );
      return data?.categories ?? [];
    } catch {
      return [];
    }
  }

  // ── Advisor write methods ──────────────────────────────────────────────

  async createTicket(opts: CreateTicketOptions): Promise<CreateTicketResult & { attachmentError?: string }> {
    const data = await this.call<CreateTicketResult & { success: boolean }>('create', {
      subject: opts.subject,
      description: opts.description,
      category: opts.category,
      priority: opts.priority,
    });

    const result: CreateTicketResult & { attachmentError?: string } = {
      ticket_id: data.ticket_id,
      ticket_number: data.ticket_number,
    };

    // Attachment upload is best-effort — ticket is already created in ITSTS
    if (opts.attachments?.length) {
      try {
        const uploadPromise = (async () => {
          const uploads = await this.uploadAttachments(data.ticket_id, opts.attachments!);
          if (uploads.length) {
            await this.replyToTicket(data.ticket_id, this.formatAttachmentComment(uploads));
          }
        })();

        // 45-second timeout for attachment upload
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Attachment upload timed out')), 45_000),
        );

        await Promise.race([uploadPromise, timeout]);
      } catch (attachErr) {
        const msg = attachErr instanceof Error ? attachErr.message : 'Failed to upload attachments';
        console.error('[TicketService] Attachment upload failed:', msg, attachErr);
        result.attachmentError = msg;
      }
    }

    return result;
  }

  async replyToTicket(ticketId: string, content: string, contentFormat?: TicketContentFormat): Promise<void> {
    await this.call<{ success: boolean }>('reply', {
      ticket_id: ticketId,
      content,
      ...(contentFormat ? { content_format: contentFormat } : {}),
    });
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

  async addComment(ticketId: string, content: string, isInternal = false, contentFormat?: TicketContentFormat): Promise<void> {
    await this.call<{ success: boolean }>('add_comment', {
      ticket_id: ticketId,
      content,
      is_internal: isInternal,
      ...(contentFormat ? { content_format: contentFormat } : {}),
    });
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

  // ── Bulk admin operations ───────────────────────────────────────────────

  /**
   * Update status/priority on multiple tickets at once.
   * Uses sequential `update_ticket` calls because the proxy doesn't expose
   * a dedicated bulk endpoint. Returns the number of successfully updated tickets.
   */
  async bulkUpdateTickets(
    ticketIds: string[],
    opts: UpdateTicketOptions,
  ): Promise<number> {
    let count = 0;
    const results = await Promise.allSettled(
      ticketIds.map((id) =>
        this.call<{ success: boolean }>('update_ticket', {
          ticket_id: id,
          status: opts.status,
          priority: opts.priority,
        }),
      ),
    );
    for (const r of results) {
      if (r.status === 'fulfilled') count++;
    }
    return count;
  }

  /**
   * Delete multiple tickets. Closes them since the proxy doesn't support
   * hard-delete; this is the safest admin bulk action.
   */
  async bulkDeleteTickets(ticketIds: string[]): Promise<number> {
    return this.bulkUpdateTickets(ticketIds, { status: 'closed' });
  }

  /**
   * Close all non-closed tickets. Fetches open/pending/new tickets and
   * closes them in bulk.
   */
  async bulkCloseAll(): Promise<number> {
    const openStatuses: TicketStatus[] = ['new', 'open', 'pending', 'resolved'];
    let totalClosed = 0;

    for (const status of openStatuses) {
      // Fetch up to 200 tickets per status
      const result = await this.getAllTickets({ status, perPage: 200 });
      if (result.tickets.length === 0) continue;
      const ids = result.tickets.map((t) => t.id);
      totalClosed += await this.bulkUpdateTickets(ids, { status: 'closed' });
    }

    return totalClosed;
  }

  /**
   * Extract distinct requesters from an already-loaded ticket array.
   * Avoids a separate 200-ticket round-trip to the edge function.
   */
  extractRequesters(tickets: AdminTicket[]): TicketRequester[] {
    const seen = new Map<string, TicketRequester>();
    for (const t of tickets) {
      if (!seen.has(t.requester_email)) {
        seen.set(t.requester_email, {
          id: t.requester_email,
          name: t.requester_name,
          email: t.requester_email,
          agent_id: t.requester_agent_id,
        });
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Knowledge base — returns resolved tickets as searchable articles.
   * Re-uses the admin list endpoint with a resolved/closed status filter.
   */
  async getKnowledgeBase(opts: {
    search?: string;
    category?: string;
    page?: number;
    perPage?: number;
  } = {}): Promise<AdminTicketListResult> {
    return this.getAllTickets({
      status: 'resolved',
      search: opts.search,
      page: opts.page,
      perPage: opts.perPage,
    });
  }

  /** Upload a single image for inline embedding in a rich-text reply. Returns the signed URL. */
  async uploadImageForTicketReply(ticketId: string, file: File): Promise<string> {
    const [result] = await this.uploadAttachments(ticketId, [file]);
    return result.accessUrl;
  }

  /** Upload multiple files for a reply. Returns metadata for each uploaded file. */
  async uploadFilesForTicketReply(ticketId: string, files: File[]): Promise<TicketAttachmentUploadResult[]> {
    return this.uploadAttachments(ticketId, files);
  }

  /** Fire-and-forget warm-up ping to keep the ticket-proxy edge function warm.
   *  Silently no-ops when the user is not authenticated. */
  async ping(): Promise<void> {
    await this.call<{ success: boolean }>('ping', {}, { allowUnauthenticated: true });
  }
}

/** Append attachment download links as HTML to an existing HTML string. */
export function appendTicketAttachmentsHtml(html: string, uploads: TicketAttachmentUploadResult[]): string {
  if (!uploads.length) return html;
  const links = uploads
    .map((u) => {
      const kb = Math.max(1, Math.round(u.size / 1024));
      return `<li><a href="${u.accessUrl}" target="_blank" rel="noopener">${u.fileName}</a> (${kb} KB)</li>`;
    })
    .join('');
  return `${html}<br/><p><strong>Attachments:</strong></p><ul>${links}</ul>`;
}

export const ticketService = new TicketService();
