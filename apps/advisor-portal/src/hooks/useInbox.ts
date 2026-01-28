import { useState, useEffect, useCallback } from 'react';
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
import { useOrg } from '@mpbhealth/auth';

export function useConversations(options: {
  status?: 'active' | 'archived' | 'spam';
  channel?: 'sms' | 'email' | 'both';
  unreadOnly?: boolean;
  search?: string;
} = {}) {
  const { activeOrg } = useOrg();
  const [conversations, setConversations] = useState<ConversationWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      const data = await conversationService.getConversations(activeOrg.id, options);
      setConversations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversations'));
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id, options.status, options.channel, options.unreadOnly, options.search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!activeOrg?.id) return;

    const subscription = conversationService.subscribeToConversations(
      activeOrg.id,
      () => {
        refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [activeOrg?.id, refresh]);

  return { conversations, loading, error, refresh };
}

export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<ConversationWithLead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const [convData, messagesData] = await Promise.all([
        conversationService.getConversation(conversationId),
        conversationService.getMessages(conversationId),
      ]);
      setConversation(convData);
      setMessages(messagesData);
      setError(null);

      // Mark as read
      if (convData && convData.unread_count > 0) {
        await conversationService.markAsRead(conversationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversation'));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const subscription = conversationService.subscribeToMessages(
      conversationId,
      (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  return { conversation, messages, loading, error, refresh: loadConversation };
}

export function useInboxSummary() {
  const { activeOrg } = useOrg();
  const [summary, setSummary] = useState<InboxSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      const data = await conversationService.getInboxSummary(activeOrg.id);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load inbox summary:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, refresh };
}

export function useTemplates(channel?: 'sms' | 'email' | 'both') {
  const { activeOrg } = useOrg();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      const data = await templateService.getTemplates(activeOrg.id, { channel });
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id, channel]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { templates, loading, refresh };
}

export function useSequences(status?: 'draft' | 'active' | 'paused' | 'archived') {
  const { activeOrg } = useOrg();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      const data = await sequenceService.getSequences(activeOrg.id, { status });
      setSequences(data as Sequence[]);
    } catch (err) {
      console.error('Failed to load sequences:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sequences, loading, refresh };
}

export function useInboxActions() {
  const { activeOrg } = useOrg();

  const sendMessage = useCallback(
    async (
      conversationId: string,
      channel: 'sms' | 'email',
      content: string,
      options?: { subject?: string; bodyHtml?: string }
    ) => {
      if (!activeOrg?.id) throw new Error('No active organization');
      return conversationService.sendMessage(activeOrg.id, {
        conversation_id: conversationId,
        channel,
        content,
        subject: options?.subject,
        body_html: options?.bodyHtml,
      });
    },
    [activeOrg?.id]
  );

  const archiveConversation = useCallback(async (conversationId: string) => {
    await conversationService.archiveConversation(conversationId);
  }, []);

  const getOrCreateConversation = useCallback(
    async (leadId: string, channel: 'sms' | 'email' | 'both' = 'both') => {
      if (!activeOrg?.id) throw new Error('No active organization');
      return conversationService.getOrCreateForLead(activeOrg.id, leadId, channel);
    },
    [activeOrg?.id]
  );

  const enrollInSequence = useCallback(
    async (sequenceId: string, leadId: string) => {
      if (!activeOrg?.id) throw new Error('No active organization');
      return sequenceService.enrollLead(activeOrg.id, sequenceId, leadId);
    },
    [activeOrg?.id]
  );

  return {
    sendMessage,
    archiveConversation,
    getOrCreateConversation,
    enrollInSequence,
  };
}
