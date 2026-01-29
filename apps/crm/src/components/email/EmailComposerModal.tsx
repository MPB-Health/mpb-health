// ============================================================================
// Email Composer Modal
// Full-screen or slideout modal for composing emails
// ============================================================================

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { EmailComposer } from './EmailComposer';

// ============================================================================
// Types
// ============================================================================

interface EmailComposerModalProps {
  open: boolean;
  onClose: () => void;
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
}

// ============================================================================
// Component
// ============================================================================

export function EmailComposerModal({
  open,
  onClose,
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
}: EmailComposerModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Don't close immediately - let the composer handle discard confirmation
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          bg-surface-primary border border-th-border rounded-xl shadow-2xl flex flex-col
          transition-all duration-200
          ${
            isMaximized
              ? 'w-full h-full rounded-none'
              : 'w-full max-w-3xl h-[85vh] sm:h-[80vh] max-h-[800px]'
          }
        `}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-th-border shrink-0">
          <h2 className="text-base font-semibold text-th-text-primary">
            {mode === 'reply'
              ? 'Reply'
              : mode === 'forward'
                ? 'Forward'
                : 'New Email'}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Composer Content */}
        <div className="flex-1 overflow-hidden">
          <EmailComposer
            mode={mode}
            draftId={draftId}
            replyToEmailId={replyToEmailId}
            forwardFromEmailId={forwardFromEmailId}
            leadId={leadId}
            contactId={contactId}
            accountId={accountId}
            threadId={threadId}
            initialTo={initialTo}
            initialSubject={initialSubject}
            initialBody={initialBody}
            onSent={(emailId) => {
              onSent?.(emailId);
              onClose();
            }}
            onSaved={(savedDraftId) => {
              onSaved?.(savedDraftId);
            }}
            onDiscard={onClose}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default EmailComposerModal;
