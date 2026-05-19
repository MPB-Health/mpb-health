import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ticketService, type TicketFileRow } from '@mpbhealth/advisor-core';
import { useTicketAuth } from '../TicketAuthWrapper';
import { TicketMessageAttachments } from './TicketMessageAttachments';
import type { TicketMessageAttachment } from './parseTicketMessageAttachments';

function formatFileSize(bytes: number | null): string | undefined {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketCommentDbAttachments({
  files,
  tone = 'support',
}: {
  files: TicketFileRow[];
  tone?: 'requester' | 'support';
}) {
  const { executeWithAuth } = useTicketAuth();
  const [items, setItems] = useState<TicketMessageAttachment[]>([]);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [resignNonce, setResignNonce] = useState(0);

  const retry = useCallback(() => setResignNonce((n) => n + 1), []);

  useEffect(() => {
    if (!files.length) {
      setItems([]);
      setSignError(null);
      setSigning(false);
      return;
    }

    const paths = files.map((f) => f.storage_path.replace(/^\//, '').trim()).filter(Boolean);
    if (!paths.length) {
      setItems([]);
      setSignError(null);
      setSigning(false);
      return;
    }

    let cancelled = false;
    setSigning(true);
    setSignError(null);

    void (async () => {
      try {
        const signed = await executeWithAuth(() =>
          ticketService.signTicketAttachmentUrlsDetailed(paths),
        );
        if (cancelled) return;

        const next: TicketMessageAttachment[] = [];
        const errs: string[] = [];
        for (const f of files) {
          const path = f.storage_path.replace(/^\//, '').trim();
          const entry = signed[path];
          if (entry?.url) {
            next.push({
              href: entry.url,
              name: f.filename,
              sizeLabel: formatFileSize(f.file_size),
            });
          } else {
            errs.push(entry?.error || f.filename);
          }
        }
        setItems(next);
        setSignError(errs.length > 0 && next.length === 0 ? errs[0] : null);
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        setSignError(err instanceof Error ? err.message : 'Could not load download links');
      } finally {
        if (!cancelled) setSigning(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [files, executeWithAuth, resignNonce]);

  if (!files.length) return null;

  const pendingOnly = files.every((f) => !f.storage_path.replace(/^\//, '').trim());
  if (pendingOnly) return null;

  if (signing && items.length === 0) {
    return (
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
        Preparing attachments…
      </p>
    );
  }

  if (signError && items.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        <p>{signError}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-1 font-medium underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return <TicketMessageAttachments items={items} tone={tone} />;
}
