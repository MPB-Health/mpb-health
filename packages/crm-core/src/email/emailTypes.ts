// ============================================================================
// Championship Email System Types
// Full Outlook-like email capabilities
// ============================================================================

// ============================================================================
// Email Signatures
// ============================================================================

export interface SocialLink {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'website';
  url: string;
}

export interface EmailSignature {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  is_default: boolean;
  content: string;
  variables: Record<string, string>;
  logo_url: string | null;
  logo_storage_path: string | null;
  banner_url: string | null;
  banner_storage_path: string | null;
  social_links: SocialLink[];
  font_family: string;
  primary_color: string;
  created_at: string;
  updated_at: string;
}

export interface SignatureCreateInput {
  name: string;
  is_default?: boolean;
  content: string;
  variables?: Record<string, string>;
  logo_url?: string;
  logo_storage_path?: string;
  banner_url?: string;
  banner_storage_path?: string;
  social_links?: SocialLink[];
  font_family?: string;
  primary_color?: string;
}

export interface SignatureUpdateInput extends Partial<SignatureCreateInput> {}

// ============================================================================
// Email Attachments
// ============================================================================

export interface EmailAttachment {
  id: string;
  email_id: string | null;
  draft_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_bucket: string;
  storage_path: string;
  public_url: string | null;
  checksum: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface AttachmentUploadInput {
  file: File;
  draft_id?: string;
  email_id?: string;
}

export interface AttachmentUploadResult {
  success: boolean;
  attachment?: EmailAttachment;
  error?: string;
}

// ============================================================================
// Email Drafts
// ============================================================================

export interface EmailDraft {
  id: string;
  user_id: string;
  org_id: string;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  lead_id: string | null;
  contact_id: string | null;
  account_id: string | null;
  subject: string | null;
  body_html: string | null;
  body_plain: string | null;
  template_id: string | null;
  signature_id: string | null;
  include_signature: boolean;
  reply_to_email_id: string | null;
  forward_from_email_id: string | null;
  thread_id: string | null;
  scheduled_send_at: string | null;
  last_edited_at: string;
  auto_saved: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  attachments?: EmailAttachment[];
  signature?: EmailSignature | null;
}

export interface DraftCreateInput {
  to_addresses?: string[];
  cc_addresses?: string[];
  bcc_addresses?: string[];
  lead_id?: string;
  contact_id?: string;
  account_id?: string;
  subject?: string;
  body_html?: string;
  template_id?: string;
  signature_id?: string;
  include_signature?: boolean;
  reply_to_email_id?: string;
  forward_from_email_id?: string;
  thread_id?: string;
  scheduled_send_at?: string;
}

export interface DraftUpdateInput extends Partial<DraftCreateInput> {
  auto_saved?: boolean;
}

// ============================================================================
// Email Threads (Conversations)
// ============================================================================

export interface EmailThread {
  id: string;
  org_id: string;
  subject: string;
  lead_id: string | null;
  contact_id: string | null;
  account_id: string | null;
  deal_id: string | null;
  participants: string[];
  message_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  has_unread: boolean;
  labels: string[];
  is_starred: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  messages?: EnhancedEmailLog[];
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface ThreadFilters {
  has_unread?: boolean;
  is_starred?: boolean;
  is_archived?: boolean;
  lead_id?: string;
  labels?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Enhanced Email Log (Messages)
// ============================================================================

export type EmailDirection = 'inbound' | 'outbound';

export interface EnhancedEmailLog {
  id: string;
  org_id: string | null;
  lead_id: string | null;
  template_id: string | null;
  thread_id: string | null;
  direction: EmailDirection;
  from_address: string | null;
  from_name: string | null;
  to_email: string;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string | null;
  body_preview: string | null;
  body_html: string | null;
  status: 'sent' | 'failed' | 'bounced' | 'delivered' | 'opened' | 'clicked';
  resend_email_id: string | null;
  signature_id: string | null;
  reply_to_id: string | null;
  has_attachments: boolean;
  attachment_count: number;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  labels: string[];
  metadata: Record<string, unknown>;
  sent_by: string | null;
  sent_at: string;
  created_at: string;
  // Tracking
  tracking_id?: string;
  open_count?: number;
  click_count?: number;
  first_opened_at?: string;
  last_opened_at?: string;
  // Joined
  attachments?: EmailAttachment[];
  thread?: EmailThread | null;
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface EnhancedEmailFilters {
  direction?: EmailDirection;
  status?: EnhancedEmailLog['status'];
  thread_id?: string;
  lead_id?: string;
  is_starred?: boolean;
  is_archived?: boolean;
  has_attachments?: boolean;
  labels?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Email Send Types (Enhanced)
// ============================================================================

export interface EnhancedEmailSendInput {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_html: string;
  body_plain?: string;
  from_name?: string;
  reply_to?: string;
  lead_id?: string;
  contact_id?: string;
  account_id?: string;
  thread_id?: string;
  signature_id?: string;
  template_id?: string;
  attachment_ids?: string[];
  scheduled_send_at?: string;
  track_opens?: boolean;
  track_clicks?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface EnhancedEmailSendResult {
  success: boolean;
  email_id?: string;
  resend_id?: string;
  thread_id?: string;
  error?: string;
  scheduled?: boolean;
}

// ============================================================================
// Inbox View Types
// ============================================================================

export type InboxFolder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'archived' | 'all';

export interface InboxStats {
  total_inbox: number;
  total_sent: number;
  total_drafts: number;
  total_starred: number;
  total_archived: number;
  unread_count: number;
}

// ============================================================================
// Resend Webhook Types
// ============================================================================

export type ResendWebhookType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

export interface ResendWebhookPayload {
  type: ResendWebhookType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    // Bounce specific
    bounce?: {
      message: string;
      type: string;
    };
    // Click specific
    click?: {
      link: string;
      timestamp: string;
      userAgent: string;
      ipAddress: string;
    };
    // Open specific
    open?: {
      timestamp: string;
      userAgent: string;
      ipAddress: string;
    };
  };
}
