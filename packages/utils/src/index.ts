// Formatters
export { formatCurrency, formatPhone, formatDate, formatNumber } from './formatters';

// Validators
export { isValidEmail, isValidPhone, isValidZipCode } from './validators';

// CSV utilities
export { parseCSV, generateCSV, downloadCSV } from './csv';

// Safe utilities
export { safeJsonParse, safeJsonStringify } from './safeJson';
export { safeLocalStorage, safeSessionStorage } from './safeStorage';

// Sanitization (DOMPurify-based and utility functions)
export {
  sanitizeHtml,
  escapeHtml,
  sanitizeInput,
  stripHtml,
  sanitizeFilename,
  sanitizeSlug,
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

// Logger
export { logger, createClientLogger, type LogLevel } from './logger';

// Validation schemas (Zod-based)
export * from './validation';
