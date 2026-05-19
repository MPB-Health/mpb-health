/** Parsed file attachment embedded at the end of an HTML ticket comment. */
export type TicketMessageAttachment = {
  href: string;
  name: string;
  sizeLabel?: string;
};

const LEGACY_ATTACHMENTS_BLOCK_RE =
  /<br\s*\/?>\s*<p>\s*<strong>\s*Attachments:\s*<\/strong>\s*<\/p>\s*<ul>([\s\S]*?)<\/ul>\s*$/i;

const STRUCTURED_ATTACHMENTS_BLOCK_RE =
  /<div\s+class="tkt-att"[^>]*>\s*<p[^>]*>[\s\S]*?<\/p>\s*<ul[^>]*>([\s\S]*?)<\/ul>\s*<\/div>\s*$/i;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseListItems(ulInner: string): TicketMessageAttachment[] {
  const items: TicketMessageAttachment[] = [];

  const structuredRe =
    /<li[^>]*>\s*<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<span[^>]*class="tkt-att__name"[^>]*>([^<]*)<\/span>[\s\S]*?(?:<span[^>]*class="tkt-att__size"[^>]*>([^<]*)<\/span>)?[\s\S]*?<\/a>\s*<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = structuredRe.exec(ulInner)) !== null) {
    items.push({
      href: m[1],
      name: decodeHtmlEntities(m[2].trim()),
      sizeLabel: m[3]?.trim() || undefined,
    });
  }
  if (items.length > 0) return items;

  const legacyRe =
    /<li[^>]*>\s*<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>\s*(?:\(([^)]+)\))?\s*<\/li>/gi;
  while ((m = legacyRe.exec(ulInner)) !== null) {
    items.push({
      href: m[1],
      name: decodeHtmlEntities(m[2].trim()),
      sizeLabel: m[3]?.trim() || undefined,
    });
  }
  return items;
}

/**
 * Splits sanitized HTML comment body from trailing attachment block (legacy or structured).
 */
export function splitTicketMessageHtml(html: string): {
  bodyHtml: string;
  attachments: TicketMessageAttachment[];
} {
  const trimmed = html.trim();
  if (!trimmed) return { bodyHtml: '', attachments: [] };

  const legacy = LEGACY_ATTACHMENTS_BLOCK_RE.exec(trimmed);
  if (legacy) {
    const bodyHtml = trimmed.slice(0, legacy.index).replace(/<br\s*\/?>\s*$/i, '').trim();
    return { bodyHtml, attachments: parseListItems(legacy[1]) };
  }

  const structured = STRUCTURED_ATTACHMENTS_BLOCK_RE.exec(trimmed);
  if (structured) {
    const bodyHtml = trimmed.slice(0, structured.index).replace(/<br\s*\/?>\s*$/i, '').trim();
    return { bodyHtml, attachments: parseListItems(structured[1]) };
  }

  return { bodyHtml: trimmed, attachments: [] };
}

export function formatAttachmentSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
