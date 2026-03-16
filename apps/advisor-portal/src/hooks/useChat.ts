import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@mpbhealth/advisor-core';
import type { ChatConversation, ChatMessage, ListMessagesResult } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

// ============================================================================
// useChat — conversation list with unread badges + realtime
// ============================================================================

export function useChat() {
  const { profile } = useAdvisor();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await chatService.listConversations();
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('[useChat] Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime: conversation updates (last_message_at, preview)
  useEffect(() => {
    if (!profile?.id) return;

    const channel = chatService.subscribeToConversationUpdates((updated) => {
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

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !profile?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const result = await chatService.listMessages(conversationId);
      setMessages(result.messages);
      setHasMore(result.has_more);
      if (result.messages.length > 0) {
        oldestMessageRef.current = result.messages[0].created_at;
      }
    } catch (err) {
      console.error('[useChatMessages] Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, profile?.id]);

  // Initial fetch
  useEffect(() => {
    setMessages([]);
    oldestMessageRef.current = null;
    fetchMessages();
  }, [fetchMessages]);

  // Realtime: new messages in this conversation
  useEffect(() => {
    if (!conversationId || !profile?.id) return;

    const channel = chatService.subscribeToMessages(conversationId, (newMsg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      // Auto-mark as read since we're viewing the conversation
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
      setMessages((prev) => [...result.messages, ...prev]);
      setHasMore(result.has_more);
      if (result.messages.length > 0) {
        oldestMessageRef.current = result.messages[0].created_at;
      }
    } catch (err) {
      console.error('[useChatMessages] Failed to load more:', err);
    }
  }, [conversationId, hasMore]);

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!conversationId) return;
      setSending(true);
      try {
        const msg = await chatService.sendMessage(conversationId, content, replyToId);
        // The realtime subscription will add it, but add optimistically for instant feel
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;
      await chatService.deleteMessage(messageId);
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
