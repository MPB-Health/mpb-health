import { FileText, Image as ImageIcon, Paperclip, ExternalLink } from 'lucide-react';
import { cn } from '@mpbhealth/ui';
import type { TicketMessageAttachment } from './parseTicketMessageAttachments';

function fileIcon(filename: string) {
  const ext = filename.includes('.') ? (filename.split('.').pop() || '').toLowerCase() : '';
  if (/^(png|jpe?g|gif|webp|svg|bmp|heic)$/.test(ext)) {
    return ImageIcon;
  }
  return FileText;
}

export function TicketMessageAttachments({
  items,
  tone = 'support',
}: {
  items: TicketMessageAttachment[];
  /** Matches thread bubble — requester (you) vs support. */
  tone?: 'requester' | 'support';
}) {
  if (!items.length) return null;

  const sectionBorder =
    tone === 'requester'
      ? 'border-sky-200/70 dark:border-sky-800/50'
      : 'border-slate-200/80 dark:border-slate-600/70';
  const cardBase =
    tone === 'requester'
      ? 'border-sky-200/80 bg-white/70 hover:border-sky-300 hover:bg-white dark:border-sky-800/60 dark:bg-slate-900/50 dark:hover:border-sky-700'
      : 'border-slate-200/90 bg-white/80 hover:border-slate-300 hover:bg-white dark:border-slate-600/80 dark:bg-slate-950/40 dark:hover:border-slate-500';
  const labelText =
    tone === 'requester'
      ? 'text-sky-900/70 dark:text-sky-200/80'
      : 'text-slate-600 dark:text-slate-400';
  const nameText =
    tone === 'requester'
      ? 'text-slate-900 dark:text-slate-100'
      : 'text-slate-900 dark:text-slate-100';
  const iconWrap =
    tone === 'requester'
      ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300'
      : 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300';

  return (
    <section
      className={cn('mt-3 border-t pt-3', sectionBorder)}
      aria-label="Attachments"
    >
      <p
        className={cn(
          'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide',
          labelText,
        )}
      >
        <Paperclip className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        Attachments
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = fileIcon(item.name);
          return (
            <li key={`${item.href}-${item.name}`}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 shadow-sm transition-colors',
                  cardBase,
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                    iconWrap,
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm font-medium', nameText)}>
                    {item.name}
                  </span>
                  {item.sizeLabel ? (
                    <span className="mt-0.5 block text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {item.sizeLabel}
                    </span>
                  ) : null}
                </span>
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-slate-400 opacity-70 transition-opacity group-hover:opacity-100 dark:text-slate-500"
                  aria-hidden
                />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
