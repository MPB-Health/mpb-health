import { supabase } from '@mpbhealth/database';

export interface ChatConversationAdmin {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string | null;
  created_by: string;
  member_count: number;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatMessageAdmin {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
}

export interface ChatAdminStats {
  total_conversations: number;
  total_messages: number;
  active_today: number;
  total_channels: number;
}

export class ChatAdminService {
  async getConversations(filters?: {
    type?: string;
    search?: string;
    limit?: number;
  }): Promise<ChatConversationAdmin[]> {
    let query = supabase
      .from('chat_conversations')
      .select('id, type, name, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Enrich with counts
    const enriched: ChatConversationAdmin[] = [];
    for (const conv of data || []) {
      const [members, messages, lastMsg] = await Promise.all([
        supabase.from('chat_members').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id),
        supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id),
        supabase.from('chat_messages').select('created_at').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1),
      ]);
      enriched.push({
        ...conv,
        member_count: members.count || 0,
        message_count: messages.count || 0,
        last_message_at: lastMsg.data?.[0]?.created_at || null,
      });
    }

    return enriched;
  }

  async getMessages(conversationId: string, limit = 50): Promise<ChatMessageAdmin[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, conversation_id, sender_id, content, is_deleted, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((m) => ({ ...m, sender_name: null }));
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true, content: '[Message removed by admin]' })
      .eq('id', messageId);

    if (error) throw error;
  }

  async getStats(): Promise<ChatAdminStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [convos, messages, activeToday, channels] = await Promise.all([
      supabase.from('chat_conversations').select('id', { count: 'exact', head: true }),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('chat_conversations').select('id', { count: 'exact', head: true }).eq('type', 'channel'),
    ]);

    return {
      total_conversations: convos.count || 0,
      total_messages: messages.count || 0,
      active_today: activeToday.count || 0,
      total_channels: channels.count || 0,
    };
  }
}

export const chatAdminService = new ChatAdminService();
