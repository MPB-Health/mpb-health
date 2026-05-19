import { useMemo } from 'react';
import { sanitizeHtml } from '@mpbhealth/utils';
import type { TicketContentFormat, TicketFileRow } from '@mpbhealth/advisor-core';
import { splitTicketMessageHtml } from './parseTicketMessageAttachments';
import { TicketMessageAttachments } from './TicketMessageAttachments';
import { TicketCommentDbAttachments } from './TicketCommentDbAttachments';

interface TicketCommentContentProps {
  content: string;
  contentFormat?: TicketContentFormat;
  /** Files from ITSTS `ticket_files` linked to this comment. */
  ticketFiles?: TicketFileRow[];
  /** Admin ticket management uses theme tokens; default advisor view uses neutral. */
  variant?: 'advisor' | 'admin' | 'description';
  /** Thread bubble styling for attachment cards. */
  bubbleTone?: 'requester' | 'support';
}

function htmlHasVisibleBody(bodyHtml: string): boolean {
  if (!bodyHtml.trim()) return false;
  if (/<img\b/i.test(bodyHtml)) return true;
  const text = bodyHtml
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length > 0;
}

export function TicketCommentContent({
  content,
  contentFormat,
  ticketFiles,
  variant = 'advisor',
  bubbleTone = 'support',
}: TicketCommentContentProps) {
  const parsed = useMemo(() => {
    if (contentFormat !== 'html') return null;
    return splitTicketMessageHtml(content);
  }, [content, contentFormat]);

  if (contentFormat === 'html' && parsed) {
    const { bodyHtml, attachments } = parsed;
    const sanitizedBody = bodyHtml ? sanitizeHtml(bodyHtml) : '';
    const showBody = htmlHasVisibleBody(sanitizedBody);

    const img =
      '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:border [&_img]:border-neutral-200/80 dark:[&_img]:border-slate-600';
    const lists =
      '[&_ul]:my-3 [&_ul]:space-y-2 [&_ol]:my-3 [&_ol]:space-y-2 [&_li]:break-words [&_li]:leading-relaxed';
    const links = '[&_a]:break-all [&_a]:font-medium [&_a]:underline-offset-2';

    const proseCompact =
      variant === 'admin'
        ? `text-sm text-th-text-primary prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${lists} ${links} ${img}`
        : `text-sm text-neutral-700 dark:text-slate-200 prose prose-sm max-w-none [&_a]:text-blue-600 dark:[&_a]:text-sky-400 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${lists} ${links} ${img}`;

    const proseDescription =
      'prose-slate dark:prose-invert text-base sm:text-[1.0625rem] text-slate-900 dark:text-slate-100 prose prose-base sm:prose-lg max-w-none [&_p]:leading-[1.65] [&_p]:mb-4 last:[&_p]:mb-0 [&_a]:text-blue-600 dark:[&_a]:text-sky-400 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-semibold ' +
      `${lists} ${links} ${img}`;

    const prose = variant === 'description' ? proseDescription : proseCompact;

    return (
      <div className="space-y-0">
        {showBody ? (
          <div
            className={prose}
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        ) : null}
        <TicketMessageAttachments items={attachments} tone={bubbleTone} />
        <TicketCommentDbAttachments files={ticketFiles ?? []} tone={bubbleTone} />
      </div>
    );
  }

  const plainAdmin = 'text-sm text-th-text-primary whitespace-pre-wrap';
  const plainAdvisor = 'text-sm text-neutral-700 dark:text-slate-200 whitespace-pre-wrap';
  const plainDescription =
    'text-lg sm:text-[1.125rem] leading-[1.65] text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-normal';
  let plain = plainAdvisor;
  if (variant === 'admin') plain = plainAdmin;
  if (variant === 'description') plain = plainDescription;

  const trimmed = content.trim();
  const showPlainBody = trimmed.length > 0 && trimmed !== '(attachment)';
  const dbFiles = ticketFiles ?? [];

  if (!showPlainBody && dbFiles.length === 0) {
    return null;
  }

  return (
    <div>
      {showPlainBody ? <p className={plain}>{content}</p> : null}
      <TicketCommentDbAttachments files={dbFiles} tone={bubbleTone} />
    </div>
  );
}
