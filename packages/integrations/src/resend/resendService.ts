// Resend Email Integration Service
export interface EmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export const resendService = {
  // Send email
  send: async (_options: EmailOptions): Promise<EmailResult> => ({
    success: false,
    error: 'Not configured',
  }),

  // Send with template
  sendTemplate: async (
    _templateId: string,
    _to: string | string[],
    _data: Record<string, unknown>
  ): Promise<EmailResult> => ({
    success: false,
    error: 'Not configured',
  }),

  // Batch send
  sendBatch: async (_emails: EmailOptions[]): Promise<EmailResult[]> => [],

  // Email status
  getEmailStatus: async (_emailId: string): Promise<unknown> => null,
};
