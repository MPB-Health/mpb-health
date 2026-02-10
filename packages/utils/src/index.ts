// Formatters
export { formatCurrency, formatPhone, formatDate, formatNumber } from './formatters';

// Validators
export { isValidEmail, isValidPhone, isValidZipCode } from './validators';

// CSV utilities
export { parseCSV, generateCSV, downloadCSV } from './csv';

// Safe utilities
export { safeJsonParse, safeJsonStringify } from './safeJson';
export { safeLocalStorage, safeSessionStorage } from './safeStorage';

// Sanitization (basic and enhanced with DOMPurify)
export {
  sanitizeHtml,
  sanitizeInput,
  stripHtml,
  sanitizeFilename,
  sanitizeSlug,
  // DOMPurify-based enhanced functions
  sanitizeRichText,
  sanitizePHI,
  sanitizeUrl,
  detectXSSPatterns,
  sanitizeWithDetection,
  type XSSDetectionResult,
} from './sanitizer';

// String utilities
export { slugify, truncate, capitalize } from './strings';

// Date utilities
export { parseDate, formatRelativeTime, isDateInPast, isDateInFuture } from './dates';

// Validation schemas (Zod-based)
export * from './validation';
