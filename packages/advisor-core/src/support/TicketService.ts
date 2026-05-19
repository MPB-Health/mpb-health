import {
  supabase,
  supabaseUrl,
  supabasePublicAnonKey,
  getResolvedAuthHeader,
  refreshSessionOnce,
  getCachedSession,
  isSessionDead,
} from '@mpbhealth/database';
import { escapeHtml } from '@mpbhealth/utils';

/**
 * Generate a short random correlation ID for request tracing.
 * Appears in Edge Function logs and can be surfaced to users/ops.
 */
function newCorrelationId(): string {
  return `tid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Extract the real error message from a Supabase Functions error.
 * The SDK often surfaces only "Edge Function returned a non-2xx status code"; the JSON body
 * `{ error: "..." }` from ticket-proxy is on `context` as a fetch Response — use clone()+text()
 * because the stream may already have been consumed once by the SDK.
 */
async function extractFunctionError(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : 'Unknown error';

  if (!error || typeof error !== 'object') return fallback;

  const ctx = (error as Record<string, unknown>).context;

  const parsePayload = (raw: string): string | null => {
    const t = raw.trim();
    if (!t) return null;
    try {
      const body = JSON.parse(t) as { error?: unknown; message?: unknown };
      if (typeof body.error === 'string' && body.error.trim()) return body.error.trim();
      if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
    } catch {
      return t.slice(0, 500);
    }
    return null;
  };

  if (ctx instanceof Response) {
    try {
      const parsed = parsePayload(await ctx.clone().text());
      if (parsed) return parsed;
    } catch {
      /* ignore */
    }
  }

  if (ctx && typeof ctx === 'object' && ctx !== null && 'json' in ctx && typeof (ctx as Response).json === 'function') {
    try {
      const body = await (ctx as Response).clone().json();
      if (body && typeof body === 'object') {
        const b = body as { error?: unknown; message?: unknown };
        if (typeof b.error === 'string' && b.error.trim()) return b.error.trim();
        if (typeof b.message === 'string' && b.message.trim()) return b.message.trim();
      }
    } catch {
      /* ignore */
    }
  }

  return fallback;
}

/** SDK fallback message when JSON body wasn't parsed — retry won't fix these. */
function isGenericFunctionsInvokeMessage(msg: string): boolean {
  const m = msg.trim();
  return (
    /^Edge Function returned a non-2xx status code$/i.test(m) ||
    /^non-2xx status code$/i.test(m) ||
    m === '' ||
    m === 'Unknown error'
  );
}

export type TicketStatus = 'new' | 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
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
  /** Present on detail responses; identifies opening requester vs support replies in the thread. */
  requester_id?: string;
  /** ITSTS `tickets.assignee_id` (support agent); `assignee_name` is from ITSTS `profiles` when present. */
  assignee_id?: string | null;
  /** Resolved from ITSTS `profiles` for the user in `assignee_id`. */
  assignee_name?: string | null;
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

/** Row from ITSTS `ticket_files` (opening attachments use `comment_id` = null). */
export interface TicketFileRow {
  id: string;
  filename: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  comment_id?: string | null;
}

export interface TicketDetail {
  ticket: Ticket;
  comments: TicketComment[];
  /** Files attached at ticket creation (not linked to a thread comment). */
  ticket_files?: TicketFileRow[];
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
  status?: TicketStatus | 'active';
  priority?: TicketPriority;
  search?: string;
  page?: number;
  perPage?: number;
  /** Matches ITSTS list: created_desc (default), created_asc, updated_desc, updated_asc */
  sort?: 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc';
  category?: string;
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
  ticket_files?: TicketFileRow[];
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
  /** Path within ITSTS Storage bucket `ticket-attachments` — stored on `ticket_files.storage_path`. */
  storagePath: string;
  mimeType: string;
}

export interface UpdateTicketOptions {
  status?: TicketStatus;
  priority?: TicketPriority;
}

export class TicketService {
  private static ATTACHMENT_MAX_SIZE = 15 * 1024 * 1024; // 15 MB per file
  private static ATTACHMENT_MAX_COUNT = 10;

  private async deleteTicketAttachmentPaths(paths: string[]): Promise<void> {
    if (!paths.length) return;
    await this.call<{ success: boolean }>(
      'delete_ticket_attachment_paths',
      { attachment_paths: paths },
      { timeoutMs: 25_000, maxRetries: 0 },
    );
  }

  /**
   * Signed read URLs for objects in the ITSTS `ticket-attachments` bucket (same project as ticket DB).
   */
  async signTicketAttachmentUrls(storagePaths: string[]): Promise<Record<string, string>> {
    if (!storagePaths.length) return {};
    const normalized = [...new Set(storagePaths.map((p) => p.replace(/^\//, '').trim()).filter(Boolean))];
    if (!normalized.length) return {};

    const out: Record<string, string> = {};
    const chunkSize = 20;
    for (let i = 0; i < normalized.length; i += chunkSize) {
      const chunk = normalized.slice(i, i + chunkSize);
      const data = await this.call<{ success: boolean; signed_urls: { path: string; url: string | null }[] }>(
        'resign_attachments',
        { storage_paths: chunk },
        { timeoutMs: 25_000, maxRetries: 1 },
      );
      for (const row of data.signed_urls || []) {
        if (row.url) out[row.path] = row.url;
      }
    }
    return out;
  }

  private async uploadAttachments(ticketId: string, attachments: File[]): Promise<TicketAttachmentUploadResult[]> {
    if (!attachments.length) return [];

    const { data: { session } } = await getCachedSession();
    const nowSec = Math.floor(Date.now() / 1000);
    if (!session || !session.expires_at || session.expires_at < nowSec + 60) {
      try {
        await refreshSessionOnce();
      } catch {
        /* invoke may still work with current JWT */
      }
    }

    const { data: { session: freshSession } } = await getCachedSession();
    const userId = freshSession?.user?.id;
    if (!userId) throw new Error('Authentication required to upload attachments. Please sign in again.');

    if (attachments.length > TicketService.ATTACHMENT_MAX_COUNT) {
      throw new Error(`You can upload up to ${TicketService.ATTACHMENT_MAX_COUNT} attachments per ticket.`);
    }

    const uploadedPaths: string[] = [];

    try {
      for (const file of attachments) {
        if (file.size > TicketService.ATTACHMENT_MAX_SIZE) {
          throw new Error(`File \"${file.name}\" exceeds the 15 MB limit.`);
        }
      }

      const prepared = await this.call<{
        success: boolean;
        uploads: Array<{ path: string; signed_url: string; token: string }>;
      }>(
        'prepare_ticket_attachment_uploads',
        {
          ticket_id: ticketId,
          attachment_uploads: attachments.map((f) => ({
            filename: f.name,
            content_type: f.type || null,
            file_size: f.size,
          })),
        },
        { timeoutMs: 45_000, maxRetries: 1 },
      );

      const slots = prepared.uploads || [];
      if (slots.length !== attachments.length) {
        throw new Error('Upload preparation failed.');
      }

      for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i];
        const slot = slots[i];
        uploadedPaths.push(slot.path);

        // Match @supabase/storage-js uploadToSignedUrl: PUT multipart body; token lives on signed_url query string.
        const formData = new FormData();
        formData.append('cacheControl', '3600');
        formData.append('', file);

        const putRes = await fetch(slot.signed_url, {
          method: 'PUT',
          headers: {
            'x-upsert': 'false',
          },
          body: formData,
        });

        if (!putRes.ok) {
          const errText = await putRes.text().catch(() => '');
          throw new Error(`Upload failed (${putRes.status}). ${errText.slice(0, 160)}`);
        }
      }

      const resigned = await this.call<{
        success: boolean;
        signed_urls: Array<{ path: string; url: string | null; error?: string }>;
      }>('resign_attachments', { storage_paths: uploadedPaths }, { timeoutMs: 25_000, maxRetries: 1 });

      const urlByPath = new Map((resigned.signed_urls || []).map((r) => [r.path, r.url]));

      return attachments.map((file, i) => {
        const path = uploadedPaths[i];
        const url = urlByPath.get(path);
        if (!url) {
          const hint = resigned.signed_urls?.[i]?.error || 'Failed to create secure attachment URL.';
          throw new Error(hint);
        }
        return {
          fileName: file.name,
          accessUrl: url,
          size: file.size,
          storagePath: path,
          mimeType: file.type || 'application/octet-stream',
        };
      });
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await this.deleteTicketAttachmentPaths(uploadedPaths).catch(() => undefined);
      }
      throw error;
    }
  }

  /** Persist storage paths to ITSTS `ticket_files` via ticket-proxy (table exists on ITSTS only, not on MPB). */
  private async saveTicketFileReferences(ticketId: string, uploads: TicketAttachmentUploadResult[]): Promise<void> {
    if (!uploads.length) return;
    await this.call<{ success: boolean }>(
      'save_ticket_files',
      {
        ticket_id: ticketId,
        files: uploads.map((u) => ({
          filename: u.fileName,
          storage_path: u.storagePath,
          file_size: u.size,
          mime_type: u.mimeType,
        })),
      },
      { timeoutMs: 25_000, maxRetries: 1 },
    );
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
  private static CALL_TIMEOUT_MS = 20_000;
  private static MAX_RETRIES = 2; // 3 total attempts
  /** Tighter delays so list/detail reads surface failure in ~4s of retries instead of ~4-10s. */
  private static RETRY_BACKOFF = [500, 1_500]; // ms between retries

  private async call<T extends { success: boolean }>(
    action: string,
    body: Record<string, unknown> = {},
    opts: {
      allowUnauthenticated?: boolean;
      timeoutMs?: number;
      maxRetries?: number;
      signal?: AbortSignal;
      /** Passed as `x-idempotency-key` for write actions that support it (e.g. create). */
      idempotencyKey?: string;
    } = {},
  ): Promise<T> {
    const correlationId = newCorrelationId();
    const timeoutMs = opts.timeoutMs ?? TicketService.CALL_TIMEOUT_MS;
    const maxRetries = opts.maxRetries ?? TicketService.MAX_RETRIES;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Bail entire chain if the session has been declared dead during retries.
      if (isSessionDead()) {
        if (opts.allowUnauthenticated) return null as unknown as T;
        throw new Error('SESSION_EXPIRED');
      }

      if (attempt > 0) {
        const delay = TicketService.RETRY_BACKOFF[attempt - 1] ?? 3_000;
        await new Promise((r) => setTimeout(r, delay));
      }

      if (opts.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      try {
        const onAbort = new Promise<never>((_, reject) => {
          const sig = opts.signal;
          if (!sig) return;
          if (sig.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          sig.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
            once: true,
          });
        });

        // Single timeout covers auth resolution + invoke so a hung
        // refreshSession() can't leave the UI spinning forever.
        const attemptResult = await Promise.race([
          this.executeAttempt<T>(
            action,
            body,
            correlationId,
            attempt > 0,
            opts.allowUnauthenticated,
            opts.idempotencyKey,
          ),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs),
          ),
          onAbort,
        ]);

        if (attemptResult === null) {
          return null as unknown as T;
        }

        return attemptResult;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
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
    idempotencyKey?: string,
  ): Promise<T | null> {
    if (forceRefresh) {
      try {
        await refreshSessionOnce();
      } catch {
        /* timed-out or failed refresh — still try invoke with getResolvedAuthHeader */
      }
    }

    const authHeader = await getResolvedAuthHeader();

    if (!authHeader) {
      if (allowUnauthenticated) return null;
      throw new Error('SESSION_EXPIRED');
    }

    const invokePayload: Record<string, unknown> = { action, ...body };

    const parseProxyJson = (text: string): Record<string, unknown> => {
      if (!text.trim()) return {};
      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        return { success: false, error: text.slice(0, 240) };
      }
    };

    const handleProxyPayload = <R extends { success: boolean }>(
      httpOk: boolean,
      payload: Record<string, unknown>,
      fallbackStatusText: string,
    ): R => {
      if (!httpOk) {
        const msg =
          typeof payload.error === "string" && payload.error.trim()
            ? payload.error.trim()
            : fallbackStatusText;
        if (/authorization|unauthorized|invalid or expired authorization/i.test(msg)) {
          throw new Error("_AUTH_RETRYABLE");
        }
        if (/not yet configured|not configured|account not found|not been synced/i.test(msg)) {
          throw new Error(msg);
        }
        if (/temporarily unavailable/i.test(msg)) {
          throw new Error(msg);
        }
        if (!isGenericFunctionsInvokeMessage(msg)) {
          throw new Error(msg);
        }
        throw new Error("_RETRYABLE");
      }

      if (!payload.success) {
        const errMsg = typeof payload.error === "string" ? payload.error : "Request failed";
        const err = new Error(errMsg);
        if (errMsg && !/timeout|network|internal|server|503|502|504/i.test(errMsg)) {
          throw err;
        }
        throw new Error("_RETRYABLE");
      }

      return payload as R;
    };

    // Prefer explicit fetch + apikey header — hosted Functions gateway expects this contract.
    // Avoids rare supabase-js invoke body/header edge cases against ticket-proxy.
    if (supabaseUrl && supabasePublicAnonKey) {
      const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ticket-proxy`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader.Authorization,
          apikey: supabasePublicAnonKey,
          "Content-Type": "application/json",
          "x-request-id": correlationId,
          ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
        },
        body: JSON.stringify(invokePayload),
      });
      const text = await response.text();
      const payload = parseProxyJson(text);
      return handleProxyPayload<T>(response.ok, payload, response.statusText || `HTTP ${response.status}`);
    }

    const { data, error } = await supabase.functions.invoke<T>("ticket-proxy", {
      body: invokePayload,
      headers: {
        ...authHeader,
        "x-request-id": correlationId,
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
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
      // 4xx validation / unknown-action bodies — surface message; retries won't help.
      if (!isGenericFunctionsInvokeMessage(msg)) {
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

  /**
   * @param runtime.signal — pass React Query's `signal` so navigations cancel in-flight lists
   *   (avoids stuck spinners when TanStack Query aborts the fetch).
   */
  async getMyTickets(
    opts: ListTicketsOptions = {},
    runtime?: { signal?: AbortSignal },
  ): Promise<TicketListResult> {
    // Snappy list: short timeout, single retry.
    const data = await this.call<TicketListResult & { success: boolean }>(
      'list',
      {
        status: opts.status,
        priority: opts.priority,
        search: opts.search,
        page: opts.page ?? 1,
        per_page: opts.perPage ?? 20,
        sort: opts.sort,
        category: opts.category,
      },
      { timeoutMs: 12_000, maxRetries: 1, signal: runtime?.signal },
    );

    return { tickets: data.tickets, total: data.total, page: data.page, per_page: data.per_page };
  }

  async getTicketDetail(
    ticketId: string,
    runtime?: { signal?: AbortSignal },
  ): Promise<TicketDetail> {
    const data = await this.call<TicketDetail & { success: boolean }>(
      'detail',
      { ticket_id: ticketId },
      { timeoutMs: 15_000, maxRetries: 1, signal: runtime?.signal },
    );
    return {
      ticket: data.ticket,
      comments: data.comments,
      ticket_files: data.ticket_files ?? [],
    };
  }

  async getTicketStats(runtime?: { signal?: AbortSignal }): Promise<TicketStats> {
    // Unauthenticated → return zeros silently.
    const data = await this.call<TicketStats & { success: boolean }>(
      'stats',
      {},
      { allowUnauthenticated: true, signal: runtime?.signal },
    );
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
    const idempotencyKey =
      typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `create-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const data = await this.call<CreateTicketResult & { success: boolean }>(
      'create',
      {
        subject: opts.subject,
        description: opts.description,
        category: opts.category,
        priority: opts.priority,
      },
      {
        timeoutMs: 45_000,
        maxRetries: 1,
        idempotencyKey,
      },
    );

    const result: CreateTicketResult & { attachmentError?: string } = {
      ticket_id: data.ticket_id,
      ticket_number: data.ticket_number,
    };

    // Attachment upload is best-effort — ticket is already created in ITSTS
    if (opts.attachments?.length) {
      console.info('[TicketService] createTicket attachment pipeline start', {
        ticket_id: data.ticket_id,
        ticket_number: data.ticket_number,
        attachmentCount: opts.attachments.length,
        attachmentSummary: opts.attachments.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type || null,
        })),
      });
      try {
        const uploadPromise = (async () => {
          const uploads = await this.uploadAttachments(data.ticket_id, opts.attachments!);
          if (!uploads.length) {
            console.warn('[TicketService] createTicket: attachments requested but upload returned none', {
              ticket_id: data.ticket_id,
              ticket_number: data.ticket_number,
              requestedCount: opts.attachments!.length,
            });
            return;
          }
          try {
            await this.saveTicketFileReferences(data.ticket_id, uploads);
            console.info('[TicketService] createTicket attachments OK', {
              ticket_id: data.ticket_id,
              ticket_number: data.ticket_number,
              fileCount: uploads.length,
              filenames: uploads.map((u) => u.fileName),
              storagePaths: uploads.map((u) => u.storagePath),
            });
          } catch (saveErr) {
            await this.deleteTicketAttachmentPaths(uploads.map((u) => u.storagePath)).catch(() => undefined);
            throw saveErr;
          }
        })();

        const attachDeadlineMs = 120_000;
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Attachment upload timed out')), attachDeadlineMs),
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

  async getAllTickets(
    opts: AdminListTicketsOptions = {},
    runtime?: { signal?: AbortSignal },
  ): Promise<AdminTicketListResult> {
    const data = await this.call<AdminTicketListResult & { success: boolean }>(
      'list_all',
      {
        status: opts.status,
        priority: opts.priority,
        search: opts.search,
        requester_id: opts.requesterId,
        sort_by: opts.sortBy,
        sort_order: opts.sortOrder,
        page: opts.page ?? 1,
        per_page: opts.perPage ?? 20,
      },
      { timeoutMs: 12_000, maxRetries: 1, signal: runtime?.signal },
    );
    return { tickets: data.tickets, total: data.total, page: data.page, per_page: data.per_page };
  }

  async getTicketDetailAdmin(
    ticketId: string,
    runtime?: { signal?: AbortSignal },
  ): Promise<AdminTicketDetail> {
    const data = await this.call<AdminTicketDetail & { success: boolean }>(
      'detail_admin',
      { ticket_id: ticketId },
      { timeoutMs: 15_000, maxRetries: 1, signal: runtime?.signal },
    );
    return {
      ticket: data.ticket,
      comments: data.comments,
      ticket_files: data.ticket_files ?? [],
    };
  }

  async getAllTicketStats(runtime?: { signal?: AbortSignal }): Promise<TicketStats> {
    const data = await this.call<TicketStats & { success: boolean }>(
      'stats_all',
      {},
      { signal: runtime?.signal },
    );
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
      const safeHref = escapeHtml(u.accessUrl);
      const safeName = escapeHtml(u.fileName);
      return `<li><a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeName}</a> (${kb} KB)</li>`;
    })
    .join('');
  return `${html}<br/><p><strong>Attachments:</strong></p><ul>${links}</ul>`;
}

export const ticketService = new TicketService();
