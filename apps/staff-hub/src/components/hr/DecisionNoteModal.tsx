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

  if (!open) return null;

  const title = status === 'approved' ? 'Approve request' : 'Deny request';
  const noteRequired = Boolean(requireNote ?? status === 'denied');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {noteRequired
                ? 'A note is required so the employee understands the decision.'
                : 'Optional note to include with the decision email.'}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
          className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/40"
        />
        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

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
                setError('Please add a note before denying.');
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
