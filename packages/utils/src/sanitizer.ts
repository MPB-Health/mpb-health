import DOMPurify, { type Config } from 'dompurify';

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

// ============================================================================
// DOMPurify-based Enhanced Sanitization Functions
// ============================================================================

/**
 * Rich text sanitization config for TipTap/email content
 * Allows safe HTML tags while removing dangerous elements
 */
const RICH_TEXT_CONFIG: Config = {
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'span', 'div',
    'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'ins',
    'sub', 'sup', 'mark', 'small',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Links (href sanitized separately)
    'a',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    // Media (src sanitized)
    'img',
    // Blockquote and code
    'blockquote', 'pre', 'code',
    // Horizontal rule
    'hr',
  ],
  ALLOWED_ATTR: [
    // Common attributes
    'id', 'class', 'style',
    // Links
    'href', 'title', 'target', 'rel',
    // Images
    'src', 'alt', 'width', 'height',
    // Tables
    'colspan', 'rowspan', 'scope',
    // Data attributes (for rich text editors)
    'data-*',
  ],
  ALLOW_DATA_ATTR: true,
  // Force all links to be noopener/noreferrer
  ADD_ATTR: ['target', 'rel'],
  // Remove dangerous URI schemes
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Don't return DOM nodes
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitize rich text/HTML content (for TipTap, email templates, etc.)
 * Allows safe formatting tags while removing XSS vectors
 *
 * @param html - The HTML content to sanitize
 * @param options - Additional DOMPurify options
 * @returns Sanitized HTML string
 */
export function sanitizeRichText(
  html: string,
  options: Partial<Config> = {}
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const config = { ...RICH_TEXT_CONFIG, ...options };
  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitize PHI (Protected Health Information) fields
 * Strips ALL HTML tags - use for names, SSN, member IDs, etc.
 *
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Plain text with all HTML removed
 */
export function sanitizePHI(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // First pass: DOMPurify with no allowed tags
  let sanitized = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Second pass: remove any remaining HTML-like content
  sanitized = sanitized
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Safe URL protocols for sanitizeUrl
 */
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Sanitize a URL to only allow safe protocols
 * Prevents javascript:, data:, vbscript:, and other dangerous schemes
 *
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if dangerous
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Trim and normalize
  const trimmed = url.trim();

  // Check for empty or obviously invalid
  if (!trimmed || trimmed.length > 2048) {
    return '';
  }

  try {
    // Try to parse as URL
    const parsed = new URL(trimmed);

    // Check protocol
    if (!SAFE_URL_PROTOCOLS.includes(parsed.protocol.toLowerCase())) {
      return '';
    }

    // Return the sanitized URL
    return parsed.href;
  } catch {
    // If it's a relative URL, check for dangerous patterns
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      // Relative URLs are okay, but check for protocol injection
      if (/^[a-z]+:/i.test(trimmed.replace(/^\.?\.?\//, ''))) {
        return '';
      }
      return trimmed;
    }

    // Check for dangerous protocols without valid URL structure
    const lowerUrl = trimmed.toLowerCase();
    if (
      lowerUrl.startsWith('javascript:') ||
      lowerUrl.startsWith('data:') ||
      lowerUrl.startsWith('vbscript:') ||
      lowerUrl.startsWith('file:')
    ) {
      return '';
    }

    // Assume relative URL
    return trimmed;
  }
}

/**
 * XSS attack patterns for detection
 */
const XSS_PATTERNS = [
  // Script tags
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  // Event handlers
  /\bon\w+\s*=/gi,
  // JavaScript protocol
  /javascript\s*:/gi,
  // Data protocol with scripts
  /data\s*:[^,]*base64[^,]*,/gi,
  // VBScript protocol
  /vbscript\s*:/gi,
  // Expression (IE)
  /expression\s*\(/gi,
  // Embedded SVG with scripts
  /<svg[^>]*onload/gi,
  // iframe injection
  /<iframe\b[^>]*>/gi,
  // object/embed tags
  /<(?:object|embed|applet)\b[^>]*>/gi,
  // Encoded script tags
  /%3Cscript/gi,
  // Unicode encoded
  /\\u003c\s*script/gi,
  // HTML entity encoded
  /&lt;\s*script/gi,
  // Base64 javascript
  /data:text\/html;base64/gi,
  // Form action injection
  /<form[^>]*action\s*=/gi,
  // Meta refresh injection
  /<meta[^>]*http-equiv\s*=\s*["']?refresh/gi,
];

/**
 * XSS pattern detection result
 */
export interface XSSDetectionResult {
  detected: boolean;
  patterns: string[];
  input: string;
  timestamp: Date;
}

/**
 * Detect potential XSS patterns in input
 * Use for logging/alerting, not as primary defense (always sanitize!)
 *
 * @param input - The input to check
 * @returns Detection result with matched patterns
 */
export function detectXSSPatterns(input: string): XSSDetectionResult {
  const result: XSSDetectionResult = {
    detected: false,
    patterns: [],
    input: input.substring(0, 500), // Truncate for logging
    timestamp: new Date(),
  };

  if (!input || typeof input !== 'string') {
    return result;
  }

  for (const pattern of XSS_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;

    if (pattern.test(input)) {
      result.detected = true;
      result.patterns.push(pattern.source);
    }
  }

  return result;
}

/**
 * Sanitize user input and detect XSS patterns
 * Combines sanitization with detection for logging
 *
 * @param input - The input to sanitize and check
 * @param options - Sanitization options
 * @returns Object with sanitized value and detection result
 */
export function sanitizeWithDetection(
  input: string,
  options: Parameters<typeof sanitizeInput>[1] = {}
): {
  sanitized: string;
  detection: XSSDetectionResult;
} {
  const detection = detectXSSPatterns(input);
  const sanitized = sanitizeInput(input, options);

  return {
    sanitized,
    detection,
  };
}
