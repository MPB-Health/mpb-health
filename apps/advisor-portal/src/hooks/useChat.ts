import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@mpbhealth/advisor-core';
import type { ChatConversation, ChatMessage } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

// ============================================================================
// Helpers
// ============================================================================

/** Returns true for errors produced by AbortController cancellation. */
function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/** System org-wide announcements channel slug (migration 20260429160000). */
const ADVISOR_ANNOUNCEMENTS_SLUG = 'advisor-announcements';

function sortChannelsForUi(list: ChatConversation[]) {
  return [...list].sort((a, b) => {
    const pin = (slug: string | null) => (slug === ADVISOR_ANNOUNCEMENTS_SLUG ? 0 : 1);
    const pinned = pin(a.slug) - pin(b.slug);
    if (pinned !== 0) return pinned;
    const aTime = new Date(a.last_message_at || a.created_at || 0).getTime();
    const bTime = new Date(b.last_message_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

function sortDirectMessages(list: ChatConversation[]) {
  return [...list].sort((a, b) => {
    const aTime = new Date(a.last_message_at || a.created_at || 0).getTime();
    const bTime = new Date(b.last_message_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

function normalizeConversationOrder(list: ChatConversation[]) {
  const channels = sortChannelsForUi(list.filter((c) => c.type === 'channel'));
  const dms = sortDirectMessages(list.filter((c) => c.type === 'direct'));
  return [...channels, ...dms];
}

// ============================================================================
// useChat — conversation list with unread badges + realtime
// ============================================================================

export function useChat() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const queryClient = useQueryClient();
  const advisorId = profile?.id ?? null;

  const query = useQuery({
    queryKey: ['chatConversations', advisorId] as const,
    queryFn: async ({ signal }) => {
      const data = await chatService.listConversations(signal);
      return normalizeConversationOrder(data);
    },
    enabled: Boolean(advisorReady && advisorId),
  });

  const refresh = useCallback(() => {
    if (!advisorId) return;
    void queryClient.invalidateQueries({ queryKey: ['chatConversations', advisorId] });
  }, [advisorId, queryClient]);

  useEffect(() => {
    if (!advisorReady || !advisorId) return;

    chatService.subscribeToConversationUpdates((updated) => {
      queryClient.setQueryData<ChatConversation[]>(['chatConversations', advisorId], (prev) => {
        if (!prev?.length) {
          void queryClient.invalidateQueries({ queryKey: ['chatConversations', advisorId] });
          return prev;
        }
        return normalizeConversationOrder(
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
        );
      });
    });

    return () => {
      chatService.unsubscribeFromConversationUpdates();
    };
  }, [advisorReady, advisorId, queryClient]);

  const conversations = query.data ?? [];
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const channels = useMemo(
    () => sortChannelsForUi(conversations.filter((c) => c.type === 'channel')),
    [conversations],
  );
  const directMessages = useMemo(
    () => sortDirectMessages(conversations.filter((c) => c.type === 'direct')),
    [conversations],
  );

  return {
    conversations,
    channels,
    directMessages,
    loading: query.isPending,
    error:
      query.isError &&
      !(query.error instanceof Error && isAbortError(query.error))
        ? 'Failed to load conversations'
        : null,
    totalUnread,
    refresh,
  };
}

// ============================================================================
// useChatMessages — messages for a conversation + send + realtime
// ============================================================================

export function useChatMessages(conversationId: string | null) {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const queryClient = useQueryClient();
  const advisorId = profile?.id ?? null;

  const [sending, setSending] = useState(false);

  const query = useQuery({
    queryKey: ['chatMessages', conversationId] as const,
    queryFn: async ({ signal }) => {
      const result = await chatService.listMessages(conversationId!, {
        signal,
      });
      return result;
    },
    enabled: Boolean(advisorReady && conversationId && advisorId),
  });

  useEffect(() => {
    if (!advisorReady || !conversationId || !advisorId) return;

    chatService.subscribeToMessages(conversationId, (newMsg) => {
      queryClient.setQueryData<{ messages: ChatMessage[]; has_more: boolean } | undefined>(
        ['chatMessages', conversationId],
        (prev) => {
          const messages = prev?.messages ?? [];
          if (messages.some((m) => m.id === newMsg.id)) return prev;
          const nextMsgs = [...messages, newMsg];
          return prev
            ? { ...prev, messages: nextMsgs }
            : { messages: nextMsgs, has_more: false };
        },
      );
      chatService.markRead(conversationId).catch(() => {});
    });

    return () => {
      chatService.unsubscribeFromMessages(conversationId);
    };
  }, [conversationId, advisorId, advisorReady, queryClient]);

  const oldestMessageTs = query.data?.messages?.[0]?.created_at ?? null;

  const loadMore = useCallback(async () => {
    if (!conversationId || !oldestMessageTs || !query.data?.has_more) return;
    try {
      const result = await chatService.listMessages(conversationId, {
        before: oldestMessageTs,
      });
      queryClient.setQueryData<{ messages: ChatMessage[]; has_more: boolean }>(
        ['chatMessages', conversationId],
        (prev) =>
          prev
            ? {
                ...prev,
                messages: [...result.messages, ...prev.messages],
                has_more: result.has_more,
              }
            : prev,
      );
    } catch (err) {
      if (!isAbortError(err)) console.error('[useChatMessages] Failed to load more:', err);
    }
  }, [conversationId, oldestMessageTs, query.data?.has_more, queryClient]);

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!conversationId) return;
      setSending(true);
      try {
        const msg = await chatService.sendMessage(conversationId, content, replyToId);
        queryClient.setQueryData<{ messages: ChatMessage[]; has_more: boolean }>(
          ['chatMessages', conversationId],
          (prev) => {
            if (!prev) return prev;
            if (prev.messages.some((m) => m.id === msg.id)) return prev;
            return { ...prev, messages: [...prev.messages, msg] };
          },
        );
      } finally {
        setSending(false);
      }
    },
    [conversationId, queryClient],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;
      await chatService.deleteMessage(messageId);
      queryClient.setQueryData<{ messages: ChatMessage[]; has_more: boolean }>(
        ['chatMessages', conversationId],
        (prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === messageId ? { ...m, is_deleted: true, content: null } : m,
                ),
              }
            : prev,
      );
    },
    [conversationId, queryClient],
  );

  const refresh = useCallback(() => {
    if (!conversationId) return;
    void queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] });
  }, [conversationId, queryClient]);

  return {
    messages: query.data?.messages ?? [],
    loading: query.isPending,
    hasMore: query.data?.has_more ?? false,
    sending,
    loadMore,
    sendMessage,
    deleteMessage,
    refresh,
  };
}
