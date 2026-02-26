// ============================================================================
// Championship Email System - Resend Edge Function
// Full-featured email sending with attachments, tracking, and threads
// Deploy with: supabase functions deploy send-crm-email-v2
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface Attachment {
  filename: string;
  content: string; // Base64 encoded
  content_type?: string;
}

interface Tag {
  name: string;
  value: string;
}

interface RequestBody {
  // Recipients
  to: string[];
  cc?: string[];
  bcc?: string[];

  // Content
  subject: string;
  html: string;
  text?: string;

  // Sender
  from_name?: string;
  reply_to?: string;

  // Attachments
  attachments?: Attachment[];

  // Tracking
  track_opens?: boolean;
  track_clicks?: boolean;
  tags?: string[];

  // CRM context
  org_id?: string;
  lead_id?: string;
  contact_id?: string;
  account_id?: string;
  thread_id?: string;
  signature_id?: string;
  template_id?: string;
  attachment_ids?: string[];
  metadata?: Record<string, unknown>;
}

interface ResendResponse {
  id: string;
}

interface ResendError {
  statusCode: number;
  message: string;
  name: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Get environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const FROM_EMAIL = Deno.env.get('CRM_FROM_EMAIL') || 'crm@mpb.health';
    const FROM_NAME = Deno.env.get('CRM_FROM_NAME') || 'MPB Health';
    const TRACKING_DOMAIN = Deno.env.get('EMAIL_TRACKING_DOMAIN'); // Optional custom tracking domain

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get calling user from auth header
    const authHeader = req.headers.get('Authorization');
    let sentBy: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      sentBy = user?.id || null;
      userEmail = user?.email || null;
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const {
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      from_name,
      reply_to,
      attachments,
      track_opens = true,
      track_clicks = true,
      tags,
      org_id,
      lead_id,
      contact_id,
      account_id,
      thread_id,
      signature_id,
      template_id,
      attachment_ids,
      metadata,
    } = body;

    // Validate required fields
    if (!to || to.length === 0) {
      throw new Error('Missing required field: to');
    }
    if (!subject) {
      throw new Error('Missing required field: subject');
    }
    if (!html) {
      throw new Error('Missing required field: html');
    }

    // Generate tracking ID for this email
    const trackingId = crypto.randomUUID();

    // Inject tracking pixel for open tracking
    let finalHtml = html;
    if (track_opens) {
      const trackingPixel = generateTrackingPixel(SUPABASE_URL, trackingId, TRACKING_DOMAIN);
      finalHtml = injectTrackingPixel(html, trackingPixel);
    }

    // Wrap links for click tracking
    if (track_clicks) {
      finalHtml = wrapLinksForTracking(finalHtml, SUPABASE_URL, trackingId, TRACKING_DOMAIN);
    }

    // Build Resend tags
    const resendTags: Tag[] = [
      { name: 'type', value: 'crm_email_v2' },
      { name: 'tracking_id', value: trackingId },
    ];
    if (template_id) resendTags.push({ name: 'template_id', value: template_id });
    if (lead_id) resendTags.push({ name: 'lead_id', value: lead_id });
    if (org_id) resendTags.push({ name: 'org_id', value: org_id });
    if (tags) {
      tags.forEach((tag, i) => resendTags.push({ name: `custom_${i}`, value: tag }));
    }

