// ============================================================================
// Mail Sync Service - Message queries, search, sync triggers
// Client-side service for the Connected Inbox
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MailMessage, MailMessageAttachment } from './mailAccountService';

// ============================================================================
// Types
// ============================================================================

export interface MailMessageFilters {
  account_id?: string;
  account_ids?: string[];
  folder_id?: string;
  folder_type?: string;
  is_read?: boolean;
  is_flagged?: boolean;
  is_draft?: boolean;
  has_attachments?: boolean;
  search?: string;
  from_address?: string;
  thread_id?: string;
  importance?: string;
  categories?: string[];
  date_from?: string;
  date_to?: string;
}

export interface MailMessageQueryOptions {
  page?: number;
  per_page?: number;
  order_by?: 'received_at' | 'sent_at' | 'subject' | 'from_address';
  order_dir?: 'asc' | 'desc';
}

export interface MailThread {
  thread_id: string;
  account_id: string;
  subject: string;
  messages: MailMessage[];
  participant_count: number;
  last_message_at: string;
  has_unread: boolean;
}

export interface MailSearchResult {
  messages: MailMessage[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface UnifiedInboxStats {
  total_unread: number;
  total_flagged: number;
  total_drafts: number;
  per_account: Array<{
    account_id: string;
    email_address: string;
    unread: number;
  }>;
  per_folder: Array<{
    folder_type: string;
    unread: number;
    total: number;
  }>;
}

// ============================================================================
// Service
// ============================================================================

export class MailSyncService {
  constructor(
    private supabase: SupabaseClient,
    private supabaseUrl: string
  ) {}

  // ========================================================================
  // Message Queries
  // ========================================================================

  async getMessages(
    filters: MailMessageFilters,
    options: MailMessageQueryOptions = {}
  ): Promise<MailSearchResult> {
    const {
      page = 1,
      per_page = 25,
      order_by = 'received_at',
      order_dir = 'desc',
    } = options;

    let query = this.supabase
      .from('mail_messages')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters.account_ids?.length) {
      query = query.in('account_id', filters.account_ids);
    }
    if (filters.folder_id) {
      query = query.eq('folder_id', filters.folder_id);
    }
    if (filters.folder_type) {
      // Join through mail_folders to filter by type
      query = query.not('folder_id', 'is', null);
    }
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }
    if (filters.is_flagged !== undefined) {
      query = query.eq('is_flagged', filters.is_flagged);
    }
    if (filters.is_draft !== undefined) {
      query = query.eq('is_draft', filters.is_draft);
    }
    if (filters.has_attachments) {
      query = query.eq('has_attachments', true);
    }
    if (filters.from_address) {
      query = query.ilike('from_address', `%${filters.from_address}%`);
    }
    if (filters.thread_id) {
      query = query.eq('provider_thread_id', filters.thread_id);
    }
    if (filters.importance) {
      query = query.eq('importance', filters.importance);
    }
    if (filters.date_from) {
      query = query.gte('received_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('received_at', filters.date_to);
    }

    // Full-text search
    if (filters.search) {
      query = query.textSearch(
        'subject',
        filters.search,
        { type: 'websearch' }
      );
    }

    // Pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;
    query = query
      .order(order_by, { ascending: order_dir === 'asc' })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      messages: data || [],
      total: count || 0,
      page,
      per_page,
      has_more: (count || 0) > page * per_page,
    };
  }

