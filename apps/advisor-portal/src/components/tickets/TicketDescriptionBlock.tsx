import { TicketCommentContent } from './TicketCommentContent';

const HTML_TAG_RE = /<\/?[a-z][\s\S]*?>/i;

/** Renders ticket.description: HTML (sanitized via TicketCommentContent) or plain text. */
export function TicketDescriptionBlock({ description }: { description: string }) {
  const isHtml = HTML_TAG_RE.test(description);

  if (isHtml) {
    return (
      <div className="text-th-text-primary [&_.prose]:max-w-none [&_.prose]:leading-7 [overflow-wrap:anywhere]">
        <TicketCommentContent content={description} contentFormat="html" variant="advisor" />
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-base sm:text-lg font-medium leading-7 text-th-text-primary [overflow-wrap:anywhere]">
      {description}
    </p>
  );
}
