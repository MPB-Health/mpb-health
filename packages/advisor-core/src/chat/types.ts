export type ChatConversationType = 'direct' | 'group' | 'channel';
export type ChatMemberRole = 'member' | 'admin' | 'owner';

export interface ChatConversation {
  id: string;
  org_id: string;
  type: ChatConversationType;
  name: string | null;
  slug: string | null;
  description: string | null;
  is_admin_only_posting: boolean;
  is_archived: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Enriched fields from edge function
  unread_count: number;
  is_muted: boolean;
  my_role: ChatMemberRole;
  display_name: string;
}

export interface ChatMember {
  user_id: string;
  role: ChatMemberRole;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  display_name: string;
  avatar_url: string | null;
  status: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string | null;
  is_deleted: boolean;
  deleted_by: string | null;
  deleted_at: string | null;
  reply_to_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChatSearchResult {
  id: string;
  conversation_id: string;
  conversation_name: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  rank: number;
}

export interface ListMessagesResult {
  messages: ChatMessage[];
  has_more: boolean;
}

export interface CreateChannelOptions {
  name: string;
  description?: string;
  slug?: string;
  is_admin_only_posting?: boolean;
}

export interface ChatUserSearchResult {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  status: string;
}
