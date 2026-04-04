// ============================================================================
// Email Composer Service
// Full-featured email sending with Resend integration
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EnhancedEmailSendInput,
  EnhancedEmailSendResult,
  EnhancedEmailLog,
  EnhancedEmailFilters,
  EmailThread,
  ThreadFilters,
  InboxStats,
  EmailAttachment,
} from './emailTypes';
import { SignatureService } from './signatureService';
import { DraftService } from './draftService';

export class ComposerService {
  private signatureService: SignatureService;
  private draftService: DraftService;

  constructor(
    private supabase: SupabaseClient,
    private supabaseUrl: string
  ) {
    this.signatureService = new SignatureService(supabase);
    this.draftService = new DraftService(supabase);
  }

  // ============================================================================
  // Send Email
  // ============================================================================

  async sendEmail(
    orgId: string,
    input: EnhancedEmailSendInput
  ): Promise<EnhancedEmailSendResult> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Build final HTML with signature
      let finalHtml = input.body_html;
      if (input.signature_id) {
        const signature = await this.signatureService.getSignature(input.signature_id);
        if (signature) {
          const renderedSig = this.signatureService.renderSignature(signature);
          finalHtml += `<br><br>${renderedSig}`;
        }
      }

      // Get or create thread
      let threadId = input.thread_id;
      if (!threadId && input.lead_id) {
        const { data: thread } = await this.supabase
          .rpc('get_or_create_email_thread', {
            p_org_id: orgId,
            p_subject: input.subject,
            p_lead_id: input.lead_id,
            p_participants: Array.isArray(input.to) ? input.to : [input.to],
          });
        threadId = thread;
      }

      // Get attachment URLs if any
      let attachments: Array<{ filename: string; content: string }> = [];
      if (input.attachment_ids?.length) {
        attachments = await this.getAttachmentContents(input.attachment_ids);
      }

