import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { HrPrimaryButton, HrSecondaryButton } from './HrChrome';

interface Props {
  open: boolean;
  status: 'approved' | 'denied';
  requireNote?: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

export function DecisionNoteModal({
  open,
  status,
  requireNote,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNote('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const title = status === 'approved' ? 'Approve request' : 'Deny request';
  const noteRequired = Boolean(requireNote ?? status === 'denied');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[color:var(--hr-ink)]/35 backdrop-blur-[2px]"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-[color:var(--hr-elevated)] p-5 shadow-xl ring-1 ring-[color:var(--hr-line)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[color:var(--hr-ink)]">{title}</h2>
            <p className="mt-1 text-sm text-[color:var(--hr-muted)]">
              {noteRequired
                ? 'A note is required so the employee understands the decision.'
                : 'Optional note to include with the decision email.'}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="hub-icon-btn"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          rows={3}
          value={note}
          disabled={busy}
          onChange={(e) => {
            setNote(e.target.value);
            setError(null);
          }}
          placeholder={noteRequired ? 'Required note to employee' : 'Optional note'}
          className="hr-field resize-y"
        />
        {error ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <HrSecondaryButton type="button" disabled={busy} onClick={onClose}>
            Cancel
          </HrSecondaryButton>
          <HrPrimaryButton
            type="button"
            disabled={busy}
            className={
              status === 'approved'
                ? '!bg-emerald-600 hover:!bg-emerald-700'
                : '!bg-rose-600 hover:!bg-rose-700'
            }
            onClick={() => {
              const trimmed = note.trim();
              if (noteRequired && !trimmed) {
                setError('Add a note before denying.');
                return;
              }
              onConfirm(trimmed);
            }}
          >
            {status === 'approved' ? 'Confirm approve' : 'Confirm deny'}
          </HrPrimaryButton>
        </div>
      </div>
    </div>
  );
}
