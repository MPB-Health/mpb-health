/**
 * HTML entities map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Sanitize HTML by escaping dangerous characters
 */
export function sanitizeHtml(html: string): string {
  return html.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize input by removing or escaping potentially dangerous content
 */
export function sanitizeInput(
  input: string,
  options: {
    maxLength?: number;
    allowedTags?: string[];
    trimWhitespace?: boolean;
    removeNewlines?: boolean;
  } = {}
): string {
  const {
    maxLength,
    allowedTags = [],
    trimWhitespace = true,
    removeNewlines = false,
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Remove newlines
  if (removeNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // Remove script tags and event handlers
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '');

  // If no tags allowed, escape all HTML
  if (allowedTags.length === 0) {
    sanitized = sanitizeHtml(sanitized);
  } else {
    // Remove disallowed tags while keeping allowed ones
    const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    sanitized = sanitized.replace(tagPattern, (match, tagName) => {
      return allowedTags.includes(tagName.toLowerCase()) ? match : sanitizeHtml(match);
    });
  }

  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Remove all HTML tags from a string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a filename for safe use
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-_]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 255);
}

/**
 * Sanitize a URL slug
 */
export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
