// ============================================================================
// CRM Inbound Email Receiver - Resend Inbound Webhook Handler
// Processes incoming emails and routes them to CRM leads/threads
// Deploy with: supabase functions deploy receive-crm-email
//
// Configure Resend Inbound webhook:
// URL: https://your-project.supabase.co/functions/v1/receive-crm-email
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { verifySvixSignature } from '../_shared/svix.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('receive-crm-email');

// ============================================================================
// Types
// ============================================================================

interface InboundHeader {
  name: string;
  value: string;
}

interface InboundAttachment {
  filename: string;
  content: string; // Base64 encoded
  content_type: string;
}

interface ResendInboundPayload {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text: string;
  headers: InboundHeader[];
  attachments?: InboundAttachment[];
}

interface ParsedAddress {
  name: string;
  email: string;
}

// Allow Svix signature headers through CORS
const RESEND_INBOUND_EXTRA_HEADERS =
  'Content-Type, Authorization, X-Client-Info, Apikey, authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature';

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req, { allowHeaders: RESEND_INBOUND_EXTRA_HEADERS });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Rate limit: webhook receiver (server-to-server)
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 200,
    windowSeconds: 60,
    keyPrefix: 'receive-crm-email',
  });
  if (rateLimitResponse) return rateLimitResponse;

  const corsHeaders = { ...getCorsHeaders(req, { allowHeaders: RESEND_INBOUND_EXTRA_HEADERS }), 'Content-Type': 'application/json' };

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // ========================================================================
    // 0. Verify Resend webhook signature (Svix)
    // ========================================================================

    if (!RESEND_WEBHOOK_SECRET) {
      log.error('RESEND_WEBHOOK_SECRET is not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook signing secret not configured' }),
        { headers: corsHeaders, status: 500 },
      );
    }

    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      log.warn('Missing required Svix headers');
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature headers' }),
        { headers: corsHeaders, status: 401 },
      );
    }

    // Read the raw body for signature verification, then parse as JSON
    const rawBody = await req.text();

    try {
      await verifySvixSignature(RESEND_WEBHOOK_SECRET, svixId, svixTimestamp, svixSignature, rawBody);
      log.info('Webhook signature verified successfully');
    } catch (verifyError) {
      log.error(`Signature verification failed: ${verifyError.message}`);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { headers: corsHeaders, status: 401 },
      );
    }

    // Parse the verified payload
    const payload: ResendInboundPayload = JSON.parse(rawBody);
    log.info(`Inbound email from: ${payload.from}, subject: ${payload.subject}`);

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ========================================================================
    // 1. Parse sender and recipient addresses
    // ========================================================================

    const sender = parseEmailAddress(payload.from);
    const toAddresses = parseAddressList(payload.to);
    const ccAddresses = payload.cc ? parseAddressList(payload.cc) : [];

    log.info(`Sender: ${sender.name} <${sender.email}>`);
    log.info(`To: ${toAddresses.map(a => a.email).join(', ')}`);
    if (ccAddresses.length > 0) {
      log.info(`CC: ${ccAddresses.map(a => a.email).join(', ')}`);
    }

    // ========================================================================
    // 2. Extract headers (Message-ID, In-Reply-To, References)
    // ========================================================================

    const headers = payload.headers || [];
    const messageId = getHeaderValue(headers, 'Message-ID') || getHeaderValue(headers, 'message-id');
    const inReplyTo = getHeaderValue(headers, 'In-Reply-To') || getHeaderValue(headers, 'in-reply-to');
    const referencesHeader = getHeaderValue(headers, 'References') || getHeaderValue(headers, 'references');

    log.info(`Message-ID: ${messageId}`);
    if (inReplyTo) log.info(`In-Reply-To: ${inReplyTo}`);
    if (referencesHeader) log.info(`References: ${referencesHeader}`);

    // ========================================================================
    // 3. Match sender to a lead in lead_submissions
    // ========================================================================

    let leadId: string | null = null;
    let orgId: string | null = null;

    const { data: lead, error: leadError } = await supabase
      .from('lead_submissions')
      .select('id, org_id')
      .ilike('email', sender.email)
      .limit(1)
      .maybeSingle();

    if (leadError) {
      log.error('Error looking up lead:', leadError);
    }

    if (lead) {
      leadId = lead.id;
      orgId = lead.org_id || null;
      log.info(`Matched to lead: ${leadId}`);
    } else {
      log.info(`No lead found for sender: ${sender.email}`);
    }

    // ========================================================================
    // 4. Thread matching via In-Reply-To / References headers
    // ========================================================================

    let threadId: string | null = null;

    // Sales Plan 2026 A/B harness: when an inbound matches an outbound via
    // In-Reply-To, the outbound row carries ab_test_id/ab_variant so we can
    // count this reply against the right variant. We pull those along with
    // thread_id in the same round-trip.
    let replyParentAbTest: { ab_test_id: string | null; ab_variant: string | null } | null = null;

    // Try to match via In-Reply-To header first
    if (inReplyTo) {
      const { data: existingEmail } = await supabase
        .from('crm_email_log')
        .select('thread_id, ab_test_id, ab_variant')
        .eq('message_id', inReplyTo)
        .limit(1)
        .maybeSingle();

      if (existingEmail?.thread_id) {
        threadId = existingEmail.thread_id;
        log.info(`Matched thread via In-Reply-To: ${threadId}`);
      }
      if (existingEmail?.ab_test_id) {
        replyParentAbTest = {
          ab_test_id: existingEmail.ab_test_id,
          ab_variant: existingEmail.ab_variant ?? null,
        };
      }
    }

    // If not found, try matching via References header
    if (!threadId && referencesHeader) {
      const referenceIds = referencesHeader.split(/\s+/).filter(Boolean);
      for (const refId of referenceIds) {
        const { data: refEmail } = await supabase
          .from('crm_email_log')
          .select('thread_id')
          .eq('message_id', refId.trim())
          .limit(1)
          .maybeSingle();

        if (refEmail?.thread_id) {
          threadId = refEmail.thread_id;
          log.info(`Matched thread via References: ${threadId}`);
          break;
        }
      }
    }

    // If no existing thread found, create one via RPC
    if (!threadId && orgId) {
      const allParticipants = [
        sender.email,
        ...toAddresses.map(a => a.email),
        ...ccAddresses.map(a => a.email),
      ];

      const { data: newThreadId, error: threadError } = await supabase.rpc(
        'get_or_create_email_thread',
        {
          p_org_id: orgId,
          p_subject: payload.subject || '(No Subject)',
          p_lead_id: leadId,
          p_participants: allParticipants,
        }
      );

      if (threadError) {
        log.error('Error creating thread:', threadError);
      } else {
        threadId = newThreadId;
        log.info(`Created/found thread via RPC: ${threadId}`);
      }
    }

    // ========================================================================
    // 5. Generate body preview
    // ========================================================================

    const bodyPreview = (payload.text || payload.html || '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);

    // ========================================================================
    // 6. Insert email record into crm_email_log
    // ========================================================================

    const { data: emailLog, error: insertError } = await supabase
      .from('crm_email_log')
      .insert({
        org_id: orgId,
        lead_id: leadId,
        thread_id: threadId,
        direction: 'inbound',
        from_address: sender.email,
        from_name: sender.name,
        to_email: toAddresses[0]?.email || payload.to,
        to_addresses: toAddresses.map(a => a.email),
        cc_addresses: ccAddresses.map(a => a.email),
        bcc_addresses: [],
        subject: payload.subject || '(No Subject)',
        body_preview: bodyPreview,
        body_html: payload.html || null,
        status: 'delivered',
        is_read: false,
        is_starred: false,
        is_archived: false,
        has_attachments: (payload.attachments && payload.attachments.length > 0) || false,
        attachment_count: payload.attachments?.length || 0,
        labels: [],
        message_id: messageId || null,
        in_reply_to: inReplyTo || null,
        references_header: referencesHeader || null,
        inbound_address: toAddresses[0]?.email || null,
        metadata: {
          sender_name: sender.name,
          sender_email: sender.email,
          has_text_body: !!payload.text,
          has_html_body: !!payload.html,
          received_at: new Date().toISOString(),
        },
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      log.error('Error inserting email log:', insertError);
      throw new Error(`Failed to save inbound email: ${insertError.message}`);
    }

    log.info(`Email logged with ID: ${emailLog.id}`);

    // Sales Plan 2026 A/B harness: when the parent outbound was part of a
    // test, count this reply against the winning metric if the test is
    // configured for replies.
    if (replyParentAbTest?.ab_test_id && replyParentAbTest.ab_variant) {
      const col = replyParentAbTest.ab_variant === 'a' ? 'variant_a_success' : 'variant_b_success';
      const { data: test } = await supabase
        .from('crm_email_ab_tests')
        .select(`id, metric, ${col}`)
        .eq('id', replyParentAbTest.ab_test_id)
        .single();
      if (test && (test as { metric?: string }).metric === 'reply') {
        const next = ((test as Record<string, number>)[col] ?? 0) + 1;
        await supabase
          .from('crm_email_ab_tests')
          .update({ [col]: next })
          .eq('id', replyParentAbTest.ab_test_id);
        log.info(`A/B reply counted for test ${replyParentAbTest.ab_test_id} variant ${replyParentAbTest.ab_variant}`);
      }
    }

    // ========================================================================
    // 7. Handle attachments
    // ========================================================================

    if (payload.attachments && payload.attachments.length > 0 && emailLog) {
      log.info(`Processing ${payload.attachments.length} attachment(s)`);

      for (const attachment of payload.attachments) {
        try {
          await processAttachment(supabase, emailLog.id, leadId, attachment);
        } catch (attError) {
          log.error(`Error processing attachment ${attachment.filename}:`, attError);
          // Continue with other attachments even if one fails
        }
      }
    }

    // ========================================================================
    // 8. Create activity log for the lead
    // ========================================================================

    if (leadId) {
      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        activity_type: 'email',
        title: `Inbound email: ${payload.subject || '(No Subject)'}`,
        description: bodyPreview,
        metadata: {
          email_id: emailLog.id,
          direction: 'inbound',
          from: sender.email,
          has_attachments: (payload.attachments?.length || 0) > 0,
        },
      });
    }

    // ========================================================================
    // 9. Return success
    // ========================================================================

    log.info(`Successfully processed inbound email from ${sender.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailLog.id,
        thread_id: threadId,
        lead_id: leadId,
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    log.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        headers: { ...getCorsHeaders(req, { allowHeaders: RESEND_INBOUND_EXTRA_HEADERS }), 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse an email address string like "John Smith <john@example.com>" or "john@example.com"
 */
function parseEmailAddress(raw: string): ParsedAddress {
  if (!raw) return { name: '', email: '' };

  // Match "Name <email>" format
  const namedMatch = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (namedMatch) {
    return {
      name: namedMatch[1].replace(/^["']|["']$/g, '').trim(),
      email: namedMatch[2].trim().toLowerCase(),
    };
  }

  // Plain email address
  const email = raw.trim().toLowerCase();
  return { name: '', email };
}

/**
 * Parse a comma-separated list of email addresses
 */
function parseAddressList(raw: string): ParsedAddress[] {
  if (!raw) return [];

  // Split by comma, but not commas inside angle brackets
  const addresses: string[] = [];
  let current = '';
  let inBracket = false;

  for (const char of raw) {
    if (char === '<') inBracket = true;
    if (char === '>') inBracket = false;
    if (char === ',' && !inBracket) {
      if (current.trim()) addresses.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) addresses.push(current.trim());

  return addresses.map(parseEmailAddress).filter(a => a.email);
}

/**
 * Get a header value by name (case-insensitive)
 */
function getHeaderValue(headers: InboundHeader[], name: string): string | null {
  const header = headers.find(
    h => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || null;
}

/**
 * Process and store an email attachment
 */
async function processAttachment(
  supabase: ReturnType<typeof createClient>,
  emailId: string,
  leadId: string | null,
  attachment: InboundAttachment
): Promise<void> {
  const { filename, content, content_type } = attachment;

  // Decode base64 content
  const binaryContent = Uint8Array.from(atob(content), c => c.charCodeAt(0));
  const fileSize = binaryContent.length;

  // Generate storage path: inbound/{date}/{emailId}/{filename}
  const datePrefix = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const storagePath = `inbound/${datePrefix}/${emailId}/${filename}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('email-attachments')
    .upload(storagePath, binaryContent, {
      contentType: content_type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    log.error(`Storage upload error for ${filename}:`, uploadError);
    throw uploadError;
  }

  // Get the public/signed URL
  const { data: urlData } = supabase.storage
    .from('email-attachments')
    .getPublicUrl(storagePath);

  // Create attachment record
  const { error: recordError } = await supabase
    .from('crm_email_attachments')
    .insert({
      email_id: emailId,
      file_name: filename,
      file_type: content_type || 'application/octet-stream',
      file_size: fileSize,
      storage_bucket: 'email-attachments',
      storage_path: storagePath,
      public_url: urlData?.publicUrl || null,
    });

  if (recordError) {
    log.error(`Error creating attachment record for ${filename}:`, recordError);
    throw recordError;
  }

  log.info(`Attachment stored: ${filename} (${fileSize} bytes)`);
}
