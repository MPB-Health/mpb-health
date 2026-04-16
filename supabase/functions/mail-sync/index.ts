// ============================================================================
// Mail Sync - Delta sync for folders, threads, and messages
// Syncs from Microsoft Graph and Gmail APIs into mail_messages table
// Deploy: supabase functions deploy mail-sync
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { requireAuth, checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

// ============================================================================
// Types
// ============================================================================

interface GraphMessage {
  id: string;
  conversationId: string;
  internetMessageId?: string;
  subject: string;
  bodyPreview: string;
  body?: { contentType: string; content: string };
  from?: { emailAddress: { name: string; address: string } };
  toRecipients?: Array<{ emailAddress: { name: string; address: string } }>;
  ccRecipients?: Array<{ emailAddress: { name: string; address: string } }>;
  bccRecipients?: Array<{ emailAddress: { name: string; address: string } }>;
  replyTo?: Array<{ emailAddress: { name: string; address: string } }>;
  sentDateTime?: string;
  receivedDateTime?: string;
  isRead: boolean;
  isDraft: boolean;
  importance: string;
  flag?: { flagStatus: string };
  hasAttachments: boolean;
  categories?: string[];
  parentFolderId?: string;
  internetMessageHeaders?: Array<{ name: string; value: string }>;
}

interface GraphFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  unreadItemCount: number;
  totalItemCount: number;
  isHidden: boolean;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: {
    headers: Array<{ name: string; value: string }>;
    mimeType: string;
    body?: { data?: string; size: number };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; size: number; attachmentId?: string };
      filename?: string;
      headers?: Array<{ name: string; value: string }>;
    }>;
  };
  internalDate?: string;
  sizeEstimate?: number;
}

interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
  color?: { backgroundColor: string; textColor: string };
}