      // Call Resend via Edge Function
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-crm-email-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          to: Array.isArray(input.to) ? input.to : [input.to],
          cc: input.cc,
          bcc: input.bcc,
          subject: input.subject,
          html: finalHtml,
          text: input.body_plain || this.htmlToPlainText(finalHtml),
          from_name: input.from_name,
          reply_to: input.reply_to,
          attachments,
          track_opens: input.track_opens ?? true,
          track_clicks: input.track_clicks ?? true,
          tags: input.tags,
          // Metadata for logging
          org_id: orgId,
          lead_id: input.lead_id,
          contact_id: input.contact_id,
          account_id: input.account_id,
          thread_id: threadId,
          signature_id: input.signature_id,
          template_id: input.template_id,
          attachment_ids: input.attachment_ids,
          metadata: input.metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to send email',
        };
      }

      return {
        success: true,
        email_id: data.email_id,
        resend_id: data.resend_id,
        thread_id: threadId || undefined,
      };
    } catch (error) {
      console.error('[ComposerService] Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // Send from Draft
  // ============================================================================

  async sendFromDraft(
    orgId: string,
    draftId: string
  ): Promise<EnhancedEmailSendResult> {
    const draft = await this.draftService.getDraft(draftId);
    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    // Get attachment IDs
    const attachmentIds = draft.attachments?.map((a) => a.id) || [];

    const result = await this.sendEmail(orgId, {
      to: draft.to_addresses,
      cc: draft.cc_addresses,
      bcc: draft.bcc_addresses,
      subject: draft.subject || '(No subject)',
      body_html: draft.body_html || '',
      lead_id: draft.lead_id || undefined,
      contact_id: draft.contact_id || undefined,
      account_id: draft.account_id || undefined,
      thread_id: draft.thread_id || undefined,
      signature_id: draft.include_signature ? (draft.signature_id || undefined) : undefined,
      template_id: draft.template_id || undefined,
      attachment_ids: attachmentIds,
    });

    // Delete draft if sent successfully
    if (result.success) {
      await this.draftService.deleteDraft(draftId);
    }

    return result;
  }

  // ============================================================================
  // Schedule Email
  // ============================================================================

  async scheduleEmail(
    orgId: string,
    draftId: string,
    sendAt: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.draftService.updateDraft(draftId, {
        scheduled_send_at: sendAt.toISOString(),
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule',
      };
    }
  }

  // ============================================================================
  // Cancel Scheduled Email
  // ============================================================================

  async cancelScheduledEmail(draftId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.draftService.updateDraft(draftId, {
        scheduled_send_at: undefined,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel',
      };
    }
  }

  // ============================================================================
  // Get Email by ID
  // ============================================================================

  async getEmail(id: string): Promise<EnhancedEmailLog | null> {
    const { data, error } = await this.supabase
      .from('crm_email_log')
      .select(`
        *,
        attachments:crm_email_attachments(*),
        thread:crm_email_threads(*),
        lead:lead_submissions(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[ComposerService] Failed to get email:', error);
      return null;
    }

    return data;
  }

  // ============================================================================
  // Query Emails
  // ============================================================================

  async queryEmails(
    filters: EnhancedEmailFilters,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ data: EnhancedEmailLog[]; total: number }> {
    let query = this.supabase
      .from('crm_email_log')
      .select(`
        *,
        attachments:crm_email_attachments(*),
        lead:lead_submissions(id, first_name, last_name, email)
      `, { count: 'exact' });

    // Apply filters
    if (filters.direction) {
      query = query.eq('direction', filters.direction);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.thread_id) {
      query = query.eq('thread_id', filters.thread_id);
    }
    if (filters.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }
    if (filters.is_starred !== undefined) {
      query = query.eq('is_starred', filters.is_starred);
    }
    if (filters.is_archived !== undefined) {
      query = query.eq('is_archived', filters.is_archived);
    }
    if (filters.has_attachments !== undefined) {
      query = query.eq('has_attachments', filters.has_attachments);
    }
    if (filters.labels?.length) {
      query = query.overlaps('labels', filters.labels);
    }
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,to_email.ilike.%${filters.search}%`);
    }
    if (filters.dateFrom) {
      query = query.gte('sent_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('sent_at', filters.dateTo);
    }

    // Pagination
    query = query.order('sent_at', { ascending: false });
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[ComposerService] Failed to query emails:', error);
      return { data: [], total: 0 };
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  // ============================================================================
  // Get Email Threads
  // ============================================================================

  async getThreads(
    filters: ThreadFilters,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ data: EmailThread[]; total: number }> {
    let query = this.supabase
      .from('crm_email_threads')
      .select(`
        *,
        lead:lead_submissions(id, first_name, last_name, email)
      `, { count: 'exact' });

    // Apply filters
    if (filters.has_unread !== undefined) {
      query = query.eq('has_unread', filters.has_unread);
    }
    if (filters.is_starred !== undefined) {
      query = query.eq('is_starred', filters.is_starred);
    }
    if (filters.is_archived !== undefined) {
      query = query.eq('is_archived', filters.is_archived);
    }
    if (filters.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }
    if (filters.labels?.length) {
      query = query.overlaps('labels', filters.labels);
    }
    if (filters.search) {
      query = query.ilike('subject', `%${filters.search}%`);
    }
    if (filters.dateFrom) {
      query = query.gte('last_message_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('last_message_at', filters.dateTo);
    }

    // Pagination
    query = query.order('last_message_at', { ascending: false, nullsFirst: false });
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[ComposerService] Failed to get threads:', error);
      return { data: [], total: 0 };
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  // ============================================================================
  // Get Thread Messages
  // ============================================================================

  async getThreadMessages(threadId: string): Promise<EnhancedEmailLog[]> {
    const { data, error } = await this.supabase
      .from('crm_email_log')
      .select(`
        *,
        attachments:crm_email_attachments(*)
      `)
      .eq('thread_id', threadId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('[ComposerService] Failed to get thread messages:', error);
      return [];
    }

    // Mark thread as read
    await this.supabase
      .from('crm_email_threads')
      .update({ has_unread: false })
      .eq('id', threadId);

    return data || [];
  }

  // ============================================================================
  // Star/Unstar Email
  // ============================================================================

  async toggleEmailStar(emailId: string): Promise<boolean> {
    const { data: email } = await this.supabase
      .from('crm_email_log')
      .select('is_starred')
      .eq('id', emailId)
      .single();

    if (!email) return false;

    const { error } = await this.supabase
      .from('crm_email_log')
      .update({ is_starred: !email.is_starred })
      .eq('id', emailId);

    return !error;
  }

  // ============================================================================
  // Archive/Unarchive Email
  // ============================================================================

  async toggleEmailArchive(emailId: string): Promise<boolean> {
    const { data: email } = await this.supabase
      .from('crm_email_log')
      .select('is_archived')
      .eq('id', emailId)
      .single();

    if (!email) return false;

    const { error } = await this.supabase
      .from('crm_email_log')
      .update({ is_archived: !email.is_archived })
      .eq('id', emailId);

    return !error;
  }

  // ============================================================================
  // Add Label to Email
  // ============================================================================

  async addEmailLabel(emailId: string, label: string): Promise<boolean> {
    const { error } = await this.supabase.rpc('array_append_unique', {
      table_name: 'crm_email_log',
      column_name: 'labels',
      row_id: emailId,
      new_value: label,
    });

    // Fallback if RPC doesn't exist
    if (error) {
      const { data: email } = await this.supabase
        .from('crm_email_log')
        .select('labels')
        .eq('id', emailId)
        .single();

      if (email) {
        const labels = [...new Set([...(email.labels || []), label])];
        await this.supabase
          .from('crm_email_log')
          .update({ labels })
          .eq('id', emailId);
      }
    }

    return true;
  }

  // ============================================================================
  // Get Inbox Stats
  // ============================================================================

  async getInboxStats(orgId: string): Promise<InboxStats> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      return {
        total_inbox: 0,
        total_sent: 0,
        total_drafts: 0,
        total_starred: 0,
        total_archived: 0,
        unread_count: 0,
      };
    }

    // Get counts in parallel
    const [inbox, sent, drafts, starred, archived, unread] = await Promise.all([
      this.supabase
        .from('crm_email_log')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'inbound')
        .eq('is_archived', false),
      this.supabase
        .from('crm_email_log')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'outbound')
        .eq('sent_by', user.id),
      this.supabase
        .from('crm_email_drafts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('org_id', orgId),
      this.supabase
        .from('crm_email_log')
        .select('*', { count: 'exact', head: true })
        .eq('is_starred', true)
        .eq('is_archived', false),
      this.supabase
        .from('crm_email_log')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', true),
      this.supabase
        .from('crm_email_threads')
        .select('*', { count: 'exact', head: true })
        .eq('has_unread', true),
    ]);

    return {
      total_inbox: inbox.count || 0,
      total_sent: sent.count || 0,
      total_drafts: drafts.count || 0,
      total_starred: starred.count || 0,
      total_archived: archived.count || 0,
      unread_count: unread.count || 0,
    };
  }

  // ============================================================================
  // Helper: Get Attachment Contents
  // ============================================================================

  private async getAttachmentContents(
    attachmentIds: string[]
  ): Promise<Array<{ filename: string; content: string }>> {
    const { data: attachments } = await this.supabase
      .from('crm_email_attachments')
      .select('*')
      .in('id', attachmentIds);

    if (!attachments) return [];

    const contents: Array<{ filename: string; content: string }> = [];

    for (const attachment of attachments) {
      try {
        const { data } = await this.supabase.storage
          .from(attachment.storage_bucket)
          .download(attachment.storage_path);

        if (data) {
          const base64 = await this.blobToBase64(data);
          contents.push({
            filename: attachment.file_name,
            content: base64,
          });
        }
      } catch (error) {
        console.error(`Failed to get attachment ${attachment.id}:`, error);
      }
    }

    return contents;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ============================================================================
  // Helper: HTML to Plain Text
  // ============================================================================

  private htmlToPlainText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

// Factory function
export function createComposerService(
  supabase: SupabaseClient,
  supabaseUrl: string
): ComposerService {
  return new ComposerService(supabase, supabaseUrl);
}
