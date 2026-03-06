// ============================================================================
// Mail Account Service - Connected Inbox account management
// Handles OAuth flow, account CRUD, sync triggers
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export type MailProvider = 'microsoft365' | 'gmail' | 'imap';
export type MailSyncStatus = 'idle' | 'syncing' | 'error' | 'disabled';

export interface MailAccount {
  id: string;
  org_id: string;
  user_id: string;
  provider: MailProvider;
  email_address: string;
  display_name: string | null;
  sync_status: MailSyncStatus;
  sync_error: string | null;
  last_sync_at: string | null;
  is_default: boolean;
  is_active: boolean;
  auto_sync: boolean;
  sync_interval_minutes: number;
  provider_account_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MailFolder {
  id: string;
  account_id: string;
  provider_folder_id: string;
  name: string;
  display_name: string | null;
  parent_folder_id: string | null;
  folder_type: string | null;
  unread_count: number;
  total_count: number;
  is_hidden: boolean;
  sort_order: number;
  label_color: string | null;
}

export interface MailMessage {
  id: string;
  account_id: string;
  folder_id: string | null;
  provider_message_id: string;
  provider_thread_id: string | null;
  from_address: string | null;
  from_name: string | null;
  to_addresses: Array<{ email: string; name: string }>;
  cc_addresses: Array<{ email: string; name: string }>;
  bcc_addresses: Array<{ email: string; name: string }>;
  subject: string | null;
  snippet: string | null;
  body_html: string | null;
  body_text: string | null;
  importance: string;
  is_read: boolean;
  is_flagged: boolean;
  is_draft: boolean;
  has_attachments: boolean;
  categories: string[];
  sent_at: string | null;
  received_at: string | null;
  body_fetched: boolean;
  created_at: string;
  updated_at: string;
}

export interface MailMessageAttachment {
  id: string;
  message_id: string;
  provider_attachment_id: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  is_inline: boolean;
}

export interface MailSharedAccess {
  id: string;
  account_id: string;
  grantee_user_id: string;
  permission: 'read' | 'send' | 'full';
  granted_by: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// Service
// ============================================================================

export class MailAccountService {
  constructor(
    private supabase: SupabaseClient,
    private supabaseUrl: string
  ) {}

  // ========================================================================
  // Account Management
  // ========================================================================

  async getAccounts(orgId: string): Promise<MailAccount[]> {
    const { data, error } = await this.supabase
      .from('mail_accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getAccount(id: string): Promise<MailAccount | null> {
    const { data, error } = await this.supabase
      .from('mail_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async setDefaultAccount(id: string, orgId: string): Promise<void> {
    // Clear existing defaults
    await this.supabase
      .from('mail_accounts')
      .update({ is_default: false })
      .eq('org_id', orgId);

    // Set new default
    await this.supabase
      .from('mail_accounts')
      .update({ is_default: true })
      .eq('id', id);
  }

  async updateAccount(
    id: string,
    updates: Partial<Pick<MailAccount, 'display_name' | 'auto_sync' | 'sync_interval_minutes'>>
  ): Promise<MailAccount | null> {
    const { data, error } = await this.supabase
      .from('mail_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ========================================================================
  // OAuth Flow
  // ========================================================================

  async getOAuthUrl(provider: MailProvider, orgId: string): Promise<string> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/mail-oauth-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'get_auth_url',
        provider,
        org_id: orgId,
      }),
    });

    if (!res.ok) throw new Error('Failed to get OAuth URL');
    const data = await res.json();
    return data.url;
  }

  async exchangeOAuthCode(
    code: string,
    provider: MailProvider,
    orgId: string
  ): Promise<{ account: MailAccount }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/mail-oauth-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'exchange_code',
        code,
        provider,
        org_id: orgId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'OAuth exchange failed');
    }
    return res.json();
  }

  async disconnectAccount(accountId: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/mail-oauth-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'disconnect',
        account_id: accountId,
      }),
    });

    if (!res.ok) throw new Error('Failed to disconnect account');
  }

  // ========================================================================
  // Folder Management
  // ========================================================================

  async getFolders(accountId: string): Promise<MailFolder[]> {
    const { data, error } = await this.supabase
      .from('mail_folders')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_hidden', false)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async syncFolders(accountId: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    await fetch(`${this.supabaseUrl}/functions/v1/mail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'sync_folders',
        account_id: accountId,
      }),
    });
  }

  // ========================================================================
  // Shared Access
  // ========================================================================

  async getSharedAccess(accountId: string): Promise<MailSharedAccess[]> {
    const { data, error } = await this.supabase
      .from('mail_shared_access')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async grantAccess(
    accountId: string,
    granteeUserId: string,
    permission: 'read' | 'send' | 'full'
  ): Promise<MailSharedAccess> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('mail_shared_access')
      .upsert({
        account_id: accountId,
        grantee_user_id: granteeUserId,
        permission,
        granted_by: user?.id,
        is_active: true,
      }, {
        onConflict: 'account_id,grantee_user_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async revokeAccess(accessId: string): Promise<void> {
    await this.supabase
      .from('mail_shared_access')
      .update({ is_active: false })
      .eq('id', accessId);
  }
}

export function createMailAccountService(
  supabase: SupabaseClient,
  supabaseUrl: string
): MailAccountService {
  return new MailAccountService(supabase, supabaseUrl);
}
