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
    "img",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel", "data-storage-path"],
    span: ["class"],
    div: ["class"],
    p: ["class"],
    img: ["src", "alt", "width", "height", "loading", "class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    img: (tagName: string, attribs: Record<string, string>) => {
      const src = (attribs.src || "").trim();
      // Only allow Supabase Storage object/sign URLs (same bucket as ticket attachments).
      if (
        !src.startsWith("https://") ||
        !src.includes("/storage/v1/object/")
      ) {
        return { tagName: "span", attribs: {} };
      }
      return {
        tagName: "img",
        attribs: {
          src,
          alt: attribs.alt || "",
          ...(attribs.width ? { width: attribs.width } : {}),
          ...(attribs.height ? { height: attribs.height } : {}),
        },
      };
    },
  },
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
