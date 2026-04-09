import { supabase, getResolvedAuthHeader } from '@mpbhealth/database';
import type {
  ChatConversation,
  ChatMember,
  ChatMessage,
  ChatSearchResult,
  ListMessagesResult,
  CreateChannelOptions,
  ChatUserSearchResult,
} from './types';

function newCorrelationId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function is401Error(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  const ctx = e.context;
  if (ctx && typeof ctx === 'object' && 'status' in ctx) {
    return (ctx as { status: number }).status === 401;
  }
  if (typeof e.status === 'number') return e.status === 401;
  return false;
}

async function extractFunctionError(error: unknown): Promise<string> {
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

// ============================================================================
// ChatService
// ============================================================================

export class ChatService {
  private static REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

  /**
   * Central edge function call method.
   *
   * @param action  The chat-service action string.
   * @param body    Additional fields merged into the request body.
   * @param signal  Optional AbortSignal — callers (hooks) pass this so in-flight
   *                requests can be abandoned when the component unmounts or a newer
   *                request supersedes this one.
   */
  private async call<T extends { success: boolean }>(
    action: string,
    body: Record<string, unknown> = {},
    signal?: AbortSignal,
  ): Promise<T> {
    // Bail early if already aborted (e.g. rapid navigation)
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const correlationId = newCorrelationId();

    const doInvoke = async (auth: { Authorization: string }) => {
      // Check again after async auth resolution
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

      const invokePromise = supabase.functions.invoke<T>('chat-service', {
        body: { action, ...body },
        headers: { ...auth, 'x-request-id': correlationId },
      });

      // Timeout with proper cleanup
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`[${correlationId}] Request timed out`)),
          ChatService.REQUEST_TIMEOUT_MS,
        );
      });

      // Also race against the abort signal if provided
      const abortPromise = signal
        ? new Promise<never>((_, reject) => {
            if (signal.aborted) {
              reject(new DOMException('Aborted', 'AbortError'));
              return;
            }
            signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
          })
        : null;

      const racers: Promise<unknown>[] = [invokePromise, timeoutPromise];
      if (abortPromise) racers.push(abortPromise);

      try {
        return await (Promise.race(racers) as Promise<Awaited<typeof invokePromise>>);
      } finally {
        // Always clear the timeout timer — prevents leak when request wins the race
        clearTimeout(timer);
      }
    };

    let { data, error } = await doInvoke(authHeader);

    // On 401, retry once with a freshly refreshed token (handles stale-token races)
    if (error && is401Error(error)) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const refreshed = await getResolvedAuthHeader();
      if (refreshed) {
        const retry = await doInvoke(refreshed);
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }
    }

    if (error) {
      const msg = await extractFunctionError(error);
      throw new Error(`[${correlationId}] ${msg}`);
    }

    if (!data) throw new Error(`[${correlationId}] Empty response`);
    if (!data.success) {
      const errMsg = (data as Record<string, unknown>).error || 'Request failed';
      throw new Error(`[${correlationId}] ${errMsg}`);
    }

    return data;
  }

  // =========================================================================
  // CONVERSATIONS
  // =========================================================================

  async listConversations(signal?: AbortSignal): Promise<ChatConversation[]> {
    const result = await this.call<{ success: boolean; conversations: ChatConversation[] }>(
      'list_conversations',
      {},
      signal,
    );
    return result.conversations;
  }

  async createDM(otherUserId: string): Promise<{ conversation_id: string; existing: boolean }> {
    return this.call<{ success: boolean; conversation_id: string; existing: boolean }>(
      'create_dm',
      { other_user_id: otherUserId },
    );
  }

  async createChannel(opts: CreateChannelOptions): Promise<{ channel: ChatConversation; members_added: number }> {
    return this.call<{ success: boolean; channel: ChatConversation; members_added: number }>(
      'create_channel',
      opts as unknown as Record<string, unknown>,
    );
  }

  // =========================================================================
  // MESSAGES
  // =========================================================================

  async listMessages(
    conversationId: string,
    opts: { limit?: number; before?: string; signal?: AbortSignal } = {},
  ): Promise<ListMessagesResult> {
    const { signal, ...rest } = opts;
    const result = await this.call<{ success: boolean; messages: ChatMessage[]; has_more: boolean }>(
      'list_messages',
      { conversation_id: conversationId, ...rest },
      signal,
    );
    return { messages: result.messages, has_more: result.has_more };
  }

  async sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string,
  ): Promise<ChatMessage> {
    const result = await this.call<{ success: boolean; message: ChatMessage }>(
      'send_message',
      { conversation_id: conversationId, content, reply_to_id: replyToId },
    );
    return result.message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.call('delete_message', { message_id: messageId });
  }

  // =========================================================================
  // SEARCH
  // =========================================================================

  async searchMessages(
    query: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<ChatSearchResult[]> {
    const result = await this.call<{ success: boolean; results: ChatSearchResult[] }>(
      'search_messages',
      { query, ...opts },
    );
    return result.results;
  }

  async searchUsers(
    query: string,
    opts: { limit?: number } = {},
  ): Promise<ChatUserSearchResult[]> {
    const result = await this.call<{ success: boolean; users: ChatUserSearchResult[] }>(
      'search_users',
      { query, ...opts },
    );
    return result.users;
  }

  // =========================================================================
  // READ TRACKING
  // =========================================================================

  async markRead(conversationId: string, signal?: AbortSignal): Promise<void> {
    await this.call('mark_read', { conversation_id: conversationId }, signal);
  }

  // =========================================================================
  // MEMBERS
  // =========================================================================

  async listMembers(conversationId: string): Promise<ChatMember[]> {
    const result = await this.call<{ success: boolean; members: ChatMember[] }>(
      'list_members',
      { conversation_id: conversationId },
    );
    return result.members;
  }

  // =========================================================================
  // REALTIME
  // =========================================================================

  private _messageChannels = new Map<string, ReturnType<typeof supabase.channel>>();
  private _conversationUpdatesChannel: ReturnType<typeof supabase.channel> | null = null;

  subscribeToMessages(
    conversationId: string,
    callback: (message: ChatMessage) => void,
  ) {
    // Remove existing subscription to prevent duplicates on re-mount
    const existing = this._messageChannels.get(conversationId);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(`chat-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        },
      )
      .subscribe();

    this._messageChannels.set(conversationId, channel);
    return channel;
  }

  unsubscribeFromMessages(conversationId: string) {
    const channel = this._messageChannels.get(conversationId);
    if (channel) {
      supabase.removeChannel(channel);
      this._messageChannels.delete(conversationId);
    }
  }

  subscribeToConversationUpdates(callback: (conversation: ChatConversation) => void) {
    // Remove existing subscription to prevent duplicates
    if (this._conversationUpdatesChannel) {
      supabase.removeChannel(this._conversationUpdatesChannel);
    }

    const channel = supabase
      .channel('chat-conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
        },
        (payload) => {
          callback(payload.new as ChatConversation);
        },
      )
      .subscribe();

    this._conversationUpdatesChannel = channel;
    return channel;
  }

  unsubscribeFromConversationUpdates() {
    if (this._conversationUpdatesChannel) {
      supabase.removeChannel(this._conversationUpdatesChannel);
      this._conversationUpdatesChannel = null;
    }
  }

  // =========================================================================
  // HEALTH CHECK
  // =========================================================================

  async ping(): Promise<void> {
    await this.call('ping');
  }
}

export const chatService = new ChatService();