  async getMessage(id: string): Promise<MailMessage | null> {
    const { data, error } = await this.supabase
      .from('mail_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getMessageAttachments(messageId: string): Promise<MailMessageAttachment[]> {
    const { data, error } = await this.supabase
      .from('mail_message_attachments')
      .select('*')
      .eq('message_id', messageId);

    if (error) throw error;
    return data || [];
  }

  // ========================================================================
  // Thread Queries
  // ========================================================================

  async getThread(accountId: string, threadId: string): Promise<MailThread | null> {
    const { data: messages, error } = await this.supabase
      .from('mail_messages')
      .select('*')
      .eq('account_id', accountId)
      .eq('provider_thread_id', threadId)
      .order('received_at', { ascending: true });

    if (error || !messages?.length) return null;

    const participants = new Set<string>();
    for (const msg of messages) {
      if (msg.from_address) participants.add(msg.from_address);
      for (const to of msg.to_addresses || []) {
        if (to.email) participants.add(to.email);
      }
    }

    return {
      thread_id: threadId,
      account_id: accountId,
      subject: messages[0].subject || '(no subject)',
      messages,
      participant_count: participants.size,
      last_message_at: messages[messages.length - 1].received_at || messages[messages.length - 1].sent_at || '',
      has_unread: messages.some(m => !m.is_read),
    };
  }

  // ========================================================================
  // Fetch Message Body (lazy load from provider)
  // ========================================================================

  async fetchMessageBody(
    accountId: string,
    messageId: string
  ): Promise<{ body_html: string; body_text: string }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/mail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'fetch_message',
        account_id: accountId,
        message_id: messageId,
      }),
    });

    if (!res.ok) throw new Error('Failed to fetch message body');
    const data = await res.json();
    return { body_html: data.body_html || '', body_text: data.body_text || '' };
  }

  // ========================================================================
  // Message Actions (sync to provider)
  // ========================================================================

  async markRead(accountId: string, messageId: string, isRead: boolean): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Optimistic local update
    await this.supabase.from('mail_messages').update({ is_read: isRead }).eq('id', messageId);

    // Sync to provider
    await fetch(`${this.supabaseUrl}/functions/v1/mail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'mark_read',
        account_id: accountId,
        message_id: messageId,
        is_read: isRead,
      }),
    });
  }

  async toggleFlag(accountId: string, messageId: string, isFlagged: boolean): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    await this.supabase.from('mail_messages').update({ is_flagged: isFlagged }).eq('id', messageId);

    await fetch(`${this.supabaseUrl}/functions/v1/mail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'toggle_flag',
        account_id: accountId,
        message_id: messageId,
        is_flagged: isFlagged,
      }),
    });
  }

  async moveMessage(accountId: string, messageId: string, targetFolderId: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    await this.supabase.from('mail_messages').update({ folder_id: targetFolderId }).eq('id', messageId);

    await fetch(`${this.supabaseUrl}/functions/v1/mail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'move_message',
        account_id: accountId,
        message_id: messageId,
        target_folder_id: targetFolderId,
      }),
    });
  }

  async deleteMessage(accountId: string, messageId: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    await fetch(`${this.supabaseUrl}/functions/v1/mail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'delete_message',
        account_id: accountId,
        message_id: messageId,
      }),
    });
  }

  // ========================================================================
  // Sync Trigger
  // ========================================================================

  async triggerSync(accountId: string): Promise<{ synced: number }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/mail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'sync_messages',
        account_id: accountId,
        max_results: 50,
      }),
    });

    if (!res.ok) throw new Error('Sync failed');
    const data = await res.json();
    return { synced: data.synced || 0 };
  }

  // ========================================================================
  // Send via Connected Account
  // ========================================================================

  async sendViaProvider(
    accountId: string,
    params: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      html_body: string;
      text_body?: string;
      attachments?: Array<{ filename: string; content_base64: string; content_type: string }>;
      reply_to_provider_message_id?: string;
      importance?: string;
      schedule_send_at?: string;
    }
  ): Promise<{ provider_message_id: string }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/mail-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        account_id: accountId,
        ...params,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send email');
    }

    return res.json();
  }

  // ========================================================================
  // Unified Inbox Stats
  // ========================================================================

  async getUnifiedStats(accountIds: string[]): Promise<UnifiedInboxStats> {
    if (!accountIds.length) {
      return { total_unread: 0, total_flagged: 0, total_drafts: 0, per_account: [], per_folder: [] };
    }

    // Get unread counts per account
    const { data: unreadData } = await this.supabase
      .from('mail_messages')
      .select('account_id, is_read, is_flagged, is_draft')
      .in('account_id', accountIds);

    const perAccount = new Map<string, number>();
    let totalUnread = 0;
    let totalFlagged = 0;
    let totalDrafts = 0;

    for (const msg of unreadData || []) {
      if (!msg.is_read) {
        totalUnread++;
        perAccount.set(msg.account_id, (perAccount.get(msg.account_id) || 0) + 1);
      }
      if (msg.is_flagged) totalFlagged++;
      if (msg.is_draft) totalDrafts++;
    }

    // Get accounts for email addresses
    const { data: accounts } = await this.supabase
      .from('mail_accounts')
      .select('id, email_address')
      .in('id', accountIds);

    // Get folder stats
    const { data: folderData } = await this.supabase
      .from('mail_folders')
      .select('folder_type, unread_count, total_count')
      .in('account_id', accountIds)
      .not('folder_type', 'is', null);

    const folderStats = new Map<string, { unread: number; total: number }>();
    for (const f of folderData || []) {
      const existing = folderStats.get(f.folder_type) || { unread: 0, total: 0 };
      existing.unread += f.unread_count || 0;
      existing.total += f.total_count || 0;
      folderStats.set(f.folder_type, existing);
    }

    return {
      total_unread: totalUnread,
      total_flagged: totalFlagged,
      total_drafts: totalDrafts,
      per_account: (accounts || []).map(a => ({
        account_id: a.id,
        email_address: a.email_address,
        unread: perAccount.get(a.id) || 0,
      })),
      per_folder: Array.from(folderStats.entries()).map(([type, stats]) => ({
        folder_type: type,
        ...stats,
      })),
    };
  }
}

export function createMailSyncService(
  supabase: SupabaseClient,
  supabaseUrl: string
): MailSyncService {
  return new MailSyncService(supabase, supabaseUrl);
}
