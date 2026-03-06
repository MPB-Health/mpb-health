// ============================================================================
// Mail Webhook - Handle real-time notifications from M365 and Gmail
// Microsoft Graph Change Notifications + Gmail Push via Pub/Sub
// Deploy: supabase functions deploy mail-webhook
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const MS_WEBHOOK_SECRET = Deno.env.get('MS_WEBHOOK_SECRET') || '';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');

    // ====================================================================
    // Microsoft Graph Change Notifications
    // ====================================================================
    if (provider === 'microsoft365') {
      // Subscription validation (Graph sends a GET with validationToken)
      const validationToken = url.searchParams.get('validationToken');
      if (validationToken) {
        return new Response(validationToken, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // Process notifications
      const body = await req.json();
      const notifications = body.value || [];

      for (const notification of notifications) {
        const { subscriptionId, resource, changeType, clientState } = notification;

        // Validate client state (shared secret)
        if (clientState !== MS_WEBHOOK_SECRET) {
          console.error('Invalid client state in webhook');
          continue;
        }

        // Find account by subscription
        const { data: account } = await supabase
          .from('mail_accounts')
          .select('id, org_id, user_id')
          .eq('provider_metadata->subscription_id', subscriptionId)
          .eq('provider', 'microsoft365')
          .single();

        if (!account) {
          console.warn('No account found for subscription:', subscriptionId);
          continue;
        }

        // Queue a delta sync for the affected account
        await supabase.from('mail_sync_jobs').insert({
          account_id: account.id,
          job_type: 'delta_sync',
          priority: 5,
          payload: {
            change_type: changeType,
            resource,
            triggered_by: 'webhook',
          },
        });

        // Audit log
        await supabase.from('mail_audit_log').insert({
          org_id: account.org_id,
          user_id: account.user_id,
          account_id: account.id,
          action: 'webhook_received',
          details: { provider: 'microsoft365', change_type: changeType },
        });
      }

      return new Response('', { status: 202 });
    }

    // ====================================================================
    // Gmail Push Notifications (via Google Pub/Sub)
    // ====================================================================
    if (provider === 'gmail') {
      const body = await req.json();

      // Google Pub/Sub sends { message: { data: base64, messageId, publishTime }, subscription }
      const pubsubMessage = body.message;
      if (!pubsubMessage?.data) {
        return new Response('No message data', { status: 400 });
      }

      // Decode the notification
      const decoded = JSON.parse(atob(pubsubMessage.data));
      const { emailAddress, historyId } = decoded;

      if (!emailAddress) {
        return new Response('No email address in notification', { status: 400 });
      }

      // Find account by email
      const { data: account } = await supabase
        .from('mail_accounts')
        .select('id, org_id, user_id')
        .eq('email_address', emailAddress)
        .eq('provider', 'gmail')
        .eq('is_active', true)
        .single();

      if (!account) {
        console.warn('No account found for email:', emailAddress);
        return new Response('', { status: 200 });
      }

      // Queue delta sync
      await supabase.from('mail_sync_jobs').insert({
        account_id: account.id,
        job_type: 'delta_sync',
        priority: 5,
        payload: {
          history_id: historyId,
          triggered_by: 'webhook',
        },
      });

      // Audit log
      await supabase.from('mail_audit_log').insert({
        org_id: account.org_id,
        user_id: account.user_id,
        account_id: account.id,
        action: 'webhook_received',
        details: { provider: 'gmail', history_id: historyId },
      });

      return new Response('', { status: 200 });
    }

    // ====================================================================
    // Subscription management (called by the CRM to set up webhooks)
    // ====================================================================
    if (provider === 'manage') {
      const corsHeaders = getCorsHeaders(req);
      const body = await req.json();
      const { action: mgmtAction, account_id } = body;

      if (mgmtAction === 'subscribe_microsoft') {
        const TOKEN_ENCRYPTION_KEY = Deno.env.get('MAIL_TOKEN_ENCRYPTION_KEY')!;

        const { data: account } = await supabase
          .from('mail_accounts')
          .select('*')
          .eq('id', account_id)
          .single();

        if (!account) {
          return new Response(JSON.stringify({ error: 'Account not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: accessToken } = await supabase.rpc('decrypt_token', {
          encrypted: account.access_token_encrypted,
          key: TOKEN_ENCRYPTION_KEY,
        });

        const webhookUrl = `${SUPABASE_URL}/functions/v1/mail-webhook?provider=microsoft365`;

        const subRes = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            changeType: 'created,updated,deleted',
            notificationUrl: webhookUrl,
            resource: 'me/messages',
            expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
            clientState: MS_WEBHOOK_SECRET,
          }),
        });

        if (!subRes.ok) {
          const err = await subRes.text();
          console.error('Subscription creation failed:', err);
          return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const sub = await subRes.json();

        // Store subscription ID in account metadata
        await supabase.from('mail_accounts').update({
          provider_metadata: { subscription_id: sub.id, subscription_expiry: sub.expirationDateTime },
        }).eq('id', account_id);

        return new Response(JSON.stringify({ success: true, subscription_id: sub.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (mgmtAction === 'subscribe_gmail') {
        const TOKEN_ENCRYPTION_KEY = Deno.env.get('MAIL_TOKEN_ENCRYPTION_KEY')!;
        const GMAIL_PUBSUB_TOPIC = Deno.env.get('GMAIL_PUBSUB_TOPIC') || '';

        const { data: account } = await supabase
          .from('mail_accounts')
          .select('*')
          .eq('id', account_id)
          .single();

        if (!account) {
          return new Response(JSON.stringify({ error: 'Account not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: accessToken } = await supabase.rpc('decrypt_token', {
          encrypted: account.access_token_encrypted,
          key: TOKEN_ENCRYPTION_KEY,
        });

        const watchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topicName: GMAIL_PUBSUB_TOPIC,
            labelIds: ['INBOX'],
          }),
        });

        if (!watchRes.ok) {
          const err = await watchRes.text();
          console.error('Gmail watch failed:', err);
          return new Response(JSON.stringify({ error: 'Failed to set up Gmail push' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const watchResult = await watchRes.json();

        await supabase.from('mail_accounts').update({
          delta_token: watchResult.historyId,
          provider_metadata: { watch_expiry: watchResult.expiration },
        }).eq('id', account_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Unknown management action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Unknown provider', { status: 400 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
});
