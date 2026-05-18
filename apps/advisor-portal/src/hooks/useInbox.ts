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
import { useAdvisor } from '../contexts/AdvisorContext';

export function useConversations(options: {
  status?: 'active' | 'archived' | 'spam';
  channel?: 'sms' | 'email' | 'both';
  unreadOnly?: boolean;
  search?: string;
} = {}) {
  const { profile, loading: authLoading, profileLoading } = useAdvisor();
  const orgContextLoading = authLoading || profileLoading;
  const [conversations, setConversations] = useState<ConversationWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (orgContextLoading) return;

    if (!profile?.org_id) {
      setConversations([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await conversationService.getConversations(profile!.org_id, options);
      setConversations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversations'));
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, orgContextLoading, options.status, options.channel, options.unreadOnly, options.search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile?.org_id) return;

    const subscription = conversationService.subscribeToConversations(
      profile!.org_id,
      () => {
        refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.org_id, refresh]);

  return { conversations, loading, error, refresh };
}

export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<ConversationWithLead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setError(null);
      setLoading(false);
      return;
    }
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
  const { profile, loading: authLoading, profileLoading } = useAdvisor();
  const orgContextLoading = authLoading || profileLoading;
  const [summary, setSummary] = useState<InboxSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (orgContextLoading) return;

    if (!profile?.org_id) {
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      const data = await conversationService.getInboxSummary(profile!.org_id);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load inbox summary:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, orgContextLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, refresh };
}

export function useTemplates(channel?: 'sms' | 'email' | 'both') {
  const { profile, loading: authLoading, profileLoading } = useAdvisor();
  const orgContextLoading = authLoading || profileLoading;
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (orgContextLoading) return;

    if (!profile?.org_id) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await templateService.getTemplates(profile!.org_id, { channel });
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, orgContextLoading, channel]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { templates, loading, refresh };
}

export function useSequences(status?: 'draft' | 'active' | 'paused' | 'archived') {
  const { profile, loading: authLoading, profileLoading } = useAdvisor();
  const orgContextLoading = authLoading || profileLoading;
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (orgContextLoading) return;

    if (!profile?.org_id) {
      setSequences([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await sequenceService.getSequences(profile!.org_id, { status });
      setSequences(data as unknown as Sequence[]);
    } catch (err) {
      console.error('Failed to load sequences:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, orgContextLoading, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sequences, loading, refresh };
}

export function useInboxActions() {
  const { profile } = useAdvisor();

  const sendMessage = useCallback(
    async (
      conversationId: string,
      channel: 'sms' | 'email',
      content: string,
      options?: { subject?: string; bodyHtml?: string }
    ) => {
      if (!profile?.org_id) throw new Error('No active organization');
      return conversationService.sendMessage(profile!.org_id, {
        conversation_id: conversationId,
        channel,
        content,
        subject: options?.subject,
        body_html: options?.bodyHtml,
      });
    },
    [profile?.org_id]
  );

  const archiveConversation = useCallback(async (conversationId: string) => {
    await conversationService.archiveConversation(conversationId);
  }, []);

  const getOrCreateConversation = useCallback(
    async (leadId: string, channel: 'sms' | 'email' | 'both' = 'both') => {
      if (!profile?.org_id) throw new Error('No active organization');
      return conversationService.getOrCreateForLead(profile!.org_id, leadId, channel);
    },
    [profile?.org_id]
  );

  const enrollInSequence = useCallback(
    async (sequenceId: string, leadId: string) => {
      if (!profile?.org_id) throw new Error('No active organization');
      return sequenceService.enrollLead(profile!.org_id, sequenceId, leadId);
    },
    [profile?.org_id]
  );

  return {
    sendMessage,
    archiveConversation,
    getOrCreateConversation,
    enrollInSequence,
  };
}
