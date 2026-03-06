// ============================================================================
// Mail Send - Send email via connected M365/Gmail accounts
// Supports reply, forward, attachments, signatures, scheduled send
// Deploy: supabase functions deploy mail-send
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { requireAuth, checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

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

    // Rate limit: 15 emails/minute
    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 15,
      windowSeconds: 60,
      keyPrefix: 'mail-send',
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { user: authUser, errorResponse } = await requireAuth(req, supabase);
    if (errorResponse) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      account_id,
      to,
      cc,
      bcc,
      subject,
      html_body,
      text_body,
      attachments, // [{filename, content_base64, content_type}]
      reply_to_provider_message_id,
      importance = 'normal',
      schedule_send_at, // ISO string for scheduled send (M365 only)
      save_to_sent = true,
    } = body;

    // Get account
    const { data: account } = await supabase
      .from('mail_accounts')
      .select('*')
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

    let providerMessageId: string | null = null;

    // ====================================================================
    // Microsoft 365 - Send via Graph API
    // ====================================================================
    if (account.provider === 'microsoft365') {
      const message: Record<string, unknown> = {
        subject,
        body: {
          contentType: 'HTML',
          content: html_body,
        },
        toRecipients: to.map((email: string) => ({
          emailAddress: { address: email },
        })),
        importance,
      };

      if (cc?.length) {
        message.ccRecipients = cc.map((email: string) => ({
          emailAddress: { address: email },
        }));
      }
      if (bcc?.length) {
        message.bccRecipients = bcc.map((email: string) => ({
          emailAddress: { address: email },
        }));
      }

      // Scheduled send (M365 natively supports this)
      if (schedule_send_at) {
        message.singleValueExtendedProperties = [{
          id: 'SystemTime 0x3FEF',
          value: new Date(schedule_send_at).toISOString(),
        }];
      }

      if (reply_to_provider_message_id) {
        // Reply
        const replyRes = await fetch(
          `https://graph.microsoft.com/v1.0/me/messages/${reply_to_provider_message_id}/reply`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                body: { contentType: 'HTML', content: html_body },
                toRecipients: to.map((email: string) => ({ emailAddress: { address: email } })),
              },
            }),
          }
        );

        if (!replyRes.ok) {
          const err = await replyRes.text();
          console.error('Graph reply failed:', err);
          return new Response(JSON.stringify({ error: 'Failed to send reply' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // New message - create draft first (to handle attachments), then send
        if (attachments?.length) {
          // Create draft
          const draftRes = await fetch('https://graph.microsoft.com/v1.0/me/messages', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
          });

          if (!draftRes.ok) {
            return new Response(JSON.stringify({ error: 'Failed to create draft' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const draft = await draftRes.json();
          providerMessageId = draft.id;

          // Attach files
          for (const att of attachments) {
            await fetch(`https://graph.microsoft.com/v1.0/me/messages/${draft.id}/attachments`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: att.filename,
                contentBytes: att.content_base64,
                contentType: att.content_type,
              }),
            });
          }

          // Send the draft
          const sendRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${draft.id}/send`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!sendRes.ok) {
            const err = await sendRes.text();
            console.error('Graph send draft failed:', err);
            return new Response(JSON.stringify({ error: 'Failed to send email' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          // Simple send (no attachments)
          const sendRes = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, saveToSentItems: save_to_sent }),
          });

          if (!sendRes.ok) {
            const err = await sendRes.text();
            console.error('Graph sendMail failed:', err);
            return new Response(JSON.stringify({ error: 'Failed to send email' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    }

    // ====================================================================
    // Gmail - Send via Gmail API
    // ====================================================================
    else if (account.provider === 'gmail') {
      // Build RFC 2822 message
      const boundary = `boundary_${crypto.randomUUID().replace(/-/g, '')}`;
      const hasAttach = attachments?.length > 0;

      let rawMessage = '';
      rawMessage += `From: ${account.display_name} <${account.email_address}>\r\n`;
      rawMessage += `To: ${to.join(', ')}\r\n`;
      if (cc?.length) rawMessage += `Cc: ${cc.join(', ')}\r\n`;
      if (bcc?.length) rawMessage += `Bcc: ${bcc.join(', ')}\r\n`;
      rawMessage += `Subject: ${subject}\r\n`;
      rawMessage += `MIME-Version: 1.0\r\n`;

      if (reply_to_provider_message_id) {
        // For replies, we need to set In-Reply-To and References
        const { data: origMsg } = await supabase
          .from('mail_messages')
          .select('internet_message_id, provider_thread_id')
          .eq('provider_message_id', reply_to_provider_message_id)
          .eq('account_id', account_id)
          .single();

        if (origMsg?.internet_message_id) {
          rawMessage += `In-Reply-To: ${origMsg.internet_message_id}\r\n`;
          rawMessage += `References: ${origMsg.internet_message_id}\r\n`;
        }
      }

      if (hasAttach) {
        rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
        rawMessage += `--${boundary}\r\n`;
        rawMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
        rawMessage += `${html_body}\r\n`;

        for (const att of attachments) {
          rawMessage += `--${boundary}\r\n`;
          rawMessage += `Content-Type: ${att.content_type}; name="${att.filename}"\r\n`;
          rawMessage += `Content-Transfer-Encoding: base64\r\n`;
          rawMessage += `Content-Disposition: attachment; filename="${att.filename}"\r\n\r\n`;
          rawMessage += `${att.content_base64}\r\n`;
        }
        rawMessage += `--${boundary}--`;
      } else {
        rawMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
        rawMessage += html_body;
      }

      // Base64url encode
      const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const sendPayload: Record<string, unknown> = { raw: encoded };

      // Thread the reply
      if (reply_to_provider_message_id) {
        const { data: origMsg } = await supabase
          .from('mail_messages')
          .select('provider_thread_id')
          .eq('provider_message_id', reply_to_provider_message_id)
          .eq('account_id', account_id)
          .single();
        if (origMsg?.provider_thread_id) {
          sendPayload.threadId = origMsg.provider_thread_id;
        }
      }

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendPayload),
      });

      if (!sendRes.ok) {
        const err = await sendRes.text();
        console.error('Gmail send failed:', err);
        return new Response(JSON.stringify({ error: 'Failed to send email' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sentMsg = await sendRes.json();
      providerMessageId = sentMsg.id;
    }

    // ====================================================================
    // Log to mail_messages table (sent message)
    // ====================================================================
    const bodyPreview = html_body
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);

    if (providerMessageId || !reply_to_provider_message_id) {
      await supabase.from('mail_messages').insert({
        account_id,
        provider_message_id: providerMessageId || `local_${crypto.randomUUID()}`,
        provider_thread_id: null, // Will be updated on next sync
        from_address: account.email_address,
        from_name: account.display_name,
        to_addresses: to.map((email: string) => ({ email, name: '' })),
        cc_addresses: (cc || []).map((email: string) => ({ email, name: '' })),
        bcc_addresses: (bcc || []).map((email: string) => ({ email, name: '' })),
        subject,
        snippet: bodyPreview,
        body_html: html_body,
        body_text: text_body || null,
        body_fetched: true,
        is_read: true,
        is_draft: false,
        has_attachments: (attachments?.length || 0) > 0,
        importance,
        sent_at: new Date().toISOString(),
        received_at: new Date().toISOString(),
      });
    }

    // Audit log
    await supabase.from('mail_audit_log').insert({
      org_id: account.org_id,
      user_id: authUser.userId,
      account_id,
      action: 'send_email',
      details: {
        to,
        subject,
        has_attachments: (attachments?.length || 0) > 0,
        is_reply: !!reply_to_provider_message_id,
        scheduled: !!schedule_send_at,
      },
      ip_address: clientIp,
    });

    return new Response(JSON.stringify({
      success: true,
      provider_message_id: providerMessageId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Send error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
