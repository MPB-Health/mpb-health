import type { SupabaseClient } from '@supabase/supabase-js';
import type { EmailSendInput, EmailSendResult, EmailLogEntry } from './types';

export class EmailService {
  constructor(
    private supabase: SupabaseClient,
    private supabaseUrl: string
  ) {}

  async sendDirect(
    to: string,
    subject: string,
    htmlBody: string,
    leadId?: string
  ): Promise<EmailSendResult> {
    return this.invokeEdgeFunction({
      to,
      subject,
      html: htmlBody,
      lead_id: leadId,
    });
  }

  async sendFromTemplate(
    templateId: string,
    leadId: string,
    customVars?: Record<string, string>
  ): Promise<EmailSendResult> {
    try {
      // Load template
      const { data: template, error: tErr } = await this.supabase
        .from('crm_templates')
        .select('id, name, description, template_type, category, subject, body, variables, usage_count, last_used_at, is_ai_generated, ai_performance_score, is_active, is_default, created_by, created_at, updated_at')
        .eq('id', templateId)
        .single();

      if (tErr || !template) {
        return { success: false, error: 'Template not found' };
      }

      // Load lead
      const { data: lead, error: lErr } = await this.supabase
        .from('lead_submissions')
        .select('first_name, last_name, email, phone')
        .eq('id', leadId)
        .single();

      if (lErr || !lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Build variables
      const vars: Record<string, string> = {
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        ...customVars,
      };

      // Interpolate
      let body = template.body as string;
      let subject = (template.subject as string) || '';
      for (const [key, value] of Object.entries(vars)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        body = body.replace(regex, value);
        subject = subject.replace(regex, value);
      }

      // Track template usage
      await this.supabase
        .from('crm_templates')
        .update({
          usage_count: ((template.usage_count as number) || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      // Send
      return this.invokeEdgeFunction({
        to: lead.email,
        subject,
        html: body,
        template_id: templateId,
        lead_id: leadId,
      });
    } catch (error) {
      console.error('Error sending from template:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  /**
   * CRM rebuild Section 7 (Round 3 Addendum) — admin-driven mass sends use
   * the Master Template Library (`crm_master_templates`) rather than per-rep
   * `crm_templates`. This method is the entry point for the bulk-email
   * modal and any future company-wide campaign tooling.
   *
   * Tokens supported (matching the master-library convention used by the
   * website-intake function):
   *   #lead name      → "First Last"
   *   #firstname      → "First"
   *   #lastname       → "Last"
   *   #email          → lead email
   *   #phone          → lead phone
   *   #yoursignature  → resolved server-side by send-crm-email-v2 from the
   *                     sender's `email_signatures` row (defaults to a shared
   *                     MPB Sales sig when no per-user sig exists).
   *
   * Plus the legacy {{first_name}}/{{last_name}} doubled-curly tokens so
   * existing per-rep template content still renders correctly if an admin
   * pastes a rep template into the master library.
   */
  async sendFromMasterTemplate(
    masterTemplateId: string,
    leadId: string,
    customVars?: Record<string, string>,
  ): Promise<EmailSendResult> {
    try {
      const { data: template, error: tErr } = await this.supabase
        .from('crm_master_templates')
        .select('id, channel, name, subject, body, version, archived_at')
        .eq('id', masterTemplateId)
        .single();
      if (tErr || !template) return { success: false, error: 'Master template not found' };
      if (template.channel !== 'email') {
        return { success: false, error: 'Master template is not an email' };
      }
      if (template.archived_at) {
        return { success: false, error: 'Master template is archived' };
      }

      const { data: lead, error: lErr } = await this.supabase
        .from('lead_submissions')
        .select('first_name, last_name, email, phone, do_not_contact')
        .eq('id', leadId)
        .single();
      if (lErr || !lead) return { success: false, error: 'Lead not found' };
      if (lead.do_not_contact) return { success: false, error: 'Lead is on Do Not Contact list' };
      if (!lead.email) return { success: false, error: 'Lead has no email on file' };

      const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
      const vars: Record<string, string> = {
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        ...customVars,
      };

      const merge = (input: string | null): string => {
        if (!input) return '';
        let s = input;
        // master-library #token style
        s = s.replace(/#lead\s*name/gi, fullName);
        s = s.replace(/#firstname/gi, vars.first_name);
        s = s.replace(/#lastname/gi, vars.last_name);
        s = s.replace(/#email/gi, vars.email);
        s = s.replace(/#phone/gi, vars.phone);
        // {{token}} style fallback for content pasted from per-rep templates
        for (const [key, value] of Object.entries(vars)) {
          const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          s = s.replace(re, value);
        }
        return s;
      };

      const subject = merge(template.subject as string | null);
      const body = merge(template.body as string);

      return this.invokeEdgeFunction({
        to: lead.email,
        subject,
        html: body,
        master_template_id: masterTemplateId,
        lead_id: leadId,
      });
    } catch (error) {
      console.error('Error sending from master template:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async getEmailLog(leadId?: string): Promise<EmailLogEntry[]> {
    try {
      let query = this.supabase
        .from('crm_email_log')
        .select('id, org_id, lead_id, template_id, thread_id, direction, from_address, from_name, to_email, to_addresses, cc_addresses, bcc_addresses, subject, body_preview, body_html, status, resend_email_id, signature_id, reply_to_id, has_attachments, attachment_count, is_read, is_starred, is_archived, labels, metadata, sent_by, sent_at, created_at, tracking_id, open_count, click_count, first_opened_at, last_opened_at')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching email log:', error);
        return [];
      }
      return (data || []) as any;
    } catch (error) {
      console.error('Error fetching email log:', error);
      return [];
    }
  }

  /**
   * Sales Plan 2026 A/B harness. Loads the running test, deterministically
   * picks a variant (seeded by leadId so the same lead always sees the same
   * variant), interpolates the basic {{first_name}}/{{last_name}} tokens,
   * stamps ab_test_id + ab_variant on the outbound row, and fires a send.
   *
   * The edge function reads `ab_test_id`/`ab_variant` and bumps
   * `crm_email_ab_tests.variant_{a,b}_sent`. `email-tracking` +
   * `receive-crm-email` do the same for opens/clicks/replies.
   */
  async sendFromABTest(
    abTestId: string,
    leadId: string,
    customVars?: Record<string, string>
  ): Promise<EmailSendResult> {
    try {
      const { data: test, error: tErr } = await this.supabase
        .from('crm_email_ab_tests')
        .select('id, status, variant_a, variant_b')
        .eq('id', abTestId)
        .single();
      if (tErr || !test) return { success: false, error: 'A/B test not found' };
      if (test.status !== 'running') return { success: false, error: 'A/B test not running' };

      // Deterministic 50/50 split by hashing leadId so retries don't flip
      // the assignment. The `crm_email_log` stamp + tracking edge handlers
      // read it back; no separate assignment store needed.
      const bucket = [...leadId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) & 1;
      const variant: 'a' | 'b' = bucket === 0 ? 'a' : 'b';
      const vdef = (variant === 'a' ? test.variant_a : test.variant_b) as
        | { subject?: string; body?: string; cta?: string }
        | null;
      if (!vdef || !vdef.subject || !vdef.body) {
        return { success: false, error: `Variant ${variant} is not configured` };
      }

      const { data: lead, error: lErr } = await this.supabase
        .from('lead_submissions')
        .select('first_name, last_name, email')
        .eq('id', leadId)
        .single();
      if (lErr || !lead) return { success: false, error: 'Lead not found' };
      if (!lead.email) return { success: false, error: 'Lead has no email address' };

      const vars: Record<string, string> = {
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        ...customVars,
      };

      let html = vdef.body;
      let subject = vdef.subject;
      for (const [k, v] of Object.entries(vars)) {
        const re = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
        html = html.replace(re, v);
        subject = subject.replace(re, v);
      }

      return this.invokeEdgeFunction({
        to: lead.email,
        subject,
        html,
        lead_id: leadId,
        ab_test_id: abTestId,
        ab_variant: variant,
      });
    } catch (err) {
      console.error('sendFromABTest error:', err);
      return { success: false, error: 'Unexpected error' };
    }
  }

  private async invokeEdgeFunction(input: EmailSendInput): Promise<EmailSendResult> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) return { success: false, error: 'Not authenticated' };

      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-crm-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send email' };
      }

      return { success: true, email_id: data.email_id };
    } catch (error) {
      console.error('Error invoking send-crm-email:', error);
      return { success: false, error: 'Failed to reach email service' };
    }
  }
}

export function createEmailService(supabase: SupabaseClient, supabaseUrl: string): EmailService {
  return new EmailService(supabase, supabaseUrl);
}
