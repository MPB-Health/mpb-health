// Supabase Edge Function: web-form-submit
// Public endpoint for accepting web form submissions.
// No auth required — anyone with the form slug/ID can submit.
//
// Deploy: supabase functions deploy web-form-submit

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier, escapeHtml } from '../_shared/security.ts';

const log = createLogger('web-form-submit');

interface SubmitRequest {
  form_id: string;
  data: Record<string, unknown>;
  source_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    // Rate limit: 10 submissions per minute per IP
    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowSeconds: 60,
      keyPrefix: 'web-form-submit',
    }, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: jsonHeaders },
      );
    }

    const body: SubmitRequest = await req.json();
    const { form_id, data, source_url } = body;

    if (!form_id || !data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: form_id, data' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Create service-role client to bypass RLS for reading form config and writing submission
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch the form
    const { data: form, error: formError } = await supabase
      .from('crm_web_forms')
      .select('id, org_id, name, entity_type, fields, status, settings, styling, submit_count, last_submission_at')
      .eq('id', form_id)
      .single();

    if (formError || !form) {
      log.warn('Form not found', { form_id });
      return new Response(
        JSON.stringify({ success: false, error: 'Form not found' }),
        { status: 404, headers: jsonHeaders },
      );
    }

    if (form.status !== 'active') {
      return new Response(
        JSON.stringify({ success: false, error: 'This form is not currently accepting submissions' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Validate required fields
    const fields = (form.fields || []) as Array<{
      id: string;
      label: string;
      type: string;
      required?: boolean;
    }>;
    const missingFields: string[] = [];

    for (const field of fields) {
      if (field.required && !data[field.id] && field.type !== 'heading' && field.type !== 'paragraph') {
        missingFields.push(field.label);
      }
    }

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Store submission
    const userAgent = req.headers.get('user-agent') || null;
    const { data: submission, error: subError } = await supabase
      .from('crm_web_form_submissions')
      .insert({
        form_id,
        data,
        source_url: source_url || null,
        ip_address: clientIp,
        user_agent: userAgent,
        status: 'new',
      })
      .select('id')
      .single();

    if (subError) {
      log.error('Failed to store submission', { error: subError.message });
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save submission' }),
        { status: 500, headers: jsonHeaders },
      );
    }

    // Update form counters
    await supabase
      .from('crm_web_forms')
      .update({
        submit_count: (form.submit_count || 0) + 1,
        last_submission_at: new Date().toISOString(),
      })
      .eq('id', form_id);

    // If entity_type is 'lead', create a lead
    const settings = form.settings || {};
    if (form.entity_type === 'lead') {
      // Sales Plan 2026: lead_source resolution (picklist is DB-enforced by
      // the crm_validate_lead_source trigger). Priority:
      //   1. settings.lead_source (set when the form was created)
      //   2. 'inhouse_round_robin' (default for unclassified web-form intake)
      const leadSource =
        (typeof settings.lead_source === 'string' && settings.lead_source) ||
        'inhouse_round_robin';

      // Lead intake routes through submit_trusted_lead RPC — the canonical
      // server-side writer to lead_submissions. The RPC is the single
      // boundary that owns column-shape validation; previously this code
      // posted keys like `source`, `metadata`, and `company` that aren't
      // columns on the table, which silently dropped every lead conversion.
      // Webform-specific context now goes into form_data (jsonb).
      const formContext: Record<string, unknown> = {
        web_form_id: form.id,
        web_form_name: form.name,
        submission_id: submission.id,
      };

      const leadData: Record<string, unknown> = {
        org_id: form.org_id,
        lead_source: leadSource,
        outside_advisor_id: settings.outside_advisor_id ?? null,
        referral_partner_id: settings.referral_partner_id ?? null,
        source_cta: 'web_form',
        form_data: formContext,
      };

      // Map fields to lead columns
      for (const field of fields) {
        const value = data[field.id];
        if (!value) continue;

        const label = field.label.toLowerCase();
        if (field.type === 'email' || label.includes('email')) {
          leadData.email = value;
        } else if (field.type === 'phone' || label.includes('phone')) {
          leadData.phone = value;
        } else if (label.includes('first') && label.includes('name')) {
          leadData.first_name = value;
        } else if (label.includes('last') && label.includes('name')) {
          leadData.last_name = value;
        } else if (label === 'name' || label === 'full name') {
          const parts = String(value).split(' ');
          leadData.first_name = parts[0];
          leadData.last_name = parts.slice(1).join(' ') || '';
        } else if (label.includes('company') || label.includes('organization')) {
          // No `company` column on lead_submissions — capture it in form_data.
          formContext.company = value;
        }
      }

      // Apply tags
      if (settings.tags && Array.isArray(settings.tags) && settings.tags.length > 0) {
        leadData.tags = settings.tags;
      }

      // Assign to user
      if (settings.assignTo) {
        leadData.assigned_to = settings.assignTo;
      }

      const { data: lead, error: leadErr } = await supabase
        .rpc('submit_trusted_lead', { payload: leadData });

      if (leadErr) {
        log.error('Failed to insert lead via submit_trusted_lead', {
          form_id,
          submission_id: submission.id,
          error: leadErr.message,
        });
      } else if (lead) {
        await supabase
          .from('crm_web_form_submissions')
          .update({ lead_id: lead.id, status: 'converted' })
          .eq('id', submission.id);
      }
    }

    // Send notification email (fire-and-forget)
    if (settings.notificationEmail) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const fieldSummary = fields
          .filter((f) => f.type !== 'heading' && f.type !== 'paragraph' && data[f.id])
          .map((f) => `<tr><td style="padding:4px 8px;font-weight:bold;">${escapeHtml(f.label)}</td><td style="padding:4px 8px;">${escapeHtml(String(data[f.id]))}</td></tr>`)
          .join('');

        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'MPB Health <notifications@mpb.health>',
            to: settings.notificationEmail,
            subject: `New form submission: ${form.name}`,
            html: `<h2>New Form Submission</h2>
<p>A new submission was received on <strong>${escapeHtml(form.name)}</strong>.</p>
<table style="border-collapse:collapse;border:1px solid #ddd;">${fieldSummary}</table>
<p style="color:#888;font-size:12px;">Submitted at ${new Date().toISOString()}</p>`,
          }),
        }).catch((err) => log.error('Failed to send notification email', { error: String(err) }));
      }
    }

    // Send auto-response email (fire-and-forget)
    if (settings.autoResponseEnabled && settings.autoResponseSubject && settings.autoResponseBody) {
      // Find the email field value
      let recipientEmail: string | null = null;
      for (const field of fields) {
        if (field.type === 'email' && data[field.id]) {
          recipientEmail = String(data[field.id]);
          break;
        }
      }

      if (recipientEmail) {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (RESEND_API_KEY) {
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'MPB Health <notifications@mpb.health>',
              to: recipientEmail,
              subject: settings.autoResponseSubject,
              html: settings.autoResponseBody,
            }),
          }).catch((err) => log.error('Failed to send auto-response email', { error: String(err) }));
        }
      }
    }

    log.info('Form submission processed', { form_id, submission_id: submission.id });

    // Determine response based on settings
    const styling = form.styling || {};
    return new Response(
      JSON.stringify({
        success: true,
        submission_id: submission.id,
        redirect_url: settings.redirectUrl || null,
        success_message: styling.successMessage || 'Thank you! Your submission has been received.',
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (error) {
    log.error('Unexpected error', { error: String(error) });
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
