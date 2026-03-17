import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@mpbhealth/advisor-core';
import type { ChatConversation, ChatMessage, ListMessagesResult } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

// ============================================================================
// Helpers
// ============================================================================

/** Returns true for errors produced by AbortController cancellation. */
function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

// ============================================================================
// useChat — conversation list with unread badges + realtime
// ============================================================================

export function useChat() {
  const { profile } = useAdvisor();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the active AbortController so we can cancel on re-fetch or unmount
  const abortRef = useRef<AbortController | null>(null);
  // Guard against state updates after unmount
  const mountedRef = useRef(true);

  const fetchConversations = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    // Cancel any in-flight request before starting a new one (deduplication)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const data = await chatService.listConversations(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return;
      setConversations(data);
      setError(null);
    } catch (err) {
      if (isAbortError(err) || !mountedRef.current) return;
      console.error('[useChat] Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      if (mountedRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [profile?.id]);

  // Initial fetch + cleanup
  useEffect(() => {
    fetchConversations();

    return () => {
      // Cancel in-flight request when deps change or component unmounts
      abortRef.current?.abort();
    };
  }, [fetchConversations]);

  // Unmount guard
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Realtime: conversation updates (last_message_at, preview)
  useEffect(() => {
    if (!profile?.id) return;

    const channel = chatService.subscribeToConversationUpdates((updated) => {
      if (!mountedRef.current) return;
      setConversations((prev) =>
        prev
          .map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          .sort((a, b) => {
            const aTime = a.last_message_at || a.created_at;
            const bTime = b.last_message_at || b.created_at;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          }),
      );
    });

    return () => {
      chatService.unsubscribeFromConversationUpdates();
    };
  }, [profile?.id]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const channels = conversations.filter((c) => c.type === 'channel');
  const directMessages = conversations.filter((c) => c.type === 'direct');

  return {
    conversations,
    channels,
    directMessages,
    loading,
    error,
    totalUnread,
    refresh: fetchConversations,
  };
}

// ============================================================================
// useChatMessages — messages for a conversation + send + realtime
// ============================================================================

export function useChatMessages(conversationId: string | null) {
  const { profile } = useAdvisor();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const oldestMessageRef = useRef<string | null>(null);

  // Cancellation & unmount safety
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !profile?.id) {
      setLoading(false);
      return;
    }

    // Cancel previous in-flight fetch
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const result = await chatService.listMessages(conversationId, {
        signal: controller.signal,
      });
      if (!mountedRef.current || controller.signal.aborted) return;
      setMessages(result.messages);
      setHasMore(result.has_more);
      if (result.messages.length > 0) {
        oldestMessageRef.current = result.messages[0].created_at;
      }
    } catch (err) {
      if (isAbortError(err) || !mountedRef.current) return;
      console.error('[useChatMessages] Failed to load messages:', err);
    } finally {
      if (mountedRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [conversationId, profile?.id]);

  // Initial fetch — reset state and cancel prior request
  useEffect(() => {
    setMessages([]);
    oldestMessageRef.current = null;
    fetchMessages();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchMessages]);

  // Unmount guard
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Realtime: new messages in this conversation
  useEffect(() => {
    if (!conversationId || !profile?.id) return;

    const channel = chatService.subscribeToMessages(conversationId, (newMsg) => {
      if (!mountedRef.current) return;
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      // Auto-mark as read since we're viewing the conversation (fire-and-forget)
      chatService.markRead(conversationId).catch(() => {});
    });

    return () => {
      chatService.unsubscribeFromMessages(conversationId);
    };
  }, [conversationId, profile?.id]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !oldestMessageRef.current || !hasMore) return;
    try {
      const result = await chatService.listMessages(conversationId, {
        before: oldestMessageRef.current,
      });
      if (!mountedRef.current) return;
      setMessages((prev) => [...result.messages, ...prev]);
      setHasMore(result.has_more);
      if (result.messages.length > 0) {
        oldestMessageRef.current = result.messages[0].created_at;
      }
    } catch (err) {
      if (isAbortError(err) || !mountedRef.current) return;
      console.error('[useChatMessages] Failed to load more:', err);
    }
  }, [conversationId, hasMore]);

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!conversationId) return;
      setSending(true);
      try {
        const msg = await chatService.sendMessage(conversationId, content, replyToId);
        if (!mountedRef.current) return;
        // The realtime subscription will add it, but add optimistically for instant feel
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } finally {
        if (mountedRef.current) setSending(false);
      }
    },
    [conversationId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;
      await chatService.deleteMessage(messageId);
      if (!mountedRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true, content: null } : m,
        ),
      );
    },
    [conversationId],
  );

  return {
    messages,
    loading,
    hasMore,
    sending,
    loadMore,
    sendMessage,
    deleteMessage,
    refresh: fetchMessages,
  };
}
