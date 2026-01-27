export interface EmailSendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template_id?: string;
  lead_id?: string;
}

export interface EmailSendResult {
  success: boolean;
  email_id?: string;
  error?: string;
}

export interface EmailLogEntry {
  id: string;
  org_id: string | null;
  lead_id: string | null;
  template_id: string | null;
  to_email: string;
  subject: string | null;
  body_preview: string | null;
  status: 'sent' | 'failed' | 'bounced';
  resend_email_id: string | null;
  sent_by: string | null;
  sent_at: string;
  created_at: string;
}