    // Build Resend payload
    const resendPayload: Record<string, unknown> = {
      from: `${from_name || FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html: finalHtml,
    };

    // Optional fields
    if (cc && cc.length > 0) resendPayload.cc = cc;
    if (bcc && bcc.length > 0) resendPayload.bcc = bcc;
    if (text) resendPayload.text = text;
    if (reply_to) resendPayload.reply_to = reply_to;
    if (resendTags.length > 0) resendPayload.tags = resendTags;

    // Add attachments if any
    if (attachments && attachments.length > 0) {
      resendPayload.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        content_type: att.content_type || getMimeType(att.filename),
      }));
    }

    // Send via Resend API
    log.info(`Sending email to ${to.join(', ')}`);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    let resendEmailId: string | null = null;
    let status: 'sent' | 'failed' = 'sent';
    let errorMessage: string | null = null;

    if (resendResponse.ok) {
      const result: ResendResponse = await resendResponse.json();
      resendEmailId = result.id;
      log.info(`Email sent successfully. Resend ID: ${resendEmailId}`);
    } else {
      const errorData: ResendError = await resendResponse.json();
      status = 'failed';
      errorMessage = errorData.message || 'Unknown Resend error';
      log.error('Resend error:', errorData);
    }

    // Generate body preview (strip HTML)
    const bodyPreview = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);

    // Log to crm_email_log with enhanced fields
    const { data: emailLog, error: logError } = await supabase
      .from('crm_email_log')
      .insert({
        org_id: org_id || null,
        lead_id: lead_id || null,
        template_id: template_id || null,
        thread_id: thread_id || null,
        direction: 'outbound',
        from_address: FROM_EMAIL,
        from_name: from_name || FROM_NAME,
        to_email: to[0], // Primary recipient
        to_addresses: to,
        cc_addresses: cc || [],
        bcc_addresses: bcc || [],
        subject,
        body_preview: bodyPreview,
        body_html: html, // Store original HTML without tracking
        status,
        resend_email_id: resendEmailId,
        signature_id: signature_id || null,
        has_attachments: (attachments && attachments.length > 0) || (attachment_ids && attachment_ids.length > 0),
        attachment_count: (attachments?.length || 0) + (attachment_ids?.length || 0),
        is_read: true, // Outbound emails are "read" by default
        is_starred: false,
        is_archived: false,
        labels: tags || [],
        metadata: {
          ...metadata,
          tracking_id: trackingId,
          contact_id,
          account_id,
          track_opens,
          track_clicks,
          error: errorMessage,
        },
        tracking_id: trackingId,
        sent_by: sentBy,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      log.error('Failed to log email:', logError);
    }

    // Update attachment records with email_id
    if (emailLog && attachment_ids && attachment_ids.length > 0) {
      await supabase
        .from('crm_email_attachments')
        .update({ email_id: emailLog.id })
        .in('id', attachment_ids);
    }

    // Update thread if applicable
    if (thread_id && emailLog) {
      await supabase
        .from('crm_email_threads')
        .update({
          message_count: supabase.rpc('increment', { row_id: thread_id, column_name: 'message_count' }),
          last_message_at: new Date().toISOString(),
          last_message_preview: bodyPreview.substring(0, 100),
          participants: supabase.rpc('array_append_unique', {
            row_id: thread_id,
            column_name: 'participants',
            values: to,
          }),
        })
        .eq('id', thread_id);
    }

    // Create activity log for lead
    if (lead_id && status === 'sent') {
      await supabase.from('lead_activities').insert({
        lead_id,
        activity_type: 'email',
        title: `Email sent: ${subject}`,
        description: bodyPreview,
        metadata: {
          email_id: emailLog?.id,
          resend_id: resendEmailId,
          to,
          has_attachments: (attachments?.length || 0) > 0,
        },
        created_by: sentBy,
      });
    }

    // Return response
    if (status === 'failed') {
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage || 'Failed to send email via Resend',
        }),
        {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailLog?.id,
        resend_id: resendEmailId,
        thread_id: thread_id || null,
        tracking_id: trackingId,
      }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    log.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a 1x1 tracking pixel URL
 */
function generateTrackingPixel(
  supabaseUrl: string,
  trackingId: string,
  customDomain?: string
): string {
  const baseUrl = customDomain || `${supabaseUrl}/functions/v1/email-tracking`;
  return `<img src="${baseUrl}/open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;
}

/**
 * Inject tracking pixel before closing body tag
 */
function injectTrackingPixel(html: string, pixel: string): string {
  // Try to inject before </body>
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }
  // Otherwise append to end
  return html + pixel;
}

/**
 * Wrap links for click tracking
 */
function wrapLinksForTracking(
  html: string,
  supabaseUrl: string,
  trackingId: string,
  customDomain?: string
): string {
  const baseUrl = customDomain || `${supabaseUrl}/functions/v1/email-tracking`;

  // Match href attributes in anchor tags
  const linkRegex = /<a\s+([^>]*href=["'])([^"']+)(["'][^>]*)>/gi;

  return html.replace(linkRegex, (match, prefix, url, suffix) => {
    // Skip tracking for unsubscribe links and mailto
    if (url.includes('unsubscribe') || url.startsWith('mailto:') || url.startsWith('#')) {
      return match;
    }

    const encodedUrl = encodeURIComponent(url);
    const trackedUrl = `${baseUrl}/click/${trackingId}?url=${encodedUrl}`;
    return `<a ${prefix}${trackedUrl}${suffix}>`;
  });
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    html: 'text/html',
    json: 'application/json',
    zip: 'application/zip',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
