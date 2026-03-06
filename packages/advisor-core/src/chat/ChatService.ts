import { supabase } from '@mpbhealth/database';
import type {
  ChatConversation,
  ChatMember,
  ChatMessage,
  ChatSearchResult,
  ListMessagesResult,
  CreateChannelOptions,
} from './types';

// ============================================================================
// Auth helper — reuses the same pattern as TicketService
// ============================================================================

const TOKEN_EXPIRY_BUFFER_SECONDS = 30;
let _pendingRefresh: ReturnType<typeof supabase.auth.refreshSession> | null = null;

function refreshOnce() {
  if (!_pendingRefresh) {
    _pendingRefresh = supabase.auth.refreshSession().finally(() => {
      _pendingRefresh = null;
    });
  }
  return _pendingRefresh;
}

async function getResolvedAuthHeader(): Promise<{ Authorization: string } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh = !session.expires_at || session.expires_at < nowSec + TOKEN_EXPIRY_BUFFER_SECONDS;

  if (needsRefresh) {
    const { data: refreshed, error } = await refreshOnce();
    if (error || !refreshed?.session) return null;
    return { Authorization: `Bearer ${refreshed.session.access_token}` };
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

function newCorrelationId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function extractFunctionError(error: unknown): Promise<string> {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
    if (typeof e.context === 'object' && e.context !== null) {
      const ctx = e.context as Record<string, unknown>;
      if (typeof ctx.body === 'string') {
        try {
          const parsed = JSON.parse(ctx.body);
          if (parsed.error) return parsed.error;
        } catch { /* ignore */ }
      }
    }
  }
  return 'Unknown error';
}

// ============================================================================
// ChatService
// ============================================================================

export class ChatService {
  private static REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

  // Central edge function call method
  private async call<T extends { success: boolean }>(
    action: string,
    body: Record<string, unknown> = {},
  ): Promise<T> {
    const authHeader = await getResolvedAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const correlationId = newCorrelationId();

    const invokePromise = supabase.functions.invoke<T>('chat-service', {
      body: { action, ...body },
      headers: {
        ...authHeader,
        'x-request-id': correlationId,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[${correlationId}] Request timed out`)), ChatService.REQUEST_TIMEOUT_MS),
    );

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

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

  async listConversations(): Promise<ChatConversation[]> {
    const result = await this.call<{ success: boolean; conversations: ChatConversation[] }>(
      'list_conversations',
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
    opts: { limit?: number; before?: string } = {},
  ): Promise<ListMessagesResult> {
    const result = await this.call<{ success: boolean; messages: ChatMessage[]; has_more: boolean }>(
      'list_messages',
      { conversation_id: conversationId, ...opts },
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

  // =========================================================================
  // READ TRACKING
  // =========================================================================

  async markRead(conversationId: string): Promise<void> {
    await this.call('mark_read', { conversation_id: conversationId });
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
