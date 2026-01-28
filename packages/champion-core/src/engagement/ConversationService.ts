// ============================================================================
// Conversation Service — Manages inbox conversations
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  Conversation,
  ConversationWithLead,
  Message,
  SendMessageInput,
  InboxSummary,
} from './types';

export class ConversationService {
  /**
   * Get all conversations for an org
   */
  async getConversations(
    orgId: string,
    options: {
      status?: 'active' | 'archived' | 'spam';
      channel?: 'sms' | 'email' | 'both';
      assignedTo?: string;
      unreadOnly?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ConversationWithLead[]> {
    let query = supabase
      .from('conversations')
      .select(`
        *,
        lead:zoho_lead_submissions(id, first_name, last_name, email, phone, pipeline_stage)
      `)
      .eq('org_id', orgId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (options.status) {
      query = query.eq('status', options.status);
    } else {
      query = query.eq('status', 'active');
    }

    if (options.channel && options.channel !== 'both') {
      query = query.or(`channel.eq.${options.channel},channel.eq.both`);
    }

    if (options.assignedTo) {
      query = query.eq('assigned_to', options.assignedTo);
    }

    if (options.unreadOnly) {
      query = query.gt('unread_count', 0);
    }

    if (options.search) {
      query = query.or(
        `participant_name.ilike.%${options.search}%,participant_email.ilike.%${options.search}%,participant_phone.ilike.%${options.search}%`
      );
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ConversationService] Failed to get conversations:', error);
      throw error;
    }

    return (data || []) as ConversationWithLead[];
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId: string): Promise<ConversationWithLead | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        lead:zoho_lead_submissions(id, first_name, last_name, email, phone, pipeline_stage)
      `)
      .eq('id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[ConversationService] Failed to get conversation:', error);
      throw error;
    }

    return data as ConversationWithLead | null;
  }

  /**
   * Get or create a conversation for a lead
   */
  async getOrCreateForLead(
    orgId: string,
    leadId: string,
    channel: 'sms' | 'email' | 'both' = 'both'
  ): Promise<string> {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_org_id: orgId,
      p_lead_id: leadId,
      p_channel: channel,
    });

    if (error) {
      console.error('[ConversationService] Failed to get/create conversation:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options: { limit?: number; before?: string } = {}
  ): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (options.before) {
      query = query.lt('created_at', options.before);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ConversationService] Failed to get messages:', error);
      throw error;
    }

    // Return in chronological order
    return (data || []).reverse() as Message[];
  }

  /**
   * Send a message
   */
  async sendMessage(orgId: string, input: SendMessageInput): Promise<string> {
    const { data, error } = await supabase.rpc('send_message', {
      p_org_id: orgId,
      p_conversation_id: input.conversation_id,
      p_channel: input.channel,
      p_content: input.content,
      p_subject: input.subject || null,
      p_body_html: input.body_html || null,
      p_to_address: input.to_address || null,
    });

    if (error) {
      console.error('[ConversationService] Failed to send message:', error);
      throw error;
    }

    return data;
  }

  /**
   * Mark a conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
    });

    if (error) {
      console.error('[ConversationService] Failed to mark as read:', error);
      throw error;
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('[ConversationService] Failed to archive conversation:', error);
      throw error;
    }
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('[ConversationService] Failed to unarchive conversation:', error);
      throw error;
    }
  }

  /**
   * Assign conversation to a user
   */
  async assignTo(conversationId: string, userId: string | null): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ assigned_to: userId, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('[ConversationService] Failed to assign conversation:', error);
      throw error;
    }
  }

  /**
   * Get inbox summary/stats
   */
  async getInboxSummary(orgId: string, userId?: string): Promise<InboxSummary> {
    const { data, error } = await supabase.rpc('get_inbox_summary', {
      p_org_id: orgId,
      p_user_id: userId || null,
    });

    if (error) {
      console.error('[ConversationService] Failed to get inbox summary:', error);
      throw error;
    }

    return data[0] || {
      total_conversations: 0,
      unread_conversations: 0,
      active_sequences: 0,
      pending_messages: 0,
    };
  }

  /**
   * Subscribe to real-time conversation updates
   */
  subscribeToConversations(
    orgId: string,
    callback: (payload: { new: Conversation; old: Conversation }) => void
  ) {
    return supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `org_id=eq.${orgId}`,
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time message updates for a conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (payload: { new: Message }) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe();
  }
}

export const conversationService = new ConversationService();
