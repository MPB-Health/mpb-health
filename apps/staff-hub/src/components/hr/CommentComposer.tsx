import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { addComment } from '../../lib/hr';
import { HrPrimaryButton } from './HrChrome';

interface Props {
  requestId: string;
  disabled?: boolean;
  onPosted: () => void;
}

export function CommentComposer({ requestId, disabled, onPosted }: Props) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error('Write a comment first');
      return;
    }
    setBusy(true);
    try {
      const { notifyDelayed } = await addComment(requestId, { body: trimmed });
      setBody('');
      onPosted();
      toast.success(
        notifyDelayed
          ? 'Comment posted. Notification may be delayed.'
          : 'Comment posted',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not post comment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        rows={3}
        value={body}
        disabled={disabled || busy}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment for the other party…"
        maxLength={4000}
        className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A4E8E]/40 disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">{body.trim().length}/4000</p>
        <HrPrimaryButton
          type="button"
          disabled={disabled || busy || !body.trim()}
          onClick={() => void onSubmit()}
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Posting…
            </>
          ) : (
            'Post comment'
          )}
        </HrPrimaryButton>
      </div>
    </div>
  );
}
