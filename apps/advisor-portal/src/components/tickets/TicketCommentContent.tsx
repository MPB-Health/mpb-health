import { sanitizeHtml } from '@mpbhealth/utils';
import type { TicketContentFormat } from '@mpbhealth/advisor-core';

interface TicketCommentContentProps {
  content: string;
  contentFormat?: TicketContentFormat;
  /** Admin ticket management uses theme tokens; default advisor view uses neutral. */
  variant?: 'advisor' | 'admin';
}

export function TicketCommentContent({ content, contentFormat, variant = 'advisor' }: TicketCommentContentProps) {
  if (contentFormat === 'html') {
    const img =
      '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:border [&_img]:border-neutral-200/80';
    const prose =
      variant === 'admin'
        ? `text-sm text-th-text-primary prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${img}`
        : `text-sm text-neutral-700 prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${img}`;
    return (
      <div
        className={prose}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }
  const plain =
    variant === 'admin'
      ? 'text-sm text-th-text-primary whitespace-pre-wrap'
      : 'text-sm text-neutral-700 whitespace-pre-wrap';
  return <p className={plain}>{content}</p>;
}
