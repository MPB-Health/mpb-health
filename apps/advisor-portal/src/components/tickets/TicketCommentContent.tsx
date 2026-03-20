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
    const prose =
      variant === 'admin'
        ? 'text-sm text-th-text-primary prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5'
        : 'text-sm text-neutral-700 prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5';
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
