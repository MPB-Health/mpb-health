/**
 * Server-side HTML sanitization for ticket comment bodies (Edge / Deno).
 * Keep allowed tags aligned with @mpbhealth/utils sanitizeHtml (rich text).
 */
import sanitizeHtml from "npm:sanitize-html@2.13.0";

const OPTIONS = {
  allowedTags: [
    "p", "br", "span", "div",
    "b", "strong", "i", "em", "u", "s",
    "ul", "ol", "li",
    "a",
    "blockquote",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    span: ["class"],
    div: ["class"],
    p: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

export function sanitizeTicketHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  return sanitizeHtml(html, OPTIONS).trim();
}

/** Strip tags for email / notification previews */
export function htmlToPlainPreview(html: string, max: number): string {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, max);
}
