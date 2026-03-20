import { sanitizeHtml } from '@mpbhealth/utils';
import type { TicketContentFormat } from '@mpbhealth/admin-core';

interface TicketCommentContentProps {
  content: string;
  contentFormat?: TicketContentFormat;
}

/**
 * Renders a ticket comment: sanitized HTML when `content_format === 'html'`, else plain pre-wrap.
 */
export function TicketCommentContent({ content, contentFormat }: TicketCommentContentProps) {
  if (contentFormat === 'html') {
    return (
      <div
        className="text-sm text-neutral-700 prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }
  return <p className="text-sm text-neutral-700 whitespace-pre-wrap">{content}</p>;
}
