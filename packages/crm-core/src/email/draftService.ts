// ============================================================================
// Email Draft Service
// Manage email drafts with auto-save and attachments
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EmailDraft,
  DraftCreateInput,
  DraftUpdateInput,
  EmailAttachment,
} from './emailTypes';

export class DraftService {
  constructor(private supabase: SupabaseClient) {}

  // ============================================================================
  // Get User Drafts
  // ============================================================================

  async getUserDrafts(orgId: string): Promise<EmailDraft[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('crm_email_drafts')
      .select(`
        *,
        attachments:crm_email_attachments(*)
      `)
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[DraftService] Failed to get drafts:', error);
      throw new Error(`Failed to get drafts: ${error.message}`);
    }

    return data || [];
  }

  // ============================================================================
  // Get Draft by ID
  // ============================================================================

  async getDraft(id: string): Promise<EmailDraft | null> {
    const { data, error } = await this.supabase
      .from('crm_email_drafts')
      .select(`
        *,
        attachments:crm_email_attachments(*),
        signature:crm_email_signatures(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[DraftService] Failed to get draft:', error);
      throw new Error(`Failed to get draft: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // Get Scheduled Drafts
  // ============================================================================

  async getScheduledDrafts(orgId: string): Promise<EmailDraft[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('crm_email_drafts')
      .select(`
        *,
        attachments:crm_email_attachments(*)
      `)
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .not('scheduled_send_at', 'is', null)
      .order('scheduled_send_at', { ascending: true });

    if (error) {
      console.error('[DraftService] Failed to get scheduled drafts:', error);
      throw new Error(`Failed to get scheduled drafts: ${error.message}`);
    }

    return data || [];
  }

  // ============================================================================
  // Create Draft
  // ============================================================================

  async createDraft(orgId: string, input: DraftCreateInput): Promise<EmailDraft> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('crm_email_drafts')
      .insert({
        user_id: user.id,
        org_id: orgId,
        to_addresses: input.to_addresses || [],
        cc_addresses: input.cc_addresses || [],
        bcc_addresses: input.bcc_addresses || [],
        lead_id: input.lead_id,
        contact_id: input.contact_id,
        account_id: input.account_id,
        subject: input.subject,
        body_html: input.body_html,
        body_plain: this.htmlToPlainText(input.body_html || ''),
        template_id: input.template_id,
        signature_id: input.signature_id,
        include_signature: input.include_signature ?? true,
        reply_to_email_id: input.reply_to_email_id,
        forward_from_email_id: input.forward_from_email_id,
        thread_id: input.thread_id,
        scheduled_send_at: input.scheduled_send_at,
      })
      .select()
      .single();

    if (error) {
      console.error('[DraftService] Failed to create draft:', error);
      throw new Error(`Failed to create draft: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // Update Draft
  // ============================================================================

  async updateDraft(id: string, input: DraftUpdateInput): Promise<EmailDraft> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: Record<string, unknown> = {
      ...input,
      last_edited_at: new Date().toISOString(),
    };

    // Auto-generate plain text from HTML
    if (input.body_html !== undefined) {
      updateData.body_plain = this.htmlToPlainText(input.body_html || '');
    }

    const { data, error } = await this.supabase
      .from('crm_email_drafts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[DraftService] Failed to update draft:', error);
      throw new Error(`Failed to update draft: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // Auto-Save Draft
  // ============================================================================

  async autoSaveDraft(id: string, input: DraftUpdateInput): Promise<EmailDraft> {
    return this.updateDraft(id, { ...input, auto_saved: true });
  }

  // ============================================================================
  // Delete Draft
  // ============================================================================

  async deleteDraft(id: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First delete attachments from storage
    const draft = await this.getDraft(id);
    if (draft?.attachments) {
      const paths = draft.attachments
        .filter((a) => a.storage_path)
        .map((a) => a.storage_path);
      if (paths.length > 0) {
        await this.supabase.storage
          .from('email-attachments')
          .remove(paths);
      }
    }

    const { error } = await this.supabase
      .from('crm_email_drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[DraftService] Failed to delete draft:', error);
      throw new Error(`Failed to delete draft: ${error.message}`);
    }
  }

  // ============================================================================
  // Upload Attachment to Draft
  // ============================================================================

  async uploadAttachment(draftId: string, file: File): Promise<EmailAttachment> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 50MB.');
    }

    // Generate unique path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `drafts/${user.id}/${draftId}/${timestamp}-${safeName}`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from('email-attachments')
      .upload(path, file, {
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('[DraftService] Failed to upload attachment:', uploadError);
      throw new Error(`Failed to upload attachment: ${uploadError.message}`);
    }

    // Get signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await this.supabase.storage
      .from('email-attachments')
      .createSignedUrl(path, 3600);

    if (signedUrlError || !signedUrlData) {
      // Clean up uploaded file
      await this.supabase.storage.from('email-attachments').remove([path]);
      console.error('[DraftService] Failed to create signed URL:', signedUrlError);
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'Unknown error'}`);
    }

    const signedUrl = signedUrlData.signedUrl;

    // Create attachment record
    const { data, error } = await this.supabase
      .from('crm_email_attachments')
      .insert({
        draft_id: draftId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
        public_url: signedUrl,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Clean up uploaded file
      await this.supabase.storage.from('email-attachments').remove([path]);
      console.error('[DraftService] Failed to create attachment record:', error);
      throw new Error(`Failed to create attachment record: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // Delete Attachment
  // ============================================================================

  async deleteAttachment(attachmentId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get attachment
    const { data: attachment } = await this.supabase
      .from('crm_email_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Delete from storage
    if (attachment.storage_path) {
      await this.supabase.storage
        .from('email-attachments')
        .remove([attachment.storage_path]);
    }

    // Delete record
    const { error } = await this.supabase
      .from('crm_email_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      console.error('[DraftService] Failed to delete attachment:', error);
      throw new Error(`Failed to delete attachment: ${error.message}`);
    }
  }

  // ============================================================================
  // Get Draft Attachments
  // ============================================================================

  async getDraftAttachments(draftId: string): Promise<EmailAttachment[]> {
    const { data, error } = await this.supabase
      .from('crm_email_attachments')
      .select('*')
      .eq('draft_id', draftId)
      .order('uploaded_at', { ascending: true });

    if (error) {
      console.error('[DraftService] Failed to get attachments:', error);
      throw new Error(`Failed to get attachments: ${error.message}`);
    }

    return data || [];
  }

  // ============================================================================
  // Create Reply Draft
  // ============================================================================

  async createReplyDraft(
    orgId: string,
    originalEmailId: string,
    replyAll: boolean = false
  ): Promise<EmailDraft> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get original email
    const { data: original } = await this.supabase
      .from('crm_email_log')
      .select('*')
      .eq('id', originalEmailId)
      .single();

    if (!original) {
      throw new Error('Original email not found');
    }

    // Build recipients
    let toAddresses: string[] = [];
    let ccAddresses: string[] = [];

    if (original.direction === 'inbound') {
      // Replying to an inbound email - send to the from address
      toAddresses = [original.from_address || original.to_email];
    } else {
      // Replying to our own sent email - send to original recipients
      toAddresses = original.to_addresses || [original.to_email];
    }

    if (replyAll && original.cc_addresses) {
      ccAddresses = original.cc_addresses.filter(
        (addr: string) => !toAddresses.includes(addr)
      );
    }

    // Build quoted content
    const quotedContent = `
<br><br>
<div style="border-left: 2px solid #ccc; padding-left: 12px; margin-left: 0; color: #666;">
  <p style="margin: 0 0 8px 0;">
    On ${new Date(original.sent_at).toLocaleString()}, ${original.from_name || original.from_address} wrote:
  </p>
  ${original.body_html || original.body_preview}
</div>`;

    return this.createDraft(orgId, {
      to_addresses: toAddresses,
      cc_addresses: ccAddresses,
      lead_id: original.lead_id,
      subject: `Re: ${(original.subject || '').replace(/^Re:\s*/i, '')}`,
      body_html: quotedContent,
      reply_to_email_id: originalEmailId,
      thread_id: original.thread_id,
    });
  }

  // ============================================================================
  // Create Forward Draft
  // ============================================================================

  async createForwardDraft(
    orgId: string,
    originalEmailId: string
  ): Promise<EmailDraft> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get original email with attachments
    const { data: original } = await this.supabase
      .from('crm_email_log')
      .select('*, attachments:crm_email_attachments(*)')
      .eq('id', originalEmailId)
      .single();

    if (!original) {
      throw new Error('Original email not found');
    }

    // Build forwarded content
    const forwardedContent = `
<br><br>
<div style="border-top: 1px solid #ccc; padding-top: 12px;">
  <p style="margin: 0 0 8px 0; color: #666;">---------- Forwarded message ---------</p>
  <p style="margin: 0; color: #666;">
    From: ${original.from_name || original.from_address}<br>
    Date: ${new Date(original.sent_at).toLocaleString()}<br>
    Subject: ${original.subject}<br>
    To: ${(original.to_addresses || [original.to_email]).join(', ')}
  </p>
  <br>
  ${original.body_html || original.body_preview}
</div>`;

    // Create draft
    const draft = await this.createDraft(orgId, {
      subject: `Fwd: ${(original.subject || '').replace(/^Fwd:\s*/i, '')}`,
      body_html: forwardedContent,
      forward_from_email_id: originalEmailId,
    });

    // Copy attachments if any
    if (original.attachments?.length > 0) {
      for (const attachment of original.attachments) {
        // Create new attachment record pointing to same file
        await this.supabase
          .from('crm_email_attachments')
          .insert({
            draft_id: draft.id,
            file_name: attachment.file_name,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            storage_path: attachment.storage_path,
            public_url: attachment.public_url,
            uploaded_by: user.id,
          });
      }
    }

    return this.getDraft(draft.id) as Promise<EmailDraft>;
  }

  // ============================================================================
  // Helper: HTML to Plain Text
  // ============================================================================

  private htmlToPlainText(html: string): string {
    // Simple conversion - strip tags and decode entities
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

// Factory function
export function createDraftService(supabase: SupabaseClient): DraftService {
  return new DraftService(supabase);
}
