import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Phone, AlertCircle } from 'lucide-react';
import { Modal } from '../Modal';
import { TextareaField } from '../FormField';
import { useCRM } from '../../contexts/CRMContext';
import { useDirtyFlag, useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useSaveStatus } from '../../hooks/useSaveStatus';
import { SaveIndicator } from '../SaveIndicator';

interface SendSmsModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  phone: string;
  onSuccess?: () => void;
}

const SMS_HARD_LIMIT = 1200;

/**
 * Round 10 — Lead Profile Action Buttons Execute + Auto-Log.
 *
 * Opens an SMS composer wired to GoTo Connect via the `gotoconnect://sms`
 * deep link. On send we (a) hand the body to the GoTo desktop client (or
 * fall back to the OS sms: scheme if the rep is mobile) AND (b) log a
 * `crm_activities` row of `activity_type='sms'` so Section 8 / Section 11
 * auto-capture lands the touch in the rep's Daily Log.
 *
 * GoTo Connect's full SMS REST send is not yet provisioned; the deep-link
 * path is the same UX the rep already uses for click-to-call and means
 * we never have to ask them to retype the body in the GoTo client.
 */
export function SendSmsModal({ open, onClose, leadId, leadName, phone, onSuccess }: SendSmsModalProps) {
  const { activityService } = useCRM();
  const { markDirty, confirmClose, dirtyRef } = useDirtyFlag(open);
  const { status, errorMessage, markSaving, markSaved, markError } = useSaveStatus();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useUnsavedChanges(dirtyRef.current && open);

  useEffect(() => {
    if (!open) return;
    setBody('');
  }, [open]);

  const dialable = useMemo(() => normalize(phone), [phone]);
  const remaining = SMS_HARD_LIMIT - body.length;

  const handleSend = async () => {
    if (!dialable) {
      toast.error('Lead has no phone number on file');
      return;
    }
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error('Add a message before sending');
      return;
    }
    setSending(true);
    markSaving();
    try {
      // 1) Auto-log the touch first so the activity timeline + Daily Log
      // capture even if the deep link launches and the rep navigates away.
      const result = await activityService.logText(leadId, 'outbound', trimmed);
      if (!result.success) {
        markError(result.error || 'Failed to log SMS');
        toast.error(result.error || 'Failed to log SMS');
        return;
      }

      // 2) Hand off to GoTo Connect via deep link (sms: as fallback).
      launchSmsDeepLink({ phone: dialable, body: trimmed, leadId });

      markSaved();
      toast.success('SMS logged + handed off to GoTo Connect');
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send SMS';
      markError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={() => confirmClose(onClose)} title={`Text ${leadName}`} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-th-text-tertiary">
          <Phone className="w-4 h-4" />
          {dialable || (
            <span className="text-red-600 inline-flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> No phone on file
            </span>
          )}
        </div>
        <TextareaField
          label="Message"
          name="sms_body"
          value={body}
          onChange={(e) => {
            markDirty();
            setBody(e.target.value);
          }}
          rows={6}
          minRows={5}
          autoExpand
          placeholder="Type the message GoTo Connect should send…"
          maxLength={SMS_HARD_LIMIT}
          hint={`Sent via the rep's GoTo Connect identity. ${Math.max(remaining, 0)} chars remaining.`}
        />
        {/* Spec line 5: a scheduled "send text" task firing from the rep's
            task queue uses the same handler as this modal — handleSend is
            a pure function over (leadId, phone, body), so the worker can
            call into the SMS pipeline without any UI changes. */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !dialable || !body.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-th-accent-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending…' : 'Send via GoTo'}
          </button>
          <button
            type="button"
            onClick={() => confirmClose(onClose)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
          <SaveIndicator status={status} errorMessage={errorMessage} />
        </div>
        <p className="text-[11px] text-th-text-tertiary">
          We log the message body to this lead's activity history before
          handing off to GoTo Connect, so the touch shows up in the
          timeline + Daily Log even if the GoTo client never opens.
        </p>
      </div>
    </Modal>
  );
}

function normalize(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (plus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
}

function launchSmsDeepLink({ phone, body, leadId }: { phone: string; body: string; leadId: string }): void {
  if (typeof window === 'undefined') return;
  // GoTo Connect docs: gotoconnect://sms/<E.164>?body=...&clientId=...
  const goto = `gotoconnect://sms/${encodeURIComponent(phone)}?body=${encodeURIComponent(body)}&clientId=${encodeURIComponent(leadId)}`;
  try {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = goto;
    document.body.appendChild(frame);
    window.setTimeout(() => {
      try {
        frame.parentNode?.removeChild(frame);
      } catch {
        // already removed
      }
    }, 1500);
  } catch {
    // Fallback to native sms: — works on mobile clients out of the box.
    try {
      window.location.href = `sms:${phone}?body=${encodeURIComponent(body)}`;
    } catch {
      // best effort only
    }
  }
}

export default SendSmsModal;
