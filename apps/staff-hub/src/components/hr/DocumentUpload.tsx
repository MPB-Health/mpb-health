import { useState } from 'react';
import { FileUp, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HR_ALLOWED_MIME,
  HR_MAX_UPLOAD_BYTES,
  documentKindForType,
  uploadDocument,
  type StaffTimeDocument,
  type StaffTimeDocumentKind,
  type StaffTimeRequestType,
} from '../../lib/hr';

interface Props {
  requestId: string;
  requestType: StaffTimeRequestType;
  onUploaded: (doc: StaffTimeDocument) => void;
  /** When set, hides kind picker and always uploads this kind. */
  forcedKind?: StaffTimeDocumentKind;
}

export function DocumentUpload({ requestId, requestType, onUploaded, forcedKind }: Props) {
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<StaffTimeDocumentKind>(
    forcedKind ?? documentKindForType(requestType),
  );
  const activeKind = forcedKind ?? kind;

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > HR_MAX_UPLOAD_BYTES) {
          toast.error(`${file.name} is over 10MB`);
          continue;
        }
        if (!(HR_ALLOWED_MIME as readonly string[]).includes(file.type)) {
          toast.error(`${file.name}: use PDF, JPG, PNG, or WebP`);
          continue;
        }
        const doc = await uploadDocument(requestId, { file, kind: activeKind });
        onUploaded(doc);
        toast.success(`Uploaded ${file.name}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {!forcedKind ? (
        <div className="flex flex-wrap gap-2">
          {(['doctors_note', 'supporting'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                kind === k
                  ? 'bg-[#0A4E8E] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {k === 'doctors_note' ? "Doctor's note" : 'Supporting doc'}
            </button>
          ))}
        </div>
      ) : null}

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center transition-colors hover:border-[#0A4E8E]/40 hover:bg-sky-50/40">
        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={(e) => {
            void onPick(e.target.files);
            e.target.value = '';
          }}
        />
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-[#0A4E8E]" />
        ) : (
          <FileUp className="h-6 w-6 text-slate-400" />
        )}
        <span className="text-sm font-medium text-slate-700">
          {busy ? 'Uploading…' : 'Drop or choose files'}
        </span>
        <span className="text-xs text-slate-400">PDF, JPG, PNG, WebP · max 10MB</span>
      </label>
    </div>
  );
}

export function DocumentList({
  docs,
  onOpen,
}: {
  docs: StaffTimeDocument[];
  onOpen: (doc: StaffTimeDocument) => void;
}) {
  if (docs.length === 0) {
    return <p className="text-sm text-slate-400">No documents attached.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {docs.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{doc.file_name}</p>
            <p className="text-xs text-slate-400">
              {doc.kind === 'doctors_note' ? "Doctor's note" : 'Supporting'} ·{' '}
              {(doc.byte_size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpen(doc)}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-[#0A4E8E] hover:bg-sky-50"
          >
            Open
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PendingFileChip({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
      {name}
      <button type="button" onClick={onRemove} className="text-slate-400 hover:text-slate-700">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
