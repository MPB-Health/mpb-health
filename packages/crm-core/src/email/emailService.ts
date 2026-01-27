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
        .select('*')
        .eq('id', templateId)
        .single();

      if (tErr || !template) {
        return { success: false, error: 'Template not found' };
      }

      // Load lead
      const { data: lead, error: lErr } = await this.supabase
        .from('zoho_lead_submissions')
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

  async getEmailLog(leadId?: string): Promise<EmailLogEntry[]> {
    try {
      let query = this.supabase
        .from('crm_email_log')
        .select('*')
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
      return data || [];
    } catch (error) {
      console.error('Error fetching email log:', error);
      return [];
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
