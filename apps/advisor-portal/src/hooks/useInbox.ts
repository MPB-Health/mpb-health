import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  conversationService,
  templateService,
  sequenceService,
  type ConversationWithLead,
  type Message,
  type MessageTemplate,
  type Sequence,
  type InboxSummary,
} from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';
export function useConversations(options: {
  status?: 'active' | 'archived' | 'spam';
  channel?: 'sms' | 'email' | 'both';
  unreadOnly?: boolean;
  search?: string;
} = {}) {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [
      'inboxConversations',
      orgId,
      options.status,
      options.channel,
      options.unreadOnly,
      options.search,
    ] as const,
    queryFn: () => conversationService.getConversations(orgId!, options),
    enabled: Boolean(advisorReady && orgId),
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['inboxConversations', orgId] });
  }, [queryClient, orgId]);

  useEffect(() => {
    if (!advisorReady || !orgId) return;

    const subscription = conversationService.subscribeToConversations(orgId, () => {
      void queryClient.invalidateQueries({ queryKey: ['inboxConversations', orgId] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [advisorReady, orgId, queryClient]);

  return {
    conversations: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

export function useConversation(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['inboxConversation', conversationId] as const,
    queryFn: async () => {
      const cid = conversationId!;
      const [convData, messagesData] = await Promise.all([
        conversationService.getConversation(cid),
        conversationService.getMessages(cid),
      ]);

      if (convData?.unread_count && convData.unread_count > 0) {
        try {
          await conversationService.markAsRead(cid);
        } catch {
          /* non-blocking */
        }
      }

      return {
        conversation: convData as ConversationWithLead,
        messages: messagesData as Message[],
      };
    },
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId) return;

    const subscription = conversationService.subscribeToMessages(conversationId, (payload) => {
      queryClient.setQueryData<{ conversation: ConversationWithLead | null; messages: Message[] }>(
        ['inboxConversation', conversationId],
        (prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, payload.new as Message],
              }
            : prev,
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, queryClient]);

  const refresh = useCallback(() => {
    if (!conversationId) return;
    void queryClient.invalidateQueries({ queryKey: ['inboxConversation', conversationId] });
  }, [conversationId, queryClient]);

  return {
    conversation: query.data?.conversation ?? null,
    messages: query.data?.messages ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

export function useInboxSummary() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['inboxSummary', orgId] as const,
    queryFn: () => conversationService.getInboxSummary(orgId!),
    enabled: Boolean(advisorReady && orgId),
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['inboxSummary', orgId] });
  }, [queryClient, orgId]);

  return {
    summary: query.data ?? null,
    loading: query.isPending,
    refresh,
  };
}

export function useTemplates(channel?: 'sms' | 'email' | 'both') {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messageTemplates', orgId, channel] as const,
    queryFn: () => templateService.getTemplates(orgId!, { channel }),
    enabled: Boolean(advisorReady && orgId),
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['messageTemplates', orgId] });
  }, [queryClient, orgId]);

  return {
    templates: query.data ?? [],
    loading: query.isPending,
    refresh,
  };
}

export function useSequences(status?: 'draft' | 'active' | 'paused' | 'archived') {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sequences', orgId, status] as const,
    queryFn: () => sequenceService.getSequences(orgId!, { status }),
    enabled: Boolean(advisorReady && orgId),
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['sequences', orgId] });
  }, [queryClient, orgId]);

  const sequencesData = query.data ?? [];
  const sequencesTyped = sequencesData as unknown as Sequence[];

  return {
    sequences: sequencesTyped,
    loading: query.isPending,
    refresh,
  };
}

export function useInboxActions() {
  const { profile } = useAdvisor();

  const sendMessage = useCallback(
    async (
      conversationId: string,
      channel: 'sms' | 'email',
      content: string,
      options?: { subject?: string; bodyHtml?: string },
    ) => {
      if (!profile?.org_id) throw new Error('No active organization');
      return conversationService.sendMessage(profile.org_id, {
        conversation_id: conversationId,
        channel,
        content,
        subject: options?.subject,
        body_html: options?.bodyHtml,
      });
    },
    [profile?.org_id],
  );

  const archiveConversation = useCallback(async (conversationId: string) => {
    await conversationService.archiveConversation(conversationId);
  }, []);

  const getOrCreateConversation = useCallback(
    async (leadId: string, channel: 'sms' | 'email' | 'both' = 'both') => {
      if (!profile?.org_id) throw new Error('No active organization');
      return conversationService.getOrCreateForLead(profile.org_id, leadId, channel);
    },
    [profile?.org_id],
  );

  const enrollInSequence = useCallback(
    async (sequenceId: string, leadId: string) => {
      if (!profile?.org_id) throw new Error('No active organization');
      return sequenceService.enrollLead(profile.org_id, sequenceId, leadId);
    },
    [profile?.org_id],
  );

  return {
    sendMessage,
    archiveConversation,
    getOrCreateConversation,
    enrollInSequence,
  };
}