// ============================================================================
// Handler
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const TOKEN_ENCRYPTION_KEY = Deno.env.get('MAIL_TOKEN_ENCRYPTION_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate limit
    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 30,
      windowSeconds: 60,
      keyPrefix: 'mail-sync',
    });
    if (rateLimitResponse) return rateLimitResponse;

    // Auth
    const { user: authUser, errorResponse } = await requireAuth(req, supabase);
    if (errorResponse) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, account_id } = body;

    // Get account and decrypt access token
    const { data: account } = await supabase
      .from('mail_accounts')
      .select('id, org_id, user_id, provider, email_address, display_name, access_token_encrypted, refresh_token_encrypted, token_expires_at, scopes, sync_status, sync_error, is_active, provider_account_id, avatar_url, delta_token, provider_metadata, last_sync_at, created_at, updated_at')
      .eq('id', account_id)
      .eq('user_id', authUser.userId)
      .single();

    if (!account || !account.is_active) {
      return new Response(JSON.stringify({ error: 'Account not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt access token
    const { data: accessToken } = await supabase.rpc('decrypt_token', {
      encrypted: account.access_token_encrypted,
      key: TOKEN_ENCRYPTION_KEY,
    });

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Failed to decrypt token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check token expiry — refresh if needed
    if (account.token_expires_at && new Date(account.token_expires_at) <= new Date()) {
      // Call refresh via the oauth callback function
      const refreshRes = await fetch(`${SUPABASE_URL}/functions/v1/mail-oauth-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({ action: 'refresh_token', account_id }),
      });
      if (!refreshRes.ok) {
        return new Response(JSON.stringify({ error: 'Token expired, refresh failed' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update sync status
    await supabase.from('mail_accounts').update({ sync_status: 'syncing' }).eq('id', account_id);

    switch (action) {
      // ====================================================================
      // Sync folders / labels
      // ====================================================================
      case 'sync_folders': {
        if (account.provider === 'microsoft365') {
          await syncMicrosoftFolders(supabase, account_id, accessToken);
        } else if (account.provider === 'gmail') {
          await syncGmailLabels(supabase, account_id, accessToken);
        }

        await supabase.from('mail_accounts').update({
          sync_status: 'idle',
          last_sync_at: new Date().toISOString(),
        }).eq('id', account_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Sync messages (delta)
      // ====================================================================
      case 'sync_messages': {
        const { folder_id, max_results = 50 } = body;
        let newDeltaToken: string | null = null;
        let syncedCount = 0;

        if (account.provider === 'microsoft365') {
          const result = await syncMicrosoftMessages(
            supabase, account_id, accessToken,
            account.delta_token, folder_id, max_results
          );
          newDeltaToken = result.deltaToken;
          syncedCount = result.count;
        } else if (account.provider === 'gmail') {
          const result = await syncGmailMessages(
            supabase, account_id, accessToken,
            account.delta_token, max_results
          );
          newDeltaToken = result.historyId;
          syncedCount = result.count;
        }

        // Update account with new delta token
        await supabase.from('mail_accounts').update({
          sync_status: 'idle',
          last_sync_at: new Date().toISOString(),
          delta_token: newDeltaToken || account.delta_token,
          sync_error: null,
        }).eq('id', account_id);

        // Audit log
        await supabase.from('mail_audit_log').insert({
          org_id: account.org_id,
          user_id: authUser.userId,
          account_id,
          action: 'sync_messages',
          details: { synced_count: syncedCount, folder_id },
          ip_address: clientIp,
        });

        return new Response(JSON.stringify({ success: true, synced: syncedCount }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Fetch single message body
      // ====================================================================
      case 'fetch_message': {
        const { message_id } = body;

        // Get the message record
        const { data: msg } = await supabase
          .from('mail_messages')
          .select('id, account_id, folder_id, provider_message_id, provider_thread_id, internet_message_id, in_reply_to, from_address, from_name, to_addresses, cc_addresses, bcc_addresses, reply_to_address, subject, snippet, body_html, body_text, body_fetched, is_read, is_flagged, is_draft, has_attachments, importance, categories, sent_at, received_at')
          .eq('id', message_id)
          .eq('account_id', account_id)
          .single();

        if (!msg) {
          return new Response(JSON.stringify({ error: 'Message not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // If body already cached, return it
        if (msg.body_fetched && msg.body_html) {
          return new Response(JSON.stringify({
            success: true,
            body_html: msg.body_html,
            body_text: msg.body_text,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let bodyHtml = '';
        let bodyText = '';

        if (account.provider === 'microsoft365') {
          const res = await fetch(
            `https://graph.microsoft.com/v1.0/me/messages/${msg.provider_message_id}?$select=body`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.body.contentType === 'html') {
              bodyHtml = data.body.content;
            } else {
              bodyText = data.body.content;
            }
          }
        } else if (account.provider === 'gmail') {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.provider_message_id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (res.ok) {
            const data: GmailMessage = await res.json();
            const extracted = extractGmailBody(data);
            bodyHtml = extracted.html;
            bodyText = extracted.text;
          }
        }

        // Cache the body
        await supabase.from('mail_messages').update({
          body_html: bodyHtml || null,
          body_text: bodyText || null,
          body_fetched: true,
        }).eq('id', message_id);

        return new Response(JSON.stringify({
          success: true,
          body_html: bodyHtml,
          body_text: bodyText,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Mark message read/unread
      // ====================================================================
      case 'mark_read': {
        const { message_id, is_read } = body;

        const { data: msg } = await supabase
          .from('mail_messages')
          .select('provider_message_id')
          .eq('id', message_id)
          .eq('account_id', account_id)
          .single();

        if (!msg) {
          return new Response(JSON.stringify({ error: 'Message not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (account.provider === 'microsoft365') {
          await fetch(`https://graph.microsoft.com/v1.0/me/messages/${msg.provider_message_id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isRead: is_read }),
          });
        } else if (account.provider === 'gmail') {
          const body_payload: Record<string, string[]> = is_read
            ? { removeLabelIds: ['UNREAD'] }
            : { addLabelIds: ['UNREAD'] };
          await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.provider_message_id}/modify`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body_payload),
          });
        }

        await supabase.from('mail_messages').update({ is_read }).eq('id', message_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Toggle flag/star
      // ====================================================================
      case 'toggle_flag': {
        const { message_id, is_flagged } = body;

        const { data: msg } = await supabase
          .from('mail_messages')
          .select('provider_message_id')
          .eq('id', message_id)
          .eq('account_id', account_id)
          .single();

        if (!msg) {
          return new Response(JSON.stringify({ error: 'Message not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (account.provider === 'microsoft365') {
          await fetch(`https://graph.microsoft.com/v1.0/me/messages/${msg.provider_message_id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              flag: { flagStatus: is_flagged ? 'flagged' : 'notFlagged' },
            }),
          });
        } else if (account.provider === 'gmail') {
          const body_payload: Record<string, string[]> = is_flagged
            ? { addLabelIds: ['STARRED'] }
            : { removeLabelIds: ['STARRED'] };
          await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.provider_message_id}/modify`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body_payload),
          });
        }

        await supabase.from('mail_messages').update({ is_flagged }).eq('id', message_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Move message to folder
      // ====================================================================
      case 'move_message': {
        const { message_id, target_folder_id } = body;

        const { data: msg } = await supabase
          .from('mail_messages')
          .select('provider_message_id')
          .eq('id', message_id)
          .eq('account_id', account_id)
          .single();

        const { data: folder } = await supabase
          .from('mail_folders')
          .select('provider_folder_id')
          .eq('id', target_folder_id)
          .single();

        if (!msg || !folder) {
          return new Response(JSON.stringify({ error: 'Message or folder not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (account.provider === 'microsoft365') {
          await fetch(`https://graph.microsoft.com/v1.0/me/messages/${msg.provider_message_id}/move`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ destinationId: folder.provider_folder_id }),
          });
        } else if (account.provider === 'gmail') {
          // Get current labels to remove, add new label
          await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.provider_message_id}/modify`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ addLabelIds: [folder.provider_folder_id] }),
          });
        }

        await supabase.from('mail_messages').update({ folder_id: target_folder_id }).eq('id', message_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Delete message (move to trash)
      // ====================================================================
      case 'delete_message': {
        const { message_id } = body;

        const { data: msg } = await supabase
          .from('mail_messages')
          .select('provider_message_id')
          .eq('id', message_id)
          .eq('account_id', account_id)
          .single();

        if (!msg) {
          return new Response(JSON.stringify({ error: 'Message not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (account.provider === 'microsoft365') {
          // Move to Deleted Items
          await fetch(`https://graph.microsoft.com/v1.0/me/messages/${msg.provider_message_id}/move`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ destinationId: 'deleteditems' }),
          });
        } else if (account.provider === 'gmail') {
          await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.provider_message_id}/trash`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }

        // Get trash folder
        const { data: trashFolder } = await supabase
          .from('mail_folders')
          .select('id')
          .eq('account_id', account_id)
          .eq('folder_type', 'trash')
          .single();

        await supabase.from('mail_messages').update({
          folder_id: trashFolder?.id || null,
        }).eq('id', message_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// Microsoft Graph Sync Helpers
// ============================================================================

async function syncMicrosoftFolders(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  accessToken: string
) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders?$top=100', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Microsoft folders');

  const data = await res.json();
  const folders: GraphFolder[] = data.value;

  const folderTypeMap: Record<string, string> = {
    Inbox: 'inbox',
    'Sent Items': 'sent',
    Drafts: 'drafts',
    'Deleted Items': 'trash',
    'Junk Email': 'junk',
    Archive: 'archive',
  };

  for (const folder of folders) {
    await supabase.from('mail_folders').upsert({
      account_id: accountId,
      provider_folder_id: folder.id,
      name: folder.displayName,
      display_name: folder.displayName,
      folder_type: folderTypeMap[folder.displayName] || 'custom',
      unread_count: folder.unreadItemCount,
      total_count: folder.totalItemCount,
      is_hidden: folder.isHidden,
      last_sync_at: new Date().toISOString(),
    }, {
      onConflict: 'account_id,provider_folder_id',
    });
  }
}

async function syncMicrosoftMessages(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  accessToken: string,
  deltaToken: string | null,
  folderId: string | null,
  maxResults: number
): Promise<{ deltaToken: string | null; count: number }> {
  let url: string;

  if (deltaToken && !folderId) {
    // Delta sync using stored delta link
    url = deltaToken;
  } else {
    const folder = folderId || 'inbox';
    url = `https://graph.microsoft.com/v1.0/me/mailFolders/${folder}/messages/delta?` +
      `$select=subject,bodyPreview,from,toRecipients,ccRecipients,bccRecipients,` +
      `sentDateTime,receivedDateTime,isRead,isDraft,importance,flag,hasAttachments,` +
      `categories,parentFolderId,conversationId,internetMessageId&` +
      `$top=${maxResults}&$orderby=receivedDateTime desc`;
  }

  let count = 0;
  let nextDeltaToken: string | null = null;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('Graph delta sync failed:', await res.text());
      break;
    }

    const data = await res.json();
    const messages: GraphMessage[] = data.value || [];

    // Get folder mapping
    const { data: folders } = await supabase
      .from('mail_folders')
      .select('id, provider_folder_id')
      .eq('account_id', accountId);
    const folderMap = new Map(folders?.map(f => [f.provider_folder_id, f.id]) || []);

    for (const msg of messages) {
      const inReplyTo = msg.internetMessageHeaders?.find(h => h.name === 'In-Reply-To')?.value;

      await supabase.from('mail_messages').upsert({
        account_id: accountId,
        folder_id: msg.parentFolderId ? folderMap.get(msg.parentFolderId) || null : null,
        provider_message_id: msg.id,
        provider_thread_id: msg.conversationId,
        internet_message_id: msg.internetMessageId || null,
        in_reply_to: inReplyTo || null,
        from_address: msg.from?.emailAddress?.address || null,
        from_name: msg.from?.emailAddress?.name || null,
        to_addresses: (msg.toRecipients || []).map(r => ({
          email: r.emailAddress.address,
          name: r.emailAddress.name,
        })),
        cc_addresses: (msg.ccRecipients || []).map(r => ({
          email: r.emailAddress.address,
          name: r.emailAddress.name,
        })),
        bcc_addresses: (msg.bccRecipients || []).map(r => ({
          email: r.emailAddress.address,
          name: r.emailAddress.name,
        })),
        subject: msg.subject,
        snippet: msg.bodyPreview,
        is_read: msg.isRead,
        is_flagged: msg.flag?.flagStatus === 'flagged',
        is_draft: msg.isDraft,
        has_attachments: msg.hasAttachments,
        importance: msg.importance || 'normal',
        categories: msg.categories || [],
        sent_at: msg.sentDateTime,
        received_at: msg.receivedDateTime,
      }, {
        onConflict: 'account_id,provider_message_id',
      });
      count++;
    }

    // Check for next page or delta link
    if (data['@odata.nextLink']) {
      url = data['@odata.nextLink'];
    } else {
      nextDeltaToken = data['@odata.deltaLink'] || null;
      url = '';
    }
  }

  return { deltaToken: nextDeltaToken, count };
}

// ============================================================================
// Gmail Sync Helpers
// ============================================================================

async function syncGmailLabels(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  accessToken: string
) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Gmail labels');

  const data = await res.json();
  const labels: GmailLabel[] = data.labels || [];

  const labelTypeMap: Record<string, string> = {
    INBOX: 'inbox',
    SENT: 'sent',
    DRAFT: 'drafts',
    TRASH: 'trash',
    SPAM: 'junk',
    STARRED: 'starred',
    IMPORTANT: 'important',
  };

  for (const label of labels) {
    // Skip some system labels
    if (['UNREAD', 'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS',
         'CATEGORY_UPDATES', 'CATEGORY_FORUMS'].includes(label.id)) continue;

    // Fetch full label info for counts
    let unreadCount = label.messagesUnread || 0;
    let totalCount = label.messagesTotal || 0;
    if (!label.messagesTotal && label.type === 'system') {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/labels/${label.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          unreadCount = detail.messagesUnread || 0;
          totalCount = detail.messagesTotal || 0;
        }
      } catch { /* skip */ }
    }

    await supabase.from('mail_folders').upsert({
      account_id: accountId,
      provider_folder_id: label.id,
      name: label.name,
      display_name: label.name.replace(/^CATEGORY_/, ''),
      folder_type: labelTypeMap[label.id] || 'custom',
      unread_count: unreadCount,
      total_count: totalCount,
      is_hidden: label.type === 'system' && !labelTypeMap[label.id],
      label_color: label.color ? label.color.backgroundColor : null,
      last_sync_at: new Date().toISOString(),
    }, {
      onConflict: 'account_id,provider_folder_id',
    });
  }
}

async function syncGmailMessages(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  accessToken: string,
  historyId: string | null,
  maxResults: number
): Promise<{ historyId: string | null; count: number }> {
  let count = 0;

  // Get folder mapping
  const { data: folders } = await supabase
    .from('mail_folders')
    .select('id, provider_folder_id')
    .eq('account_id', accountId);
  const folderMap = new Map(folders?.map(f => [f.provider_folder_id, f.id]) || []);

  if (historyId) {
    // Delta sync via history API
    const histRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (histRes.ok) {
      const histData = await histRes.json();
      const newHistoryId = histData.historyId;

      // Collect message IDs that changed
      const messageIds = new Set<string>();
      for (const record of histData.history || []) {
        for (const added of record.messagesAdded || []) {
          messageIds.add(added.message.id);
        }
        for (const changed of record.labelsAdded || []) {
          messageIds.add(changed.message.id);
        }
        for (const changed of record.labelsRemoved || []) {
          messageIds.add(changed.message.id);
        }
      }

      // Fetch each changed message
      for (const msgId of messageIds) {
        await fetchAndUpsertGmailMessage(supabase, accountId, accessToken, msgId, folderMap);
        count++;
      }

      return { historyId: newHistoryId, count };
    }
    // If history fails (expired), fall through to full sync
  }

  // Full sync: list messages
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!listRes.ok) {
    console.error('Gmail list failed:', await listRes.text());
    return { historyId, count: 0 };
  }

  const listData = await listRes.json();
  const messageStubs = listData.messages || [];

  // Get current profile for historyId
  const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();

  for (const stub of messageStubs) {
    await fetchAndUpsertGmailMessage(supabase, accountId, accessToken, stub.id, folderMap);
    count++;
  }

  return { historyId: profile.historyId, count };
}

async function fetchAndUpsertGmailMessage(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  accessToken: string,
  messageId: string,
  folderMap: Map<string, string>
) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Bcc&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=Message-ID&metadataHeaders=In-Reply-To&metadataHeaders=Reply-To`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return;

  const msg: GmailMessage = await res.json();
  const headers = new Map(msg.payload?.headers?.map(h => [h.name.toLowerCase(), h.value]) || []);

  // Parse addresses
  const fromRaw = headers.get('from') || '';
  const fromMatch = fromRaw.match(/^(?:"?([^"]*)"?\s*)?<?([^>]+)>?$/);
  const fromName = fromMatch?.[1]?.trim() || '';
  const fromAddress = fromMatch?.[2]?.trim() || fromRaw;

  const parseAddresses = (raw: string) => {
    if (!raw) return [];
    return raw.split(',').map(addr => {
      const match = addr.trim().match(/^(?:"?([^"]*)"?\s*)?<?([^>]+)>?$/);
      return {
        name: match?.[1]?.trim() || '',
        email: match?.[2]?.trim() || addr.trim(),
      };
    });
  };

  // Determine primary folder
  const labelIds = msg.labelIds || [];
  let primaryFolderId: string | null = null;
  for (const labelId of ['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM']) {
    if (labelIds.includes(labelId) && folderMap.has(labelId)) {
      primaryFolderId = folderMap.get(labelId) || null;
      break;
    }
  }

  const hasAttachments = msg.payload?.parts?.some(p => p.filename && p.filename.length > 0) || false;

  await supabase.from('mail_messages').upsert({
    account_id: accountId,
    folder_id: primaryFolderId,
    provider_message_id: msg.id,
    provider_thread_id: msg.threadId,
    internet_message_id: headers.get('message-id') || null,
    in_reply_to: headers.get('in-reply-to') || null,
    from_address: fromAddress,
    from_name: fromName,
    to_addresses: parseAddresses(headers.get('to') || ''),
    cc_addresses: parseAddresses(headers.get('cc') || ''),
    bcc_addresses: parseAddresses(headers.get('bcc') || ''),
    reply_to_address: headers.get('reply-to') || null,
    subject: headers.get('subject') || '(no subject)',
    snippet: msg.snippet || '',
    is_read: !labelIds.includes('UNREAD'),
    is_flagged: labelIds.includes('STARRED'),
    is_draft: labelIds.includes('DRAFT'),
    has_attachments: hasAttachments,
    categories: labelIds.filter(l => !['UNREAD', 'STARRED', 'DRAFT', 'INBOX', 'SENT', 'TRASH', 'SPAM', 'IMPORTANT'].includes(l)),
    sent_at: headers.get('date') ? new Date(headers.get('date')!).toISOString() : null,
    received_at: msg.internalDate ? new Date(parseInt(msg.internalDate)).toISOString() : null,
  }, {
    onConflict: 'account_id,provider_message_id',
  });

  // Sync attachments metadata
  if (hasAttachments && msg.payload?.parts) {
    for (const part of msg.payload.parts) {
      if (part.filename && part.body?.attachmentId) {
        await supabase.from('mail_message_attachments').upsert({
          message_id: undefined, // Will be resolved after message insert
          provider_attachment_id: part.body.attachmentId,
          file_name: part.filename,
          file_size: part.body.size || 0,
          content_type: part.mimeType,
          is_inline: part.headers?.some(h => h.name.toLowerCase() === 'content-disposition' && h.value.includes('inline')) || false,
        }, {
          onConflict: 'provider_attachment_id',
          ignoreDuplicates: true,
        });
      }
    }
  }
}

function extractGmailBody(msg: GmailMessage): { html: string; text: string } {
  let html = '';
  let text = '';

  function processPart(part: GmailMessage['payload']) {
    if (!part) return;
    if (part.mimeType === 'text/html' && part.body?.data) {
      html = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (part.mimeType === 'text/plain' && part.body?.data) {
      text = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    if (part.parts) {
      for (const subPart of part.parts) {
        processPart(subPart as GmailMessage['payload']);
      }
    }
  }

  processPart(msg.payload);
  return { html, text };
}
