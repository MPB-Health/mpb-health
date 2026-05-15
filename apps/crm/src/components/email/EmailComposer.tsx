// ============================================================================
// Email Composer Component
// Championship email system with rich text editing via Tiptap
// ============================================================================

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import './EmailComposer.css';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Palette,
  ChevronDown,
  X,
  Paperclip,
  Clock,
  Send,
  Save,
  Trash2,
  Plus,
  FileText,
  User,
  Loader2,
} from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { useOrg } from '../../contexts/OrgContext';
import toast from 'react-hot-toast';
import type { CRMTemplate, EmailSignature, EnhancedEmailSendInput } from '@mpbhealth/crm-core';

// ============================================================================
// Types
// ============================================================================

interface EmailComposerProps {
  mode?: 'compose' | 'reply' | 'forward';
  draftId?: string;
  replyToEmailId?: string;
  forwardFromEmailId?: string;
  leadId?: string;
  contactId?: string;
  accountId?: string;
  threadId?: string;
  initialTo?: string[];
  initialSubject?: string;
  initialBody?: string;
  onSent?: (emailId: string) => void;
  onSaved?: (draftId: string) => void;
  onDiscard?: () => void;
  onClose?: () => void;
}

export interface EmailComposerHandle {
  /** Same as Discard / header close — runs confirm when there is unsaved content. */
  discard: () => void;
  /**
   * Section 6 / Round 10 — moves keyboard focus into the rich-text body so
   * the rep can start typing immediately when the top-row Email button or
   * a scheduled task fires. Safe to call before the editor mounts; the
   * implementation no-ops until Tiptap is ready.
   */
  focus: () => void;
}

interface RecipientFieldProps {
  label: string;
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  showExpand?: boolean;
  onExpand?: () => void;
}

// ============================================================================
// Recipient Field Component
// ============================================================================

