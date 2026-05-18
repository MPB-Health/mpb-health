import { TicketCommentContent } from './TicketCommentContent';

const HTML_TAG_RE = /<\/?[a-z][\s\S]*?>/i;

/** Renders ticket.description: HTML (sanitized via TicketCommentContent) or plain text. */
export function TicketDescriptionBlock({ description }: { description: string }) {
  const isHtml = HTML_TAG_RE.test(description);

  if (isHtml) {
    return (
      <div className="[overflow-wrap:anywhere]">
        <TicketCommentContent content={description} contentFormat="html" variant="description" />
      </div>
    );
  }

  return (
    <TicketCommentContent content={description} contentFormat="plain" variant="description" />
  );
}