function RecipientField({
  label,
  value,
  onChange,
  placeholder = 'Enter email addresses...',
  showExpand,
  onExpand,
}: RecipientFieldProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && isValidEmail(trimmed) && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
  };

  const removeEmail = (email: string) => {
    onChange(value.filter((e) => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeEmail(value[value.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const emails = text.split(/[,;\s]+/).filter(Boolean);
    const validEmails = emails.filter(
      (email) => isValidEmail(email.trim()) && !value.includes(email.trim().toLowerCase())
    );
    if (validEmails.length) {
      onChange([...value, ...validEmails.map((e) => e.toLowerCase())]);
    }
  };

  return (
    <div className="flex items-start gap-2 py-2 border-b border-th-border">
      <label className="w-12 text-sm font-medium text-th-text-tertiary pt-1.5 shrink-0">
        {label}:
      </label>
      <div
        className="flex-1 flex flex-wrap items-center gap-1 min-h-[32px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-th-accent-100 text-th-accent-700 rounded-full text-sm"
          >
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              aria-label={`Remove ${email}`}
              className="hover:bg-th-accent-200 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            if (inputValue.trim()) {
              addEmail(inputValue);
              setInputValue('');
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-th-text-primary placeholder:text-th-text-tertiary"
        />
      </div>
      {showExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="text-xs text-th-text-tertiary hover:text-th-text-secondary"
        >
          Cc/Bcc
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Toolbar Button
// ============================================================================

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-th-accent-100 text-th-accent-700'
          : 'text-th-text-secondary hover:bg-surface-secondary'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Color Picker
// ============================================================================

function ColorPicker({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF',
    '#EF4444', '#F97316', '#F59E0B', '#22C55E',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Text Color"
        className="p-1.5 rounded text-th-text-secondary hover:bg-surface-secondary flex items-center gap-0.5"
      >
        <Palette className="w-4 h-4" />
        <ChevronDown className="w-3 h-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 p-2 bg-surface-primary border border-th-border rounded-lg shadow-lg z-20 grid grid-cols-4 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setIsOpen(false);
                }}
                aria-label={`Set text color to ${color}`}
                className="w-6 h-6 rounded border border-th-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setIsOpen(false);
              }}
              className="w-6 h-6 rounded border border-th-border hover:bg-surface-secondary flex items-center justify-center text-xs"
              title="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Link Modal
// ============================================================================

function LinkModal({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(editor.getAttributes('link').href || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-primary border border-th-border rounded-lg shadow-xl p-4 w-full max-w-sm"
      >
        <h3 className="text-sm font-semibold text-th-text-primary mb-3">
          Insert Link
        </h3>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-secondary rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700"
          >
            {url ? 'Update' : 'Remove'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Editor Toolbar
// ============================================================================

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const [showLinkModal, setShowLinkModal] = useState(false);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-th-border bg-surface-secondary/50">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-th-border mx-1" />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <ColorPicker editor={editor} />

      <div className="w-px h-5 bg-th-border mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-th-border mx-1" />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-th-border mx-1" />

      {/* Insert */}
      <ToolbarButton
        onClick={() => setShowLinkModal(true)}
        isActive={editor.isActive('link')}
        title="Insert Link"
      >
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter image URL:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        title="Insert Image"
      >
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>

      {showLinkModal && (
        <LinkModal editor={editor} onClose={() => setShowLinkModal(false)} />
      )}
    </div>
  );
}

// ============================================================================
// Main Email Composer Component
// ============================================================================

export const EmailComposer = forwardRef<EmailComposerHandle, EmailComposerProps>(function EmailComposer(
  {
  mode = 'compose',
  draftId,
  replyToEmailId,
  forwardFromEmailId,
  leadId,
  contactId,
  accountId,
  threadId,
  initialTo = [],
  initialSubject = '',
  initialBody = '',
  onSent,
  onSaved,
  onDiscard,
  onClose,
  },
  ref
) {
  const { templateService, composerService, signatureService, draftService, mailAccountService, mailSyncService } = useCRM();
  const { activeOrgId } = useOrg();

  // Form state
  const [to, setTo] = useState<string[]>(initialTo);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState(initialSubject);
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Connected account selector
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{ id: string; email_address: string; display_name: string | null; provider: string }>>([]);
  const [sendViaAccountId, setSendViaAccountId] = useState<string>('crm'); // 'crm' = Resend, or account UUID

  // Signature & Template
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<CRMTemplate[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<Array<{ file: File; id?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for email
        link: false, // We configure Link separately below
        underline: false, // We configure Underline separately below
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-th-accent-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      TextAlign.configure({
        types: ['paragraph', 'heading'],
      }),
      Color,
      TextStyle,
      Underline,
      Placeholder.configure({
        placeholder: 'Write your message here...',
      }),
    ],
    content: initialBody,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none px-4 py-3 min-h-[200px] focus:outline-none text-th-text-primary',
      },
    },
    onUpdate: () => {
      // Trigger auto-save after 3 seconds of inactivity
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000);
    },
  });

  // Load signatures and templates
  useEffect(() => {
    const load = async () => {
      try {
        // Load templates and signatures in parallel
        const [templateData, sigData] = await Promise.all([
          templateService.listTemplates(),
          activeOrgId ? signatureService.getUserSignatures(activeOrgId) : Promise.resolve([]),
        ]);
        setTemplates(templateData);
        setSignatures(sigData);

        // Auto-select default signature
        const defaultSig = sigData.find((s: EmailSignature) => s.is_default);
        if (defaultSig) {
          setSelectedSignatureId(defaultSig.id);
        }

        // Load connected mail accounts
        if (activeOrgId) {
          try {
            const accounts = await mailAccountService.getAccounts(activeOrgId);
            setConnectedAccounts(accounts.map(a => ({
              id: a.id,
              email_address: a.email_address,
              display_name: a.display_name,
              provider: a.provider,
            })));
            // Default to default connected account if available
            const defaultAcct = accounts.find(a => a.is_default);
            if (defaultAcct) {
              setSendViaAccountId(defaultAcct.id);
            }
          } catch {
            // Connected accounts not available - use CRM sender
          }
        }
      } catch (error) {
        console.error('Failed to load composer data:', error);
      }
    };
    load();
  }, [templateService, signatureService, mailAccountService, activeOrgId]);

  // Track current draft ID for auto-save
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);

  // Auto-save handler
  const handleAutoSave = useCallback(async () => {
    if (!editor || !activeOrgId) return;
    try {
      const html = editor.getHTML();
      const draftData = {
        to_addresses: to,
        cc_addresses: cc,
        bcc_addresses: bcc,
        subject,
        body_html: html,
        lead_id: leadId,
        contact_id: contactId,
        account_id: accountId,
        thread_id: threadId,
        signature_id: selectedSignatureId || undefined,
      };

      if (currentDraftId) {
        await draftService.autoSaveDraft(currentDraftId, draftData);
      } else {
        const draft = await draftService.createDraft(activeOrgId, draftData);
        setCurrentDraftId(draft.id);
      }
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [editor, activeOrgId, to, cc, bcc, subject, leadId, contactId, accountId, threadId, selectedSignatureId, currentDraftId, draftService]);

  // Send email via v2 ComposerService (CC/BCC, attachments, tracking, threads)
  const handleSend = async () => {
    if (!editor || !activeOrgId) return;

    if (to.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please add a subject');
      return;
    }

    setSending(true);
    try {
      const html = editor.getHTML();

      // Collect attachment IDs from uploaded attachments
      const attachmentIds = attachments
        .filter((a) => a.id)
        .map((a) => a.id as string);

      const input: EnhancedEmailSendInput = {
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject,
        body_html: html,
        lead_id: leadId,
        contact_id: contactId,
        account_id: accountId,
        thread_id: threadId,
        signature_id: selectedSignatureId || undefined,
        attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined,
        track_opens: true,
        track_clicks: true,
      };

      // Route through connected account or CRM Resend sender
      let result;
      if (sendViaAccountId && sendViaAccountId !== 'crm') {
        // Send via connected M365/Gmail account
        const sendResult = await mailSyncService.sendViaProvider(sendViaAccountId, {
          to,
          cc: cc.length > 0 ? cc : undefined,
          bcc: bcc.length > 0 ? bcc : undefined,
          subject,
          html_body: html,
        });
        result = { success: true, email_id: sendResult.provider_message_id };
      } else {
        // Send via CRM Resend sender (existing flow)
        result = await composerService.sendEmail(activeOrgId, input);
      }

      if (result.success) {
        toast.success('Email sent successfully');
        // Clean up draft if one was created
        if (currentDraftId) {
          try { await draftService.deleteDraft(currentDraftId); } catch {}
        }
        onSent?.(result.email_id || '');
        onClose?.();
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!editor || !activeOrgId) return;

    setSaving(true);
    try {
      const html = editor.getHTML();
      const draftData = {
        to_addresses: to,
        cc_addresses: cc,
        bcc_addresses: bcc,
        subject,
        body_html: html,
        lead_id: leadId,
        contact_id: contactId,
        account_id: accountId,
        thread_id: threadId,
        signature_id: selectedSignatureId || undefined,
      };

      if (currentDraftId) {
        await draftService.updateDraft(currentDraftId, draftData);
      } else {
        const draft = await draftService.createDraft(activeOrgId, draftData);
        setCurrentDraftId(draft.id);
      }

      toast.success('Draft saved');
      setLastSavedAt(new Date());
      onSaved?.(currentDraftId || '');
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = useCallback(() => {
    if (
      editor?.getText().trim() ||
      to.length > 0 ||
      subject.trim() ||
      attachments.length > 0
    ) {
      if (!window.confirm('Discard this message?')) {
        return;
      }
    }
    onDiscard?.();
    onClose?.();
  }, [editor, to, subject, attachments, onDiscard, onClose]);

  useImperativeHandle(
    ref,
    () => ({
      discard: handleDiscard,
      focus: () => {
        // Tiptap may still be mounting on first render — chained `focus()`
        // is a no-op when the editor isn't ready, so this is safe to call
        // immediately after switching tabs.
        editor?.commands.focus('end');
      },
    }),
    [handleDiscard, editor],
  );

  useEffect(() => {
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showScheduleModal) {
        e.preventDefault();
        setShowScheduleModal(false);
        return;
      }
      e.preventDefault();
      handleDiscard();
    };
    document.addEventListener('keydown', onDocKey, true);
    return () => document.removeEventListener('keydown', onDocKey, true);
  }, [handleDiscard, showScheduleModal]);

  // Apply template
  const applyTemplate = (template: CRMTemplate) => {
    setSubject(template.subject || '');
    editor?.commands.setContent(template.body);
    setShowTemplateDropdown(false);
    toast.success(`Template "${template.name}" applied`);
  };

  // Handle file selection - upload to Supabase storage via DraftService
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 50 * 1024 * 1024; // 50MB

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 50MB limit`);
        continue;
      }

      // Ensure we have a draft to attach to
      let dId = currentDraftId;
      if (!dId && activeOrgId) {
        try {
          const draft = await draftService.createDraft(activeOrgId, {
            to_addresses: to,
            subject,
            body_html: editor?.getHTML() || '',
          });
          dId = draft.id;
          setCurrentDraftId(draft.id);
        } catch {
          toast.error('Failed to create draft for attachment');
          continue;
        }
      }

      if (dId) {
        try {
          const attachment = await draftService.uploadAttachment(dId, file);
          setAttachments((prev) => [...prev, { file, id: attachment.id }]);
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      } else {
        // Fallback: store locally if no org
        setAttachments((prev) => [...prev, { file }]);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-surface-primary border border-th-border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-th-border bg-surface-secondary">
        <h2 className="text-sm font-semibold text-th-text-primary">
          {mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward' : 'New Message'}
        </h2>
        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span className="text-xs text-th-text-tertiary">
              Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={handleDiscard}
            aria-label="Close composer"
            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-tertiary rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Send From (Connected Account Selector) */}
      {connectedAccounts.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-th-border">
          <label htmlFor="send-from-account" className="w-12 text-sm font-medium text-th-text-tertiary shrink-0">From:</label>
          <select
            id="send-from-account"
            value={sendViaAccountId}
            onChange={e => setSendViaAccountId(e.target.value)}
            className="flex-1 text-sm px-2 py-1 border border-th-border rounded bg-surface-primary text-th-text-primary"
          >
            <option value="crm">CRM Sender (Resend)</option>
            {connectedAccounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.display_name ? `${a.display_name} <${a.email_address}>` : a.email_address}
                {' '}({a.provider === 'microsoft365' ? 'M365' : 'Gmail'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Recipients */}
      <div className="px-4">
        <RecipientField
          label="To"
          value={to}
          onChange={setTo}
          placeholder="Recipients..."
          showExpand={!showCcBcc}
          onExpand={() => setShowCcBcc(true)}
        />
        {showCcBcc && (
          <>
            <RecipientField
              label="Cc"
              value={cc}
              onChange={setCc}
              placeholder="Carbon copy..."
            />
            <RecipientField
              label="Bcc"
              value={bcc}
              onChange={setBcc}
              placeholder="Blind carbon copy..."
            />
          </>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2 py-2 border-b border-th-border">
          <label className="w-12 text-sm font-medium text-th-text-tertiary shrink-0">
            Subject:
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="flex-1 bg-transparent outline-none text-sm text-th-text-primary placeholder:text-th-text-tertiary"
          />
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-th-border bg-surface-secondary/50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1 bg-surface-primary border border-th-border rounded-lg text-xs"
              >
                <Paperclip className="w-3 h-3 text-th-text-tertiary" />
                <span className="text-th-text-secondary max-w-[150px] truncate">
                  {att.file.name}
                </span>
                <span className="text-th-text-tertiary">
                  ({(att.file.size / 1024).toFixed(1)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  aria-label={`Remove attachment ${att.file.name}`}
                  className="p-0.5 hover:bg-surface-secondary rounded"
                >
                  <X className="w-3 h-3 text-th-text-tertiary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-th-border bg-surface-secondary">
        <div className="flex items-center gap-2">
          {/* Attach Files */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            aria-label="Attach files"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-tertiary rounded-lg"
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
            <span className="hidden sm:inline">Attach</span>
          </button>

          {/* Templates */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-tertiary rounded-lg"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTemplateDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTemplateDropdown(false)}
                />
                <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-surface-primary border border-th-border rounded-lg shadow-lg z-20">
                  {templates.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-th-text-tertiary">
                      No templates available
                    </p>
                  ) : (
                    templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="w-full px-3 py-2 text-left text-sm text-th-text-secondary hover:bg-surface-secondary border-b border-th-border last:border-0"
                      >
                        {t.name}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Signature Selector */}
          {signatures.length > 0 && (
            <select
              value={selectedSignatureId || ''}
              onChange={(e) => setSelectedSignatureId(e.target.value || null)}
              aria-label="Email signature"
              className="px-3 py-1.5 text-sm text-th-text-secondary bg-transparent border border-th-border rounded-lg hover:bg-surface-secondary"
            >
              <option value="">No signature</option>
              {signatures.map((sig) => (
                <option key={sig.id} value={sig.id}>
                  {sig.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Discard */}
          <button
            type="button"
            onClick={handleDiscard}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-tertiary rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Discard</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Schedule */}
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </button>

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || to.length === 0 || !subject.trim()}
            className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Schedule Modal (placeholder) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary border border-th-border rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-th-text-primary mb-4">
              Schedule Send
            </h3>
            <p className="text-sm text-th-text-secondary mb-4">
              Schedule functionality coming soon.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-sm bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Utility Functions
// ============================================================================

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default EmailComposer;
